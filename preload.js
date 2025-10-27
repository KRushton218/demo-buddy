const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  getVideoData: (filePaths) => ipcRenderer.invoke('files:getVideoData', filePaths),
  getPathForFile: (file) => webUtils.getPathForFile(file),
});
