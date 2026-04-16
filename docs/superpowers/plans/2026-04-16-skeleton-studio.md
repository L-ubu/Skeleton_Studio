# Skeleton_Studio Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Electron + React desktop app for building gesture automations with a visual block editor, powered by the Skaleton_Comand Python engine.

**Architecture:** Electron spawns Python engine as subprocess. WebSocket for JSON events (gestures, config). Stdout pipe for JPEG video frames. React frontend with drag-and-drop linear chain editor.

**Tech Stack:** Electron, React 19, TypeScript, Vite, Zustand, dnd-kit, Tailwind CSS, Python 3.11+, WebSocket (ws)

---

## Chunk 1: Project Scaffold

### Task 1: Initialize Electron + React + Vite project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `index.html`
- Create: `tailwind.config.js`
- Create: `.gitignore`

- [ ] **Step 1:** Initialize npm project and install deps

```bash
cd /Users/luca.vandenweghe/Projects/Skeleton_Studio
npm init -y
npm install react react-dom zustand
npm install -D typescript vite @vitejs/plugin-react electron electron-builder
npm install -D tailwindcss @tailwindcss/vite
npm install -D @types/react @types/react-dom
```

- [ ] **Step 2:** Create `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "dist-renderer",
  },
});
```

- [ ] **Step 3:** Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "skipLibCheck": true
  },
  "include": ["src", "electron"]
}
```

- [ ] **Step 4:** Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Skeleton Studio</title>
</head>
<body class="bg-[#0a0a1a] text-white">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5:** Create `src/main.tsx` and `src/App.tsx`

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-green-400">Skeleton Studio</h1>
    </div>
  );
}
```

`src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 6:** Create `electron/main.ts`

```ts
import { app, BrowserWindow } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#0a0a1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
```

- [ ] **Step 7:** Create `electron/preload.ts`

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  onEngineEvent: (cb: (data: any) => void) =>
    ipcRenderer.on("engine-event", (_e, data) => cb(data)),
  sendToEngine: (data: any) =>
    ipcRenderer.send("engine-command", data),
  onVideoFrame: (cb: (jpeg: ArrayBuffer) => void) =>
    ipcRenderer.on("video-frame", (_e, data) => cb(data)),
});
```

- [ ] **Step 8:** Add scripts to `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "dev:electron": "tsc -p tsconfig.electron.json && VITE_DEV_SERVER_URL=http://localhost:5173 electron dist-electron/main.js",
    "build": "vite build && tsc -p tsconfig.electron.json && electron-builder"
  },
  "main": "dist-electron/main.js"
}
```

Create `tsconfig.electron.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "dist-electron",
    "rootDir": "electron",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["electron"]
}
```

- [ ] **Step 9:** Verify — run `npm run dev` and confirm Vite serves the React app at localhost:5173

- [ ] **Step 10:** Commit

```bash
git init && git add -A && git commit -m "Scaffold Electron + React + Vite + Tailwind project"
```

---

## Chunk 2: Copy Python Engine + WebSocket Bridge

### Task 2: Copy Skaleton_Comand engine into project

**Files:**
- Create: `engine/` (copy from `/Users/luca.vandenweghe/Projects/gesture-command/src/gesture_command/`)
- Create: `engine/requirements.txt`

- [ ] **Step 1:** Copy the Python engine

```bash
cp -r /Users/luca.vandenweghe/Projects/gesture-command/src/gesture_command engine/gesture_command
cp -r /Users/luca.vandenweghe/Projects/gesture-command/config engine/config
```

- [ ] **Step 2:** Create `engine/requirements.txt`

```
mediapipe>=0.10.0
opencv-python>=4.8.0
pynput>=1.7.0
websockets>=12.0
```

- [ ] **Step 3:** Commit

```bash
git add engine/ && git commit -m "Copy Skaleton_Comand engine as Python backend"
```

### Task 3: Create Python WebSocket bridge

**Files:**
- Create: `engine/ws_bridge.py`

This is the new entry point. Instead of the CLI, the Python engine connects to Electron's WebSocket server and streams events + video frames.

- [ ] **Step 1:** Create `engine/ws_bridge.py`

