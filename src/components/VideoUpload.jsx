import React, { useState } from 'react';
import './VideoUpload.css';

function VideoUpload({ onVideosAdded, compact = false }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async () => {
    try {
      const files = await window.electronAPI.openFileDialog();
      if (files && files.length > 0) {
        onVideosAdded(files);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter((file) => {
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
      return videoExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    });

    if (videoFiles.length > 0) {
      try {
        // Extract file paths from dropped files using webUtils
        const filePaths = videoFiles.map((file) => window.electronAPI.getPathForFile(file));

        // Get video data from main process
        const videoData = await window.electronAPI.getVideoData(filePaths);
        onVideosAdded(videoData);
      } catch (error) {
        console.error('Error processing dropped files:', error);
      }
    }
  };

  if (compact) {
    return (
      <div className="video-upload compact">
        <div
          className={`drop-zone-compact ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg
            className="upload-icon-small"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Video</span>
        </div>
        <button className="file-picker-btn-compact" onClick={handleFileSelect}>
          Browse Files
        </button>
      </div>
    );
  }

  return (
    <div className="video-upload">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <svg
            className="upload-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h3>Drop video files here</h3>
          <p>or</p>
          <button className="file-picker-btn" onClick={handleFileSelect}>
            Choose Files
          </button>
          <p className="supported-formats">
            Supported formats: MP4, MOV, AVI, MKV, WebM, FLV, WMV
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoUpload;
