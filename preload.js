const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  getVideoData: (filePaths) => ipcRenderer.invoke('files:getVideoData', filePaths),
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // Project management
  projectInit: () => ipcRenderer.invoke('project:init'),
  projectSave: (projectData) => ipcRenderer.invoke('project:save', projectData),
  projectImportVideo: (videoPath) => ipcRenderer.invoke('project:import-video', videoPath),
  projectGetPath: () => ipcRenderer.invoke('project:get-path'),
  projectReveal: () => ipcRenderer.invoke('project:reveal'),

  // Video export
  exportStart: (clips, outputPath, quality) => ipcRenderer.invoke('export:start', clips, outputPath, quality),
  exportSaveDialog: () => ipcRenderer.invoke('export:save-dialog'),
  exportReveal: (filePath) => ipcRenderer.invoke('export:reveal', filePath),
  onExportProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('export:progress', subscription);
    return () => ipcRenderer.removeListener('export:progress', subscription);
  },
});