```python
"""WebSocket bridge: connects Python engine to Electron GUI.

Sends: gesture events, continuous values, status updates, JPEG video frames.
Receives: config updates, start/stop commands.
"""

import asyncio
import json
import sys
import cv2
import time
import struct
import websockets

from gesture_command.capture import Camera
from gesture_command.tracker import HandTracker, draw_landmarks
from gesture_command.recognizer import recognize, extended_fingers
from gesture_command.continuous import ContinuousRecognizer
from gesture_command.continuous_actions import create_continuous_action
from gesture_command.filters import FilterPipeline
from gesture_command.actions import execute_action
from gesture_command.mapper import Config


class EngineBridge:
    def __init__(self, ws_url: str = "ws://localhost:9150", config_path: str | None = None):
        self.ws_url = ws_url
        self.config = Config(config_path=config_path)
        self.config.load()
        self.enabled = True
        self._running = False

        self.camera = Camera(camera_index=self.config.camera_index)
        self.tracker = HandTracker(max_hands=2)
        self.filters = FilterPipeline(
            default_dwell_ms=self.config.default_dwell_ms,
            default_cooldown_ms=self.config.default_cooldown_ms,
            confidence_threshold=self.config.confidence_threshold,
        )
        self.continuous_recognizer = ContinuousRecognizer()
        self.continuous_actions = {}
        self._setup_from_config()

    def _setup_from_config(self):
        for gesture_name in self.config.get_discrete_gestures():
            overrides = self.config.get_gesture_overrides(gesture_name)
            if overrides:
                self.filters.set_gesture_overrides(gesture_name, **overrides)

        for channel_name, mapping in self.config.get_continuous_mappings().items():
            smoothing = mapping.get("smoothing", 0.3)
            dead_zone = mapping.get("dead_zone", 0.02)
            activation_ms = mapping.get("activation_ms", 0)
            self.continuous_recognizer.add_channel(channel_name, smoothing, dead_zone, activation_ms)

            action_config = dict(mapping.get("action", {}))
            if "update_interval_ms" in mapping:
                action_config["update_interval_ms"] = mapping["update_interval_ms"]
            if "invert" in mapping:
                action_config["invert"] = mapping["invert"]
            self.continuous_actions[channel_name] = create_continuous_action(action_config)

    async def run(self):
        self._running = True
        self.camera.open()

        async with websockets.connect(self.ws_url) as ws:
            # Start receive task for commands from GUI
            receive_task = asyncio.create_task(self._receive_commands(ws))

            detect_every = 2
            frame_count = 0
            prev_time = time.time()
            fps = 0.0
            cached_hands = []

            try:
                while self._running:
                    frame = self.camera.read()
                    if frame is None:
                        await asyncio.sleep(0.001)
                        continue

                    frame = cv2.flip(frame, 1)
                    frame_count += 1

                    # FPS
                    now = time.time()
                    dt = now - prev_time
                    prev_time = now
                    fps = 0.9 * fps + 0.1 * (1.0 / dt if dt > 0 else 0)

                    if frame_count % detect_every == 0:
                        cached_hands = self.tracker.process(frame)

                        for hand in cached_hands:
                            hand_id = hand.handedness
                            result = recognize(hand, self.config.confidence_threshold)
                            fingers = extended_fingers(hand)
                            gesture_name = result[0] if result else None
                            confidence = result[1] if result else 0.0

                            # Send gesture event to GUI
                            if gesture_name:
                                await ws.send(json.dumps({
                                    "type": "gesture",
                                    "name": gesture_name,
                                    "confidence": round(confidence, 3),
                                    "hand": hand_id,
                                    "fingers": fingers,
                                }))

                            # Filter + fire
                            if self.enabled:
                                fired = self.filters.update(hand_id, gesture_name, confidence if gesture_name else 0.0)
                                if fired:
                                    action = self.config.get_gesture_action(fired)
                                    if action:
                                        execute_action(action)
                                        await ws.send(json.dumps({
                                            "type": "fired",
                                            "gesture": fired,
                                            "hand": hand_id,
                                        }))

                            # Continuous
                            if self.enabled:
                                values = self.continuous_recognizer.update(hand)
                                for ch, val in values.items():
                                    if ch in self.continuous_actions:
                                        self.continuous_actions[ch].execute(val)
                                    await ws.send(json.dumps({
                                        "type": "continuous",
                                        "channel": ch,
                                        "value": round(val, 4),
                                    }))

                    # Draw skeleton on frame and send as JPEG
                    for hand in cached_hands:
                        draw_landmarks(frame, hand)

                    _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    jpeg_bytes = jpeg.tobytes()
                    # Length-prefixed: 4 bytes big-endian length + JPEG data
                    sys.stdout.buffer.write(struct.pack(">I", len(jpeg_bytes)))
                    sys.stdout.buffer.write(jpeg_bytes)
                    sys.stdout.buffer.flush()

                    # Status update every 30 frames
                    if frame_count % 30 == 0:
                        await ws.send(json.dumps({
                            "type": "status",
                            "fps": round(fps, 1),
                            "hands": len(cached_hands),
                            "enabled": self.enabled,
                        }))

                    await asyncio.sleep(0.001)

            finally:
                receive_task.cancel()
                self.camera.close()
                self.tracker.close()

    async def _receive_commands(self, ws):
        try:
            async for message in ws:
                data = json.loads(message)
                if data.get("type") == "command":
                    action = data.get("action")
                    if action == "pause":
                        self.enabled = False
                    elif action == "start":
                        self.enabled = True
                    elif action == "stop":
                        self._running = False
                elif data.get("type") == "config_update":
                    # Future: live config updates from GUI
                    pass
        except websockets.ConnectionClosed:
            self._running = False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ws-url", default="ws://localhost:9150")
    parser.add_argument("--config", default=None)
    args = parser.parse_args()

    bridge = EngineBridge(ws_url=args.ws_url, config_path=args.config)
    asyncio.run(bridge.run())


if __name__ == "__main__":
    main()
```

- [ ] **Step 2:** Commit

```bash
git add engine/ws_bridge.py && git commit -m "Add WebSocket bridge for Python-Electron communication"
```

---

## Chunk 3: Electron Engine Manager

### Task 4: Engine spawner in Electron main process

**Files:**
- Create: `electron/engine.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1:** Create `electron/engine.ts`

```ts
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
    // Start WebSocket server
    this.wss = new WebSocketServer({ port: WS_PORT });
    this.wss.on("connection", (ws) => {
      this.engineSocket = ws;
      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        // Forward engine events to renderer
        this.mainWindow?.webContents.send("engine-event", msg);
      });
      ws.on("close", () => {
        this.engineSocket = null;
      });
    });

    // Spawn Python process
    const engineDir = path.join(__dirname, "..", "engine");
    const pythonPath = path.join(engineDir, ".venv", "bin", "python3");

    this.process = spawn(pythonPath, [
      "-m", "ws_bridge",
      "--ws-url", `ws://localhost:${WS_PORT}`,
    ], {
      cwd: engineDir,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONPATH: engineDir },
    });

    // Read length-prefixed JPEG frames from stdout
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

      // Send as base64 to renderer
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
```

- [ ] **Step 2:** Update `electron/main.ts` to use EngineManager

```ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { EngineManager } from "./engine";

