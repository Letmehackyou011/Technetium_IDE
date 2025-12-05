import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("technetium", {
  // AI
  askModel: (prompt: string) => ipcRenderer.invoke("askModel", prompt),
  downloadModel: (modelId: string) =>
    ipcRenderer.invoke("download-model", modelId),

  

  // Workspace / FS
  openFolder: () => ipcRenderer.invoke("open-folder"),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath: string, contents: string) =>
    ipcRenderer.invoke("write-file", filePath, contents),
  newFile: (dirPath: string, name: string) =>
    ipcRenderer.invoke("new-file", dirPath, name),
  newFolder: (dirPath: string, name: string) =>
    ipcRenderer.invoke("new-folder", dirPath, name),
  deleteEntry: (fullPath: string) =>
    ipcRenderer.invoke("delete-entry", fullPath),
  renameEntry: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke("rename-entry", oldPath, newPath),
  
});
