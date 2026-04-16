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