let mainWindow: BrowserWindow | null = null;
const engine = new EngineManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#0a0a1a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  engine.setWindow(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
}

ipcMain.on("engine-command", (_e, data) => {
  engine.sendCommand(data);
});

ipcMain.handle("engine-start", () => engine.start());
ipcMain.handle("engine-stop", () => engine.stop());

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  engine.stop();
  app.quit();
});
```

- [ ] **Step 3:** Install ws dependency

```bash
npm install ws && npm install -D @types/ws
```

- [ ] **Step 4:** Update `electron/preload.ts` with engine controls

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  startEngine: () => ipcRenderer.invoke("engine-start"),
  stopEngine: () => ipcRenderer.invoke("engine-stop"),
  sendToEngine: (data: any) => ipcRenderer.send("engine-command", data),
  onEngineEvent: (cb: (data: any) => void) => {
    ipcRenderer.on("engine-event", (_e, data) => cb(data));
    return () => ipcRenderer.removeAllListeners("engine-event");
  },
  onVideoFrame: (cb: (b64: string) => void) => {
    ipcRenderer.on("video-frame", (_e, data) => cb(data));
    return () => ipcRenderer.removeAllListeners("video-frame");
  },
});
```

- [ ] **Step 5:** Commit

```bash
git add electron/ && git commit -m "Add engine manager: spawn Python, WebSocket bridge, frame pipe"
```

---

## Chunk 4: Zustand Store + Type Definitions

### Task 5: Define block/chain types and app store

**Files:**
- Create: `src/types/blocks.ts`
- Create: `src/types/electron.d.ts`
- Create: `src/store/useStore.ts`

- [ ] **Step 1:** Create `src/types/blocks.ts`

```ts
export type BlockCategory = "hand_trigger" | "continuous_trigger" | "action" | "flow" | "modifier";

export interface BlockDefinition {
  id: string;
  category: BlockCategory;
  label: string;
  color: string;
  icon: string;
  defaultProps: Record<string, any>;
}

export interface BlockInstance {
  id: string;
  definitionId: string;
  props: Record<string, any>;
}

export interface Chain {
  id: string;
  blocks: BlockInstance[];
  enabled: boolean;
  name: string;
}

export type LayoutMode = "scratch" | "split" | "canvas";

export interface EngineStatus {
  running: boolean;
  enabled: boolean;
  fps: number;
  hands: number;
  currentGesture: string | null;
  confidence: number;
}

// All available block definitions
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Hand triggers (green)
  { id: "open_palm", category: "hand_trigger", label: "Open Palm", color: "#00ff88", icon: "✋", defaultProps: { hand: "any", dwell_ms: 400, cooldown_ms: 2000 } },
  { id: "fist", category: "hand_trigger", label: "Fist", color: "#00ff88", icon: "✊", defaultProps: { hand: "any", dwell_ms: 400, cooldown_ms: 800 } },
  { id: "peace", category: "hand_trigger", label: "Peace", color: "#00ff88", icon: "✌️", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "point", category: "hand_trigger", label: "Point", color: "#00ff88", icon: "👆", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "thumbs_up", category: "hand_trigger", label: "Thumbs Up", color: "#00ff88", icon: "👍", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "rock", category: "hand_trigger", label: "Rock", color: "#00ff88", icon: "🤟", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "pinch", category: "hand_trigger", label: "Pinch", color: "#00ff88", icon: "🤏", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "three_fingers", category: "hand_trigger", label: "Three Fingers", color: "#00ff88", icon: "🖖", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  // Continuous triggers (teal)
  { id: "pinch_distance", category: "continuous_trigger", label: "Pinch Distance", color: "#00ccaa", icon: "📏", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.03, activation_ms: 800 } },
  { id: "hand_rotation", category: "continuous_trigger", label: "Hand Rotation", color: "#00ccaa", icon: "🔄", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "palm_height", category: "continuous_trigger", label: "Palm Height", color: "#00ccaa", icon: "📐", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "hand_spread", category: "continuous_trigger", label: "Hand Spread", color: "#00ccaa", icon: "🖐️", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "fist_squeeze", category: "continuous_trigger", label: "Fist Squeeze", color: "#00ccaa", icon: "💪", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  // Actions (gold)
  { id: "keypress", category: "action", label: "Keypress", color: "#ffd700", icon: "⌨️", defaultProps: { keys: "" } },
  { id: "mouse_click", category: "action", label: "Mouse Click", color: "#ffd700", icon: "🖱️", defaultProps: { button: "left" } },
  { id: "shell_command", category: "action", label: "Shell Command", color: "#ffd700", icon: "💻", defaultProps: { command: "" } },
  { id: "play_sound", category: "action", label: "Play Sound", color: "#ffd700", icon: "🔊", defaultProps: { path: "", volume: 1.0 } },
  { id: "notification", category: "action", label: "Notification", color: "#ffd700", icon: "🔔", defaultProps: { title: "", body: "" } },
  // Flow (blue)
  { id: "delay", category: "flow", label: "Delay", color: "#4488ff", icon: "⏱️", defaultProps: { duration_ms: 100 } },
  { id: "repeat", category: "flow", label: "Repeat", color: "#4488ff", icon: "🔁", defaultProps: { count: 2 } },
  // Modifiers (purple)
  { id: "set_hand", category: "modifier", label: "Set Hand", color: "#aa66ff", icon: "🫲", defaultProps: { hand: "left" } },
  { id: "set_dwell", category: "modifier", label: "Set Dwell", color: "#aa66ff", icon: "⏳", defaultProps: { dwell_ms: 300 } },
  { id: "set_cooldown", category: "modifier", label: "Set Cooldown", color: "#aa66ff", icon: "❄️", defaultProps: { cooldown_ms: 500 } },
  { id: "set_confidence", category: "modifier", label: "Set Confidence", color: "#aa66ff", icon: "🎯", defaultProps: { threshold: 0.7 } },
];
```

