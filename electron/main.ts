import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
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
    icon: path.join(__dirname, "../build/icon.icns"),
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

  mainWindow.on("closed", () => { mainWindow = null; });
}

ipcMain.on("engine-command", (_e, data) => { engine.sendCommand(data); });
ipcMain.handle("engine-start", () => engine.start());
ipcMain.handle("engine-stop", async () => engine.stop());

app.whenReady().then(() => {
  const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");
  const iconPath = path.join(base, "build", "icon_1024.png");
  app.dock?.setIcon(nativeImage.createFromPath(iconPath));
  createWindow();
});
app.on("window-all-closed", () => { engine.stop(); app.quit(); });
