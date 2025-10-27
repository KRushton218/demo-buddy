import React, { useState, useEffect } from 'react';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import Sidebar from './components/Sidebar';
import './App.css';

// Generate unique IDs for clips
let clipIdCounter = 0;
const generateClipId = () => `clip_${++clipIdCounter}`;

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleVideosAdded = (newVideos) => {
    setVideos((prevVideos) => [...prevVideos, ...newVideos]);
    // Auto-select first video if none selected
    if (!selectedVideo && newVideos.length > 0) {
      setSelectedVideo(newVideos[0]);
    }
  };

  const handleRemoveVideo = (index) => {
    const videoToRemove = videos[index];
    setVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));

    // If removing the selected video, clear selection or select next
    if (selectedVideo === videoToRemove) {
      if (videos.length > 1) {
        const nextIndex = index === videos.length - 1 ? index - 1 : index;
        setSelectedVideo(videos[nextIndex === index ? nextIndex + 1 : nextIndex]);
      } else {
        setSelectedVideo(null);
      }
    }
  };

  const handleClearAll = () => {
    setVideos([]);
    setSelectedVideo(null);
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur) => {
    setDuration(dur);

    // When a video is loaded, create an initial clip for the entire video
    if (selectedVideo && dur > 0) {
      const existingClip = clips.find(c => c.sourceVideo.path === selectedVideo.path);
      if (!existingClip) {
        const newClip = {
          id: generateClipId(),
          sourceVideo: selectedVideo,
          sourceStart: 0,
          sourceEnd: dur,
          timelineStart: 0,
          duration: dur
        };
        setClips([newClip]);
        setSelectedClipId(newClip.id);
      }
    }
  };

  const handleSeek = (time) => {
    if (window.videoPlayerSeek) {
      window.videoPlayerSeek(time);
    }
  };

  // Find which clip the playhead is currently in
  const findClipAtTime = (time) => {
    return clips.find(clip => {
      const clipEnd = clip.timelineStart + clip.duration;
      return time >= clip.timelineStart && time < clipEnd;
    });
  };

  // Split clip at current time (Cmd+K)
  const handleSplitAtPlayhead = () => {
    const clip = findClipAtTime(currentTime);
    if (!clip) return;

    const relativeTime = currentTime - clip.timelineStart;
    const sourceTime = clip.sourceStart + relativeTime;

    // Create two new clips
    const clip1 = {
      id: generateClipId(),
      sourceVideo: clip.sourceVideo,
      sourceStart: clip.sourceStart,
      sourceEnd: sourceTime,
      timelineStart: clip.timelineStart,
      duration: relativeTime
    };

    const clip2 = {
      id: generateClipId(),
      sourceVideo: clip.sourceVideo,
      sourceStart: sourceTime,
      sourceEnd: clip.sourceEnd,
      timelineStart: clip.timelineStart + relativeTime,
      duration: clip.duration - relativeTime
    };

    // Replace old clip with two new clips
    setClips(prevClips => {
      const index = prevClips.findIndex(c => c.id === clip.id);
      const newClips = [...prevClips];
      newClips.splice(index, 1, clip1, clip2);
      return newClips;
    });

    // Select the second clip
    setSelectedClipId(clip2.id);
  };

  // Delete selected clip (Delete key)
  const handleDeleteClip = () => {
    if (!selectedClipId) return;

    const clipToDelete = clips.find(c => c.id === selectedClipId);
    if (!clipToDelete) return;

    // Remove the clip and adjust timeline positions
    setClips(prevClips => {
      const filtered = prevClips.filter(c => c.id !== selectedClipId);

      // Ripple delete: close the gap by moving clips after the deleted one
      const deletedClipEnd = clipToDelete.timelineStart + clipToDelete.duration;
      return filtered.map(clip => {
        if (clip.timelineStart >= deletedClipEnd) {
          return {
            ...clip,
            timelineStart: clip.timelineStart - clipToDelete.duration
          };
        }
        return clip;
      });
    });

    // Select next clip or previous clip
    const currentIndex = clips.findIndex(c => c.id === selectedClipId);
    if (clips.length > 1) {
      const nextIndex = currentIndex < clips.length - 1 ? currentIndex + 1 : currentIndex - 1;
      if (clips[nextIndex]) {
        setSelectedClipId(clips[nextIndex].id);
      }
    } else {
      setSelectedClipId(null);
    }
  };

  // Select previous/next clip
  const handleSelectPreviousClip = () => {
    const currentIndex = clips.findIndex(c => c.id === selectedClipId);
    if (currentIndex > 0) {
      setSelectedClipId(clips[currentIndex - 1].id);
      // Seek to start of previous clip
      handleSeek(clips[currentIndex - 1].timelineStart);
    }
  };

  const handleSelectNextClip = () => {
    const currentIndex = clips.findIndex(c => c.id === selectedClipId);
    if (currentIndex < clips.length - 1) {
      setSelectedClipId(clips[currentIndex + 1].id);
      // Seek to start of next clip
      handleSeek(clips[currentIndex + 1].timelineStart);
    }
  };

  const handleClipSelect = (clipId) => {
    setSelectedClipId(clipId);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Show shortcuts overlay with '?'
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Space - play/pause
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (window.videoPlayerTogglePlay) {
          window.videoPlayerTogglePlay();
        }
        return;
      }

      // Cmd+K or Ctrl+K - split at playhead
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSplitAtPlayhead();
        return;
      }

      // Delete or Backspace - delete selected clip
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleDeleteClip();
        return;
      }

      // Arrow keys - select previous/next clip
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSelectPreviousClip();
        return;
      }

      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSelectNextClip();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clips, selectedClipId, currentTime]);

  // Calculate total timeline duration from clips
  const totalTimelineDuration = clips.reduce((max, clip) => {
    const clipEnd = clip.timelineStart + clip.duration;
    return Math.max(max, clipEnd);
  }, 0);

  const hasVideos = videos.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>ClipForge</h1>
        <p>Video Editor</p>
      </header>

      <main className="app-main">
        {!hasVideos && <VideoUpload onVideosAdded={handleVideosAdded} />}

        {hasVideos && (
          <div className="workspace">
            <div className="content-area">
              <VideoPlayer
                video={selectedVideo}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onSeek={handleSeek}
              />
              <Timeline
                clips={clips}
                selectedClipId={selectedClipId}
                currentTime={currentTime}
                duration={totalTimelineDuration || duration}
                onSeek={handleSeek}
                onClipSelect={handleClipSelect}
              />
            </div>

            <Sidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            >
              <VideoUpload onVideosAdded={handleVideosAdded} compact />
              <VideoList
                videos={videos}
                selectedVideo={selectedVideo}
                onRemoveVideo={handleRemoveVideo}
                onClearAll={handleClearAll}
                onSelectVideo={handleSelectVideo}
                compact
              />
            </Sidebar>
          </div>
        )}

        {showShortcuts && (
          <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
            <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
              <h2>Keyboard Shortcuts</h2>
              <div className="shortcuts-list">
                <div className="shortcut-item">
                  <kbd>Space</kbd>
                  <span>Play / Pause</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Cmd+K</kbd>
                  <span>Split clip at playhead</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Delete</kbd>
                  <span>Delete selected clip</span>
                </div>
                <div className="shortcut-item">
                  <kbd>←</kbd>
                  <span>Select previous clip</span>
                </div>
                <div className="shortcut-item">
                  <kbd>→</kbd>
                  <span>Select next clip</span>
                </div>
                <div className="shortcut-item">
                  <kbd>?</kbd>
                  <span>Toggle this help</span>
                </div>
              </div>
              <button className="shortcuts-close" onClick={() => setShowShortcuts(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