- [ ] **Step 2:** Create `src/types/electron.d.ts`

```ts
export interface ElectronAPI {
  startEngine: () => Promise<void>;
  stopEngine: () => Promise<void>;
  sendToEngine: (data: any) => void;
  onEngineEvent: (cb: (data: any) => void) => () => void;
  onVideoFrame: (cb: (b64: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

- [ ] **Step 3:** Create `src/store/useStore.ts`

```ts
import { create } from "zustand";
import { Chain, BlockInstance, LayoutMode, EngineStatus, BLOCK_DEFINITIONS } from "../types/blocks";

let chainCounter = 0;
let blockCounter = 0;
const nextChainId = () => `chain_${++chainCounter}`;
const nextBlockId = () => `block_${++blockCounter}`;

interface StudioState {
  // Layout
  layout: LayoutMode;
  setLayout: (mode: LayoutMode) => void;

  // Chains (automations)
  chains: Chain[];
  addChain: () => void;
  removeChain: (chainId: string) => void;
  toggleChain: (chainId: string) => void;
  renameChain: (chainId: string, name: string) => void;
  addBlockToChain: (chainId: string, definitionId: string) => void;
  removeBlockFromChain: (chainId: string, blockId: string) => void;
  updateBlockProps: (chainId: string, blockId: string, props: Record<string, any>) => void;

  // Selection
  selectedChainId: string | null;
  selectedBlockId: string | null;
  selectBlock: (chainId: string, blockId: string) => void;
  clearSelection: () => void;

  // Engine
  engineStatus: EngineStatus;
  setEngineStatus: (status: Partial<EngineStatus>) => void;

  // Video
  currentFrame: string | null;
  setCurrentFrame: (b64: string) => void;
}

export const useStore = create<StudioState>((set) => ({
  layout: "scratch",
  setLayout: (mode) => set({ layout: mode }),

  chains: [],
  addChain: () =>
    set((s) => ({
      chains: [...s.chains, { id: nextChainId(), blocks: [], enabled: true, name: "New Automation" }],
    })),
  removeChain: (chainId) =>
    set((s) => ({ chains: s.chains.filter((c) => c.id !== chainId) })),
  toggleChain: (chainId) =>
    set((s) => ({
      chains: s.chains.map((c) => (c.id === chainId ? { ...c, enabled: !c.enabled } : c)),
    })),
  renameChain: (chainId, name) =>
    set((s) => ({
      chains: s.chains.map((c) => (c.id === chainId ? { ...c, name } : c)),
    })),
  addBlockToChain: (chainId, definitionId) => {
    const def = BLOCK_DEFINITIONS.find((d) => d.id === definitionId);
    if (!def) return;
    const block: BlockInstance = { id: nextBlockId(), definitionId, props: { ...def.defaultProps } };
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId ? { ...c, blocks: [...c.blocks, block] } : c
      ),
    }));
  },
  removeBlockFromChain: (chainId, blockId) =>
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId ? { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) } : c
      ),
    })),
  updateBlockProps: (chainId, blockId, props) =>
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId
          ? { ...c, blocks: c.blocks.map((b) => (b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b)) }
          : c
      ),
    })),

  selectedChainId: null,
  selectedBlockId: null,
  selectBlock: (chainId, blockId) => set({ selectedChainId: chainId, selectedBlockId: blockId }),
  clearSelection: () => set({ selectedChainId: null, selectedBlockId: null }),

  engineStatus: { running: false, enabled: false, fps: 0, hands: 0, currentGesture: null, confidence: 0 },
  setEngineStatus: (status) =>
    set((s) => ({ engineStatus: { ...s.engineStatus, ...status } })),

  currentFrame: null,
  setCurrentFrame: (b64) => set({ currentFrame: b64 }),
}));
```

- [ ] **Step 4:** Commit

```bash
git add src/types/ src/store/ && git commit -m "Add block definitions, TypeScript types, and Zustand store"
```

---

## Chunk 5: Toolbar + Layout Shell + Webcam Viewer

### Task 6: Toolbar with engine controls and layout switcher

**Files:**
- Create: `src/components/Toolbar/Toolbar.tsx`
- Create: `src/components/WebcamViewer/WebcamViewer.tsx`
- Create: `src/components/layouts/ScratchLayout.tsx`
- Create: `src/components/layouts/SplitLayout.tsx`
- Create: `src/components/layouts/CanvasLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1:** Create `src/components/Toolbar/Toolbar.tsx`

