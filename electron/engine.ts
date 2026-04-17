import { ChildProcess, spawn } from "child_process";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { app, BrowserWindow } from "electron";

const WS_PORT = 9150;

export class EngineManager {
  private process: ChildProcess | null = null;
  private wss: WebSocketServer | null = null;
  private engineSocket: WebSocket | null = null;
  private mainWindow: BrowserWindow | null = null;
  private starting = false;

  setWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  async start() {
    if (this.starting || this.process) return;
    this.starting = true;

    await this.cleanup();

    try {
      await new Promise<void>((resolve, reject) => {
        this.wss = new WebSocketServer({ port: WS_PORT }, () => resolve());
        this.wss.on("error", (err) => reject(err));
      });
    } catch (err: any) {
      console.error("[engine] Failed to start WS server:", err.message);
      this.starting = false;
      return;
    }

    this.wss!.on("connection", (ws) => {
      console.log("[engine] Python connected via WebSocket");
      this.engineSocket = ws;
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.mainWindow?.webContents.send("engine-event", msg);
        } catch {}
      });
      ws.on("close", () => { this.engineSocket = null; });
    });

    const engineDir = app.isPackaged
      ? path.join(path.dirname(app.getPath("exe")), "..", "Resources", "engine")
      : path.join(__dirname, "..", "engine");
    const pythonPath = path.join(engineDir, ".venv", "bin", "python3");

    console.log("[engine] Starting Python:", pythonPath);
    // --show-camera: opens smooth OpenCV window directly (no IPC lag)
    this.process = spawn(pythonPath, [
      "-m", "ws_bridge", "--ws-url", `ws://localhost:${WS_PORT}`, "--show-camera",
    ], {
      cwd: engineDir,
      stdio: ["pipe", "ignore", "pipe"],
      env: { ...process.env, PYTHONPATH: engineDir },
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trim();
      if (text) console.log("[engine]", text);
    });

    this.process.on("exit", (code, signal) => {
      console.log(`[engine] exited code=${code} signal=${signal}`);
      this.process = null;
      this.engineSocket = null;
      this.mainWindow?.webContents.send("engine-event", {
        type: "status", running: false, fps: 0, hands: 0, enabled: false,
      });
    });

    this.starting = false;
  }

  sendCommand(data: any) {
    if (this.engineSocket?.readyState === WebSocket.OPEN) {
      this.engineSocket.send(JSON.stringify(data));
    }
  }

  private cleanup(): Promise<void> {
    return new Promise((resolve) => {
      if (this.process) {
        this.process.kill();
        this.process = null;
      }
      this.engineSocket = null;
      if (this.wss) {
        this.wss.close(() => { this.wss = null; resolve(); });
      } else {
        resolve();
      }
    });
  }

  async stop() {
    this.sendCommand({ type: "command", action: "stop" });
    await new Promise((r) => setTimeout(r, 500));
    await this.cleanup();
  }
}
