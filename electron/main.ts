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

ipcMain.on("engine-command", (_e, data) => { engine.sendCommand(data); });
ipcMain.handle("engine-start", () => engine.start());
ipcMain.handle("engine-stop", () => engine.stop());

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { engine.stop(); app.quit(); });