```tsx
import { useStore } from "../../store/useStore";
import type { LayoutMode } from "../../types/blocks";

const layouts: { mode: LayoutMode; label: string }[] = [
  { mode: "scratch", label: "Scratch" },
  { mode: "split", label: "Split" },
  { mode: "canvas", label: "Canvas" },
];

export default function Toolbar() {
  const { layout, setLayout, engineStatus, addChain } = useStore();

  const handleStart = () => window.electronAPI?.startEngine();
  const handleStop = () => window.electronAPI?.stopEngine();
  const handlePause = () =>
    window.electronAPI?.sendToEngine({ type: "command", action: engineStatus.enabled ? "pause" : "start" });

  return (
    <div className="h-12 bg-[#111125] border-b border-[#222] flex items-center px-4 gap-4 select-none">
      {/* App title */}
      <span className="text-green-400 font-bold text-sm tracking-wide mr-4">SKELETON STUDIO</span>

      {/* Engine controls */}
      <div className="flex items-center gap-2">
        {!engineStatus.running ? (
          <button onClick={handleStart} className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs font-medium">
            Start Engine
          </button>
        ) : (
          <>
            <button onClick={handlePause} className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-xs font-medium">
              {engineStatus.enabled ? "Pause" : "Resume"}
            </button>
            <button onClick={handleStop} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-xs font-medium">
              Stop
            </button>
          </>
        )}
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${engineStatus.running ? (engineStatus.enabled ? "bg-green-400" : "bg-yellow-400") : "bg-red-400"}`} />
        <span className="text-xs text-gray-400">
          {engineStatus.running ? `${engineStatus.fps} FPS | ${engineStatus.hands} hands` : "Stopped"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Add chain */}
      <button onClick={addChain} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-green-400 text-xs text-green-400">
        + New Chain
      </button>

      {/* Layout switcher */}
      <div className="flex rounded overflow-hidden border border-[#333]">
        {layouts.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setLayout(mode)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              layout === mode ? "bg-green-600 text-white" : "bg-[#1a1a3a] text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Create `src/components/WebcamViewer/WebcamViewer.tsx`

```tsx
import { useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";

export default function WebcamViewer({ className = "" }: { className?: string }) {
  const { currentFrame, engineStatus } = useStore();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && currentFrame) {
      imgRef.current.src = `data:image/jpeg;base64,${currentFrame}`;
    }
  }, [currentFrame]);

  return (
    <div className={`bg-black rounded-lg overflow-hidden relative ${className}`}>
      {currentFrame ? (
        <img ref={imgRef} alt="Webcam" className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
          {engineStatus.running ? "Connecting..." : "Engine not running"}
        </div>
      )}
      {/* Gesture overlay */}
      {engineStatus.currentGesture && (
        <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs">
          <span className="text-green-400 font-bold">{engineStatus.currentGesture.toUpperCase()}</span>
          <span className="text-gray-400 ml-2">{Math.round(engineStatus.confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3:** Create layout shells — `src/components/layouts/ScratchLayout.tsx`

```tsx
import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function ScratchLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: palette */}
      <div className="w-56 border-r border-[#222] overflow-y-auto">{palette}</div>
      {/* Center: canvas */}
      <div className="flex-1 overflow-auto">{canvas}</div>
      {/* Right: webcam + properties */}
      <div className="w-64 border-l border-[#222] flex flex-col">
        <WebcamViewer className="h-40 m-2" />
        <div className="flex-1 overflow-y-auto">{properties}</div>
      </div>
    </div>
  );
}
```

`src/components/layouts/SplitLayout.tsx`:

```tsx
import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function SplitLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top: big webcam */}
      <WebcamViewer className="h-64 m-2" />
      {/* Bottom: palette + canvas + props */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-[#222] overflow-y-auto">{palette}</div>
        <div className="flex-1 overflow-auto">{canvas}</div>
        <div className="w-56 border-l border-[#222] overflow-y-auto">{properties}</div>
      </div>
    </div>
  );
}
```

`src/components/layouts/CanvasLayout.tsx`:

```tsx
import { useState } from "react";
import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function CanvasLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  const [showPalette, setShowPalette] = useState(false);
  const [showProps, setShowProps] = useState(false);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Full canvas */}
      <div className="w-full h-full overflow-auto">{canvas}</div>

      {/* Floating webcam (top-right) */}
      <div className="absolute top-2 right-2 w-48">
        <WebcamViewer className="h-32" />
      </div>

      {/* Floating palette toggle (bottom-left) */}
      <button
        onClick={() => setShowPalette(!showPalette)}
        className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-[#16213e] border border-green-400 text-green-400 text-xs font-medium hover:bg-[#1a2a4e] z-10"
      >
        + Add Block
      </button>

      {/* Floating palette panel */}
      {showPalette && (
        <div className="absolute bottom-14 left-4 w-56 max-h-80 bg-[#111125] border border-[#333] rounded-lg overflow-y-auto shadow-xl z-10">
          {palette}
        </div>
      )}

      {/* Floating properties toggle (bottom-right) */}
      <button
        onClick={() => setShowProps(!showProps)}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-[#16213e] border border-[#aa66ff] text-[#aa66ff] text-xs font-medium hover:bg-[#1a2a4e] z-10"
      >
        Properties
      </button>

      {showProps && (
        <div className="absolute bottom-14 right-4 w-64 max-h-96 bg-[#111125] border border-[#333] rounded-lg overflow-y-auto shadow-xl z-10">
          {properties}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4:** Update `src/App.tsx` to wire everything together

```tsx
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Toolbar from "./components/Toolbar/Toolbar";
import ScratchLayout from "./components/layouts/ScratchLayout";
import SplitLayout from "./components/layouts/SplitLayout";
import CanvasLayout from "./components/layouts/CanvasLayout";

function PlaceholderPalette() {
  return <div className="p-4 text-gray-500 text-xs">Block palette goes here</div>;
}
function PlaceholderCanvas() {
  return <div className="p-4 text-gray-500 text-xs">Flow canvas goes here</div>;
}
function PlaceholderProperties() {
  return <div className="p-4 text-gray-500 text-xs">Properties panel goes here</div>;
}

export default function App() {
  const { layout, setEngineStatus, setCurrentFrame } = useStore();

  useEffect(() => {
    const cleanupEvents = window.electronAPI?.onEngineEvent((data) => {
      if (data.type === "status") {
        setEngineStatus({ running: true, fps: data.fps, hands: data.hands, enabled: data.enabled });
      } else if (data.type === "gesture") {
        setEngineStatus({ currentGesture: data.name, confidence: data.confidence });
      }
    });
    const cleanupFrames = window.electronAPI?.onVideoFrame((b64) => {
      setCurrentFrame(b64);
    });
    return () => { cleanupEvents?.(); cleanupFrames?.(); };
  }, []);

  const palette = <PlaceholderPalette />;
  const canvas = <PlaceholderCanvas />;
  const properties = <PlaceholderProperties />;

  const Layout = layout === "scratch" ? ScratchLayout : layout === "split" ? SplitLayout : CanvasLayout;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a] text-white">
      <Toolbar />
      <Layout palette={palette} canvas={canvas} properties={properties} />
    </div>
  );
}
```

- [ ] **Step 5:** Verify — `npm run dev` shows toolbar with layout switcher, clicking Scratch/Split/Canvas changes layout

- [ ] **Step 6:** Commit

```bash
git add src/ && git commit -m "Add toolbar, layout switcher, webcam viewer, and three layout modes"
```

---

## Chunk 6: Block Palette + Flow Editor + Properties Panel

### Task 7: Block Palette component

**Files:**
- Create: `src/components/BlockPalette/BlockPalette.tsx`

- [ ] **Step 1:** Create `src/components/BlockPalette/BlockPalette.tsx`

```tsx
import { BLOCK_DEFINITIONS, type BlockCategory } from "../../types/blocks";
import { useStore } from "../../store/useStore";

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  hand_trigger: "Hand Triggers",
  continuous_trigger: "Continuous",
  action: "Actions",
  flow: "Flow Control",
  modifier: "Modifiers",
};

const CATEGORY_ORDER: BlockCategory[] = ["hand_trigger", "continuous_trigger", "action", "flow", "modifier"];

export default function BlockPalette() {
  const { selectedChainId, addBlockToChain } = useStore();

  const handleAdd = (definitionId: string) => {
    if (!selectedChainId) return;
    addBlockToChain(selectedChainId, definitionId);
  };

  return (
    <div className="p-3 space-y-4">
      {!selectedChainId && (
        <p className="text-xs text-gray-500 italic">Select a chain first, then drag blocks here</p>
      )}
      {CATEGORY_ORDER.map((cat) => {
        const blocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
        return (
          <div key={cat}>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="space-y-1">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleAdd(block.id)}
                  disabled={!selectedChainId}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors hover:bg-[#1a1a3a] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderLeft: `3px solid ${block.color}` }}
                >
                  <span>{block.icon}</span>
                  <span style={{ color: block.color }}>{block.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2:** Commit

```bash
git add src/components/BlockPalette/ && git commit -m "Add block palette with categorized block library"
```

### Task 8: Flow Editor (chain canvas)

**Files:**
- Create: `src/components/FlowEditor/FlowEditor.tsx`
- Create: `src/components/FlowEditor/ChainRow.tsx`
- Create: `src/components/FlowEditor/BlockNode.tsx`

- [ ] **Step 1:** Create `src/components/FlowEditor/BlockNode.tsx`

```tsx
import { BLOCK_DEFINITIONS, type BlockInstance } from "../../types/blocks";
import { useStore } from "../../store/useStore";

export default function BlockNode({ block, chainId }: { block: BlockInstance; chainId: string }) {
  const { selectedBlockId, selectBlock, removeBlockFromChain } = useStore();
  const def = BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId);
  if (!def) return null;

  const isSelected = selectedBlockId === block.id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectBlock(chainId, block.id); }}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
        isSelected ? "ring-2 ring-white/40 scale-105" : "hover:brightness-125"
      }`}
      style={{
        backgroundColor: def.color + "15",
        borderColor: def.color + "60",
        color: def.color,
      }}
    >
      <span>{def.icon}</span>
      <div>
        <div>{def.label}</div>
        {/* Show key prop preview */}
        {block.props.keys && <div className="text-[9px] opacity-60">{block.props.keys}</div>}
        {block.props.command && <div className="text-[9px] opacity-60 truncate max-w-20">{block.props.command}</div>}
        {block.props.hand && block.props.hand !== "any" && (
          <div className="text-[9px] opacity-60">{block.props.hand} hand</div>
        )}
      </div>
      {/* Remove button */}
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); removeBlockFromChain(chainId, block.id); }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center hover:bg-red-400"
        >
          x
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2:** Create `src/components/FlowEditor/ChainRow.tsx`

```tsx
import { useStore } from "../../store/useStore";
import BlockNode from "./BlockNode";

export default function ChainRow({ chainId }: { chainId: string }) {
  const { chains, selectedChainId, selectBlock, clearSelection, toggleChain, removeChain, renameChain } = useStore();
  const chain = chains.find((c) => c.id === chainId);
  if (!chain) return null;

  const isSelected = selectedChainId === chainId;

  return (
    <div
      onClick={() => { clearSelection(); selectBlock(chainId, ""); }}
      className={`p-3 rounded-xl border transition-colors ${
        isSelected ? "border-green-400/40 bg-[#0d0d2a]" : "border-[#222] bg-[#0a0a1a] hover:border-[#333]"
      }`}
    >
      {/* Chain header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleChain(chainId); }}
          className={`w-3 h-3 rounded-full border ${chain.enabled ? "bg-green-400 border-green-400" : "bg-transparent border-gray-500"}`}
        />
        <input
          value={chain.name}
          onChange={(e) => renameChain(chainId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-xs text-gray-300 font-medium outline-none border-b border-transparent focus:border-gray-500 flex-1"
        />
        <button
          onClick={(e) => { e.stopPropagation(); removeChain(chainId); }}
          className="text-gray-600 hover:text-red-400 text-xs"
        >
          delete
        </button>
      </div>

      {/* Block chain */}
      {chain.blocks.length === 0 ? (
        <p className="text-[10px] text-gray-600 italic pl-5">Click blocks in palette to add</p>
      ) : (
        <div className="flex items-center gap-1 flex-wrap pl-5">
          {chain.blocks.map((block, i) => (
            <div key={block.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600 text-xs">→</span>}
              <BlockNode block={block} chainId={chainId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3:** Create `src/components/FlowEditor/FlowEditor.tsx`

```tsx
import { useStore } from "../../store/useStore";
import ChainRow from "./ChainRow";

export default function FlowEditor() {
  const { chains, addChain, clearSelection } = useStore();

  return (
    <div className="p-4 space-y-3 min-h-full" onClick={() => clearSelection()}>
      {chains.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <p className="text-sm mb-2">No automations yet</p>
          <button onClick={addChain} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium">
            + Create First Chain
          </button>
        </div>
      ) : (
        chains.map((chain) => <ChainRow key={chain.id} chainId={chain.id} />)
      )}
    </div>
  );
}
```

- [ ] **Step 4:** Commit

```bash
git add src/components/FlowEditor/ && git commit -m "Add flow editor with chain rows and block nodes"
```

### Task 9: Properties Panel

**Files:**
- Create: `src/components/PropertiesPanel/PropertiesPanel.tsx`

- [ ] **Step 1:** Create `src/components/PropertiesPanel/PropertiesPanel.tsx`

```tsx
import { useStore } from "../../store/useStore";
import { BLOCK_DEFINITIONS } from "../../types/blocks";

export default function PropertiesPanel() {
  const { chains, selectedChainId, selectedBlockId, updateBlockProps } = useStore();

  const chain = chains.find((c) => c.id === selectedChainId);
  const block = chain?.blocks.find((b) => b.id === selectedBlockId);
  const def = block ? BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId) : null;

  if (!block || !def) {
    return (
      <div className="p-4 text-xs text-gray-600 italic">
        Select a block to edit its properties
      </div>
    );
  }

  const update = (key: string, value: any) => {
    updateBlockProps(selectedChainId!, selectedBlockId!, { [key]: value });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span>{def.icon}</span>
        <h3 className="text-sm font-bold" style={{ color: def.color }}>{def.label}</h3>
      </div>

      {Object.entries(block.props).map(([key, value]) => (
        <div key={key}>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{key.replace(/_/g, " ")}</label>
          {key === "hand" ? (
            <select
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            >
              <option value="any">Any</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          ) : key === "button" ? (
            <select
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
            </select>
          ) : typeof value === "number" ? (
            <input
              type="number"
              value={value}
              onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            />
          ) : typeof value === "boolean" ? (
            <button
              onClick={() => update(key, !value)}
              className={`px-3 py-1 rounded text-xs ${value ? "bg-green-600" : "bg-[#1a1a3a] border border-[#333]"}`}
            >
              {value ? "On" : "Off"}
            </button>
          ) : (
            <input
              type="text"
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              placeholder={key === "keys" ? "e.g. cmd+shift+3" : key === "command" ? "e.g. open -a Safari" : ""}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2:** Commit

```bash
git add src/components/PropertiesPanel/ && git commit -m "Add properties panel for editing block settings"
```

### Task 10: Wire real components into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1:** Replace placeholders with real components

```tsx
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Toolbar from "./components/Toolbar/Toolbar";
import BlockPalette from "./components/BlockPalette/BlockPalette";
import FlowEditor from "./components/FlowEditor/FlowEditor";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import ScratchLayout from "./components/layouts/ScratchLayout";
import SplitLayout from "./components/layouts/SplitLayout";
import CanvasLayout from "./components/layouts/CanvasLayout";

export default function App() {
  const { layout, setEngineStatus, setCurrentFrame } = useStore();

  useEffect(() => {
    const cleanupEvents = window.electronAPI?.onEngineEvent((data) => {
      if (data.type === "status") {
        setEngineStatus({ running: true, fps: data.fps, hands: data.hands, enabled: data.enabled });
      } else if (data.type === "gesture") {
        setEngineStatus({ currentGesture: data.name, confidence: data.confidence });
      }
    });
    const cleanupFrames = window.electronAPI?.onVideoFrame((b64) => {
      setCurrentFrame(b64);
    });
    return () => { cleanupEvents?.(); cleanupFrames?.(); };
  }, []);

  const palette = <BlockPalette />;
  const canvas = <FlowEditor />;
  const properties = <PropertiesPanel />;
  const Layout = layout === "scratch" ? ScratchLayout : layout === "split" ? SplitLayout : CanvasLayout;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a] text-white">
      <Toolbar />
      <Layout palette={palette} canvas={canvas} properties={properties} />
    </div>
  );
}
```

- [ ] **Step 2:** Verify — `npm run dev` shows full app with palette, canvas, properties. Create a chain, add blocks, edit properties.

- [ ] **Step 3:** Commit

```bash
git add src/App.tsx && git commit -m "Wire block palette, flow editor, and properties into layouts"
```

---

## Chunk 7: Save/Load + Final Integration

### Task 11: Save/load automations

**Files:**
- Add save/load methods to `src/store/useStore.ts`
- Add save/load buttons to `src/components/Toolbar/Toolbar.tsx`

- [ ] **Step 1:** Add save/load to store (append to existing `useStore.ts`)

Add to the state interface and implementation:

```ts
// Add to StudioState interface:
saveProject: () => void;
loadProject: () => void;

// Add to create() implementation:
saveProject: () => {
  const state = useStore.getState();
  const project = {
    name: "My Setup",
    version: 1,
    chains: state.chains,
    settings: { layout: state.layout },
  };
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "skeleton-studio-project.json";
  a.click();
  URL.revokeObjectURL(url);
},
loadProject: () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const project = JSON.parse(ev.target?.result as string);
        useStore.setState({
          chains: project.chains || [],
          layout: project.settings?.layout || "scratch",
        });
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
},
```

- [ ] **Step 2:** Add save/load buttons to Toolbar (after the "+ New Chain" button)

```tsx
<button onClick={() => useStore.getState().saveProject()} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-blue-400 text-xs text-blue-400">
  Save
</button>
<button onClick={() => useStore.getState().loadProject()} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-blue-400 text-xs text-blue-400">
  Load
</button>
```

- [ ] **Step 3:** Commit

```bash
git add src/ && git commit -m "Add save/load project functionality"
```

### Task 12: Chain-to-config converter (send automations to Python engine)

**Files:**
- Create: `src/utils/chainToConfig.ts`

- [ ] **Step 1:** Create converter that transforms chains into Python engine config format

```ts
import { Chain, BLOCK_DEFINITIONS } from "../types/blocks";

export function chainsToEngineConfig(chains: Chain[]) {
  const gestures: Record<string, any> = {};
  const continuous: Record<string, any> = {};

  for (const chain of chains) {
    if (!chain.enabled || chain.blocks.length === 0) continue;

    const trigger = chain.blocks[0];
    const triggerDef = BLOCK_DEFINITIONS.find((d) => d.id === trigger.definitionId);
    if (!triggerDef) continue;

    // Collect actions from the rest of the chain
    const actionBlocks = chain.blocks.slice(1);
    const firstAction = actionBlocks.find((b) => {
      const d = BLOCK_DEFINITIONS.find((dd) => dd.id === b.definitionId);
      return d?.category === "action";
    });

    if (triggerDef.category === "hand_trigger" && firstAction) {
      const actionDef = BLOCK_DEFINITIONS.find((d) => d.id === firstAction.definitionId);
      if (!actionDef) continue;

      const action: any = { type: firstAction.definitionId, ...firstAction.props };
      gestures[trigger.definitionId] = {
        action,
        dwell_ms: trigger.props.dwell_ms,
        cooldown_ms: trigger.props.cooldown_ms,
      };
    } else if (triggerDef.category === "continuous_trigger" && firstAction) {
      const hand = trigger.props.hand;
      const key = hand && hand !== "any" ? `${trigger.definitionId}:${hand}` : trigger.definitionId;
      const action: any = { type: firstAction.definitionId, ...firstAction.props };
      continuous[key] = {
        action,
        smoothing: trigger.props.smoothing,
        dead_zone: trigger.props.dead_zone,
        activation_ms: trigger.props.activation_ms,
      };
    }
  }

  return { version: 1, settings: {}, gestures, continuous };
}
```

- [ ] **Step 2:** Wire it — when chains change, send config to engine via WebSocket

Add to `App.tsx` useEffect:

```ts
// Send config updates when chains change
useEffect(() => {
  const config = chainsToEngineConfig(chains);
  window.electronAPI?.sendToEngine({ type: "config_update", config });
}, [chains]);
```

- [ ] **Step 3:** Commit

```bash
git add src/ && git commit -m "Add chain-to-config converter and live sync to engine"
```

### Task 13: Set up Python venv in engine/ and verify end-to-end

- [ ] **Step 1:** Create venv and install deps

```bash
cd engine && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

- [ ] **Step 2:** Test full pipeline: `npm run dev` + `npm run dev:electron`, create a chain with open_palm → keypress(space), verify it works with webcam

- [ ] **Step 3:** Final commit

```bash
git add -A && git commit -m "Complete Skeleton_Studio MVP: block editor with live gesture engine"
```

---

## Summary

| Chunk | Tasks | What it builds |
|-------|-------|---------------|
| 1 | Task 1 | Electron + React + Vite + Tailwind scaffold |
| 2 | Tasks 2-3 | Python engine copy + WebSocket bridge |
| 3 | Task 4 | Electron engine spawner + frame pipe reader |
| 4 | Task 5 | Block types, Zustand store |
| 5 | Task 6 | Toolbar, layouts, webcam viewer |
| 6 | Tasks 7-10 | Block palette, flow editor, properties panel |
| 7 | Tasks 11-13 | Save/load, chain→config converter, end-to-end test |
