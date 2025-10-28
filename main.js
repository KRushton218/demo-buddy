const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

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

// ========== PROJECT MANAGEMENT ==========

// Get project directory path
function getProjectDir() {
  const userDataPath = app.getPath('userData');
  const projectDir = path.join(userDataPath, 'current-project');
  return projectDir;
}

// Ensure project directory exists
function ensureProjectDir() {
  const projectDir = getProjectDir();
  const sourcesDir = path.join(projectDir, 'sources');

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true });
  }

  return projectDir;
}

// Get project JSON path
function getProjectFilePath() {
  return path.join(getProjectDir(), 'project.json');
}

// Initialize or load project
ipcMain.handle('project:init', async () => {
  const projectDir = ensureProjectDir();
  const projectFilePath = getProjectFilePath();

  // Check if project file exists
  if (fs.existsSync(projectFilePath)) {
    // Load existing project
    const projectData = JSON.parse(fs.readFileSync(projectFilePath, 'utf-8'));
    return projectData;
  } else {
    // Create new project
    const newProject = {
      id: Date.now().toString(),
      name: 'Untitled Project',
      clips: [],
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(projectFilePath, JSON.stringify(newProject, null, 2));
    return newProject;
  }
});

// Save project
ipcMain.handle('project:save', async (event, projectData) => {
  const projectFilePath = getProjectFilePath();

  const updatedProject = {
    ...projectData,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(projectFilePath, JSON.stringify(updatedProject, null, 2));
  return { success: true };
});

// Import video - copy to project sources folder
ipcMain.handle('project:import-video', async (event, videoPath) => {
  const projectDir = ensureProjectDir();
  const sourcesDir = path.join(projectDir, 'sources');

  const fileName = path.basename(videoPath);
  const destPath = path.join(sourcesDir, fileName);

  // Copy file to sources directory
  fs.copyFileSync(videoPath, destPath);

  const stats = fs.statSync(destPath);

  // Return relative path from project root
  const relativePath = path.join('sources', fileName);

  return {
    name: fileName,
    path: destPath, // Full path for video element
    relativePath: relativePath, // For storing in project.json
    size: stats.size,
  };
});

// Get project directory path (for debugging/manual access)
ipcMain.handle('project:get-path', async () => {
  return getProjectDir();
});

// Open project directory in file explorer
ipcMain.handle('project:reveal', async () => {
  const { shell } = require('electron');
  const projectDir = ensureProjectDir();
  shell.openPath(projectDir);
  return projectDir;
});

// ========== VIDEO EXPORT ==========

// Quality presets for export
const QUALITY_PRESETS = {
  high: { crf: 18, preset: 'slow' },
  medium: { crf: 23, preset: 'medium' },
  low: { crf: 28, preset: 'fast' }
};

// Export video to MP4
ipcMain.handle('export:start', async (event, clips, outputPath, quality = 'medium') => {
  try {
    const projectDir = getProjectDir();
    const qualitySettings = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;

    // Sort clips by timeline position
    const sortedClips = [...clips].sort((a, b) => a.timelineStart - b.timelineStart);

    // Create a temporary file list for FFmpeg concat
    const tempDir = app.getPath('temp');
    const listFilePath = path.join(tempDir, `demobuddy-export-${Date.now()}.txt`);
    const tempFiles = [];

    // Process each clip: trim and save as temp file
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const tempOutputPath = path.join(tempDir, `demobuddy-clip-${Date.now()}-${i}.mp4`);
      tempFiles.push(tempOutputPath);

      // Resolve source path (handle both absolute and relative paths)
      let sourcePath = clip.sourcePath;
      if (!path.isAbsolute(sourcePath)) {
        sourcePath = path.join(projectDir, sourcePath);
      }

      // Trim clip using FFmpeg
      await new Promise((resolve, reject) => {
        const duration = clip.sourceEnd - clip.sourceStart;

        ffmpeg(sourcePath)
          .setStartTime(clip.sourceStart)
          .setDuration(duration)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            `-crf ${qualitySettings.crf}`,
            `-preset ${qualitySettings.preset}`,
            '-pix_fmt yuv420p'
          ])
          .output(tempOutputPath)
          .on('progress', (progress) => {
            const clipProgress = ((i + (progress.percent / 100)) / sortedClips.length) * 50;
            event.sender.send('export:progress', {
              percent: Math.round(clipProgress),
              stage: `Processing clip ${i + 1}/${sortedClips.length}`
            });
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    }

    // Create concat list file
    const concatList = tempFiles.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listFilePath, concatList);

    // Concatenate all clips
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .videoCodec('copy')
        .audioCodec('copy')
        .output(outputPath)
        .on('progress', (progress) => {
          const totalProgress = 50 + (progress.percent / 100) * 50;
          event.sender.send('export:progress', {
            percent: Math.round(totalProgress),
            stage: 'Finalizing video'
          });
        })
        .on('end', () => {
          // Clean up temp files
          tempFiles.forEach(f => {
            try { fs.unlinkSync(f); } catch (e) {}
          });
          try { fs.unlinkSync(listFilePath); } catch (e) {}
          resolve();
        })
        .on('error', (err) => {
          // Clean up temp files on error
          tempFiles.forEach(f => {
            try { fs.unlinkSync(f); } catch (e) {}
          });
          try { fs.unlinkSync(listFilePath); } catch (e) {}
          reject(err);
        })
        .run();
    });

    return { success: true, outputPath };

  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

// Show save dialog for export
ipcMain.handle('export:save-dialog', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Video',
    defaultPath: path.join(app.getPath('videos'), 'export.mp4'),
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] }
    ]
  });

  if (canceled || !filePath) {
    return null;
  }

  return filePath;
});

// Reveal exported file in file explorer
ipcMain.handle('export:reveal', async (event, filePath) => {
  const { shell } = require('electron');
  shell.showItemInFolder(filePath);
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