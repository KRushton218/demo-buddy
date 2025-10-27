const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// Register custom protocol as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      bypassCSP: true,
      supportFetchAPI: true,
      stream: true,
      standard: true,
      secure: true,
    }
  }
]);

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
};

// Handle file dialog
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Videos',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
      }
    ]
  });

  if (canceled) {
    return [];
  }

  const videoData = filePaths.map((filePath) => {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
    };
  });

  return videoData;
});

// Handle dropped files - convert file paths to video data
ipcMain.handle('files:getVideoData', async (event, filePaths) => {
  const videoData = filePaths.map((filePath) => {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
    };
  });
  return videoData;
});

app.whenReady().then(() => {
  // Register custom protocol for serving local media files
  protocol.registerFileProtocol('media', (request, callback) => {
    const url = request.url.substr(8); // Remove 'media://' prefix
    const decodedPath = decodeURIComponent(url);
    callback({ path: decodedPath });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});