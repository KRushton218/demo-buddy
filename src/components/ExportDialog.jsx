import React, { useState, useEffect } from 'react';
import './ExportDialog.css';

function ExportDialog({ clips, onClose }) {
  const [quality, setQuality] = useState('medium');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const [exportedPath, setExportedPath] = useState(null);

  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.onExportProgress) return;

    // Subscribe to progress updates
    const unsubscribe = window.electronAPI.onExportProgress((data) => {
      setProgress(data.percent);
      setStage(data.stage);
    });

    return unsubscribe;
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress(0);
      setStage('Starting export...');

      // Show save dialog
      const outputPath = await window.electronAPI.exportSaveDialog();
      if (!outputPath) {
        setIsExporting(false);
        return;
      }

      // Start export
      const result = await window.electronAPI.exportStart(clips, outputPath, quality);

      if (result.success) {
        setProgress(100);
        setStage('Export complete!');
        setExportedPath(result.outputPath);
      } else {
        setError(result.error || 'Export failed');
        setIsExporting(false);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'An error occurred during export');
      setIsExporting(false);
    }
  };

  const handleReveal = async () => {
    if (exportedPath && window.electronAPI.exportReveal) {
      await window.electronAPI.exportReveal(exportedPath);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="export-overlay" onClick={handleClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Export Video</h2>

        {!isExporting && !exportedPath && (
          <>
            <div className="export-info">
              <div className="info-row">
                <span className="info-label">Clips:</span>
                <span className="info-value">{clips.length}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Duration:</span>
                <span className="info-value">{formatTime(totalDuration)}</span>
              </div>
            </div>

            <div className="export-settings">
              <label htmlFor="quality">Quality:</label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="high">High (larger file, slower)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="low">Low (smaller file, faster)</option>
              </select>
            </div>

            {error && (
              <div className="export-error">
                {error}
              </div>
            )}

            <div className="export-actions">
              <button className="export-button" onClick={handleExport}>
                Start Export
              </button>
              <button className="cancel-button" onClick={handleClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {isExporting && !exportedPath && (
          <div className="export-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {progress}% - {stage}
            </div>
          </div>
        )}

        {exportedPath && (
          <div className="export-complete">
            <div className="success-icon">✓</div>
            <p>Export completed successfully!</p>
            <div className="export-actions">
              <button className="export-button" onClick={handleReveal}>
                Show in Folder
              </button>
              <button className="cancel-button" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportDialog;
