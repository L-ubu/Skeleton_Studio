import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  onEngineEvent: (cb: (data: any) => void) =>
    ipcRenderer.on("engine-event", (_e, data) => cb(data)),
  sendToEngine: (data: any) =>
    ipcRenderer.send("engine-command", data),
  onVideoFrame: (cb: (jpeg: ArrayBuffer) => void) =>
    ipcRenderer.on("video-frame", (_e, data) => cb(data)),
});
