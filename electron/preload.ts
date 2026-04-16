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
