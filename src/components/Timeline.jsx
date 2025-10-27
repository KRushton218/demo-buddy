import React, { useRef, useState } from 'react';
import './Timeline.css';

function Timeline({ clips = [], selectedClipId, currentTime, duration, onSeek, onClipSelect }) {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleTimelineClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClipClick = (clipId, e) => {
    e.stopPropagation();
    if (onClipSelect) {
      onClipSelect(clipId);
    }
  };

  if (clips.length === 0) {
    return (
      <div className="timeline empty">
        <div className="timeline-empty-state">
          <p>Select a video to see timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-info">
          <span className="time-current">{formatTime(currentTime)}</span>
          <span className="time-separator">/</span>
          <span className="time-duration">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-ruler">
          {[0, 0.25, 0.5, 0.75, 1].map((position) => (
            <div
              key={position}
              className="timeline-marker"
              style={{ left: `${position * 100}%` }}
            >
              <div className="timeline-marker-line" />
              <div className="timeline-marker-label">
                {formatTime(position * duration)}
              </div>
            </div>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="timeline-track"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {clips.map((clip) => {
            const clipStartPercent = duration > 0 ? (clip.timelineStart / duration) * 100 : 0;
            const clipWidthPercent = duration > 0 ? (clip.duration / duration) * 100 : 0;
            const isSelected = clip.id === selectedClipId;

            return (
              <div
                key={clip.id}
                className={`timeline-clip ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${clipStartPercent}%`,
                  width: `${clipWidthPercent}%`
                }}
                onClick={(e) => handleClipClick(clip.id, e)}
                title={`${clip.sourceVideo.name} (${formatTime(clip.sourceStart)} - ${formatTime(clip.sourceEnd)})`}
              >
                <div className="timeline-clip-name">{clip.sourceVideo.name}</div>
              </div>
            );
          })}

          <div
            className="timeline-playhead"
            style={{ left: `${playheadPosition}%` }}
          >
            <div className="timeline-playhead-line" />
            <div className="timeline-playhead-handle" />
          </div>

          <div
            className="timeline-progress"
            style={{ width: `${playheadPosition}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default Timeline;
