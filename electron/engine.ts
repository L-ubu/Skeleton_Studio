import { ChildProcess, spawn } from "child_process";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { BrowserWindow } from "electron";

const WS_PORT = 9150;

export class EngineManager {
  private process: ChildProcess | null = null;
  private wss: WebSocketServer | null = null;
  private engineSocket: WebSocket | null = null;
  private mainWindow: BrowserWindow | null = null;
  private frameBuffer: Buffer = Buffer.alloc(0);

  setWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  start() {
    this.wss = new WebSocketServer({ port: WS_PORT });
    this.wss.on("connection", (ws) => {
      this.engineSocket = ws;
      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        this.mainWindow?.webContents.send("engine-event", msg);
      });
      ws.on("close", () => { this.engineSocket = null; });
    });

    const engineDir = path.join(__dirname, "..", "engine");
    const pythonPath = path.join(engineDir, ".venv", "bin", "python3");

    this.process = spawn(pythonPath, [
      "-m", "ws_bridge", "--ws-url", `ws://localhost:${WS_PORT}`,
    ], {
      cwd: engineDir,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONPATH: engineDir },
    });

    this.process.stdout?.on("data", (chunk: Buffer) => {
      this.frameBuffer = Buffer.concat([this.frameBuffer, chunk]);
      this.processFrames();
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trim();
      if (text) console.log("[engine]", text);
    });

    this.process.on("exit", (code) => {
      console.log(`[engine] exited with code ${code}`);
      this.engineSocket = null;
    });
  }

  private processFrames() {
    while (this.frameBuffer.length >= 4) {
      const frameLen = this.frameBuffer.readUInt32BE(0);
      if (this.frameBuffer.length < 4 + frameLen) break;
      const jpegData = this.frameBuffer.subarray(4, 4 + frameLen);
      this.frameBuffer = this.frameBuffer.subarray(4 + frameLen);
      const b64 = jpegData.toString("base64");
      this.mainWindow?.webContents.send("video-frame", b64);
    }
  }

  sendCommand(data: any) {
    if (this.engineSocket?.readyState === WebSocket.OPEN) {
      this.engineSocket.send(JSON.stringify(data));
    }
  }

  stop() {
    this.sendCommand({ type: "command", action: "stop" });
    setTimeout(() => {
      this.process?.kill();
      this.process = null;
      this.wss?.close();
      this.wss = null;
    }, 1000);
  }
}
