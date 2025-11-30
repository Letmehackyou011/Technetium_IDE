// apps/electron-ui/src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('technetium', {
  // Downloads a model using the repository script. Returns stdout/stderr text on success or throws.
  downloadModel: (url: string, sha?: string) => ipcRenderer.invoke('download-model', url, sha),

  // Health check via main process (pings local model endpoint)
  getHealth: () => ipcRenderer.invoke('model-health'),

  // Start/Stop the model runner (spawn/unspawn the process from main)
  startModel: () => ipcRenderer.invoke('start-model'),
  stopModel: () => ipcRenderer.invoke('stop-model'),

  // simple ping
  ping: () => ipcRenderer.invoke('ping'),
});
