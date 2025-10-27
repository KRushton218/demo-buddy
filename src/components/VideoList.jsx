import React from 'react';
import './VideoList.css';

function VideoList({ videos, selectedVideo, onRemoveVideo, onClearAll, onSelectVideo, compact = false }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (videos.length === 0) {
    return (
      <div className="video-list empty">
        <p>No videos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`video-list ${compact ? 'compact' : ''}`}>
      <div className="video-list-header">
        <h2>{compact ? 'Videos' : 'Uploaded Videos'} ({videos.length})</h2>
        {!compact && (
          <button className="clear-all-btn" onClick={onClearAll}>
            Clear All
          </button>
        )}
      </div>

      <div className="video-items">
        {videos.map((video, index) => (
          <div
            key={index}
            className={`video-item ${selectedVideo === video ? 'selected' : ''} ${compact ? 'compact' : ''}`}
            onClick={() => onSelectVideo(video)}
          >
            <div className="video-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="video-info">
              <div className="video-name" title={video.name}>
                {video.name}
              </div>
              {!compact && (
                <div className="video-meta">
                  {formatFileSize(video.size)}
                </div>
              )}
            </div>
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveVideo(index);
              }}
              title="Remove video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {compact && (
        <button className="clear-all-btn compact" onClick={onClearAll}>
          Clear All
        </button>
      )}
    </div>
  );
}

export default VideoList;
