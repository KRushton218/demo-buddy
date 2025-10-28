import React, { useState, useEffect } from 'react';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import Sidebar from './components/Sidebar';
import ExportDialog from './components/ExportDialog';
import './App.css';

// Generate unique IDs for videos and clips
let videoIdCounter = 0;
let clipIdCounter = 0;
const generateVideoId = () => `video_${++videoIdCounter}`;
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);

  const handleVideosAdded = (newVideos) => {
    // Assign unique IDs to each new video
    const videosWithIds = newVideos.map(video => ({
      ...video,
      id: generateVideoId()
    }));

    setVideos((prevVideos) => [...prevVideos, ...videosWithIds]);
    // Auto-select first video if none selected
    if (!selectedVideo && videosWithIds.length > 0) {
      setSelectedVideo(videosWithIds[0]);
    }
  };

  const handleRemoveVideo = (index) => {
    const videoToRemove = videos[index];

    // Remove all clips associated with this video
    setClips(prevClips => {
      // Filter by both videoId (new) and sourcePath (backwards compatibility)
      const clipsToKeep = prevClips.filter(c => {
        // New clips have videoId - use that for matching
        if (c.videoId) {
          return c.videoId !== videoToRemove.id;
        }
        // Old clips without videoId - match by sourcePath
        return c.sourcePath !== videoToRemove.path;
      });

      // Ripple delete: close gaps by adjusting timeline positions
      // Sort by timeline position first
      const sorted = [...clipsToKeep].sort((a, b) => a.timelineStart - b.timelineStart);

      // Close gaps by repositioning clips
      let currentPosition = 0;
      return sorted.map(clip => {
        const newClip = {
          ...clip,
          timelineStart: currentPosition
        };
        currentPosition += clip.duration;
        return newClip;
      });
    });

    // Remove the video from the list
    setVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));

    // If removing the selected video, clear selection or select next
    if (selectedVideo === videoToRemove) {
      if (videos.length > 1) {
        const nextIndex = index < videos.length - 1 ? index : index - 1;
        setSelectedVideo(videos[nextIndex]);
      } else {
        setSelectedVideo(null);
      }
    }

    // Clear selected clip if it belonged to removed video
    setSelectedClipId(prevId => {
      const selectedClip = clips.find(c => c.id === prevId);
      if (selectedClip && selectedClip.videoId === videoToRemove.id) {
        return null;
      }
      return prevId;
    });
  };

  const handleClearAll = () => {
    setVideos([]);
    setSelectedVideo(null);
    setClips([]);
    setSelectedClipId(null);
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur) => {
    setDuration(dur);

    // When a video is loaded, create an initial clip ONLY if no clips exist for this video
    // This prevents overwriting trimmed/edited clips when loading from saved project
    if (selectedVideo && dur > 0 && projectLoaded) {
      const existingClipsForVideo = clips.filter(c => {
        // Check by videoId (new) or sourcePath (backwards compatibility)
        return c.videoId === selectedVideo.id || c.sourcePath === selectedVideo.path;
      });

      if (existingClipsForVideo.length === 0) {
        // No clips exist for this video - create initial clip
        const newClip = {
          id: generateClipId(),
          videoId: selectedVideo.id,
          sourcePath: selectedVideo.path,
          sourceName: selectedVideo.name,
          sourceStart: 0,
          sourceEnd: dur,
          timelineStart: clips.length > 0 ? totalTimelineDuration : 0, // Append to timeline
          duration: dur
        };
        setClips(prevClips => [...prevClips, newClip]);
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
      videoId: clip.videoId,
      sourcePath: clip.sourcePath,
      sourceName: clip.sourceName,
      sourceStart: clip.sourceStart,
      sourceEnd: sourceTime,
      timelineStart: clip.timelineStart,
      duration: relativeTime
    };

    const clip2 = {
      id: generateClipId(),
      videoId: clip.videoId,
      sourcePath: clip.sourcePath,
      sourceName: clip.sourceName,
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

  // Glue clips together - close all gaps
  const handleGlueClips = () => {
    if (clips.length === 0) return;

    // Sort clips by timeline position
    const sorted = [...clips].sort((a, b) => a.timelineStart - b.timelineStart);

    // Close gaps by adjusting timelineStart positions
    let currentPosition = 0;
    const gluedClips = sorted.map(clip => {
      const newClip = {
        ...clip,
        timelineStart: currentPosition
      };
      currentPosition += clip.duration;
      return newClip;
    });

    setClips(gluedClips);
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
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handleSplitAtPlayhead();
        return;
      }

      // Cmd+Shift+G or Ctrl+Shift+G - glue clips (close gaps)
      if (e.key === 'g' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleGlueClips();
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

  // Load project on startup
  useEffect(() => {
    const loadProject = async () => {
      if (window.electronAPI && window.electronAPI.projectInit) {
        try {
          const project = await window.electronAPI.projectInit();

          // Migrate old videos to have IDs if they don't have them
          let migratedVideos = project.videos || [];
          if (migratedVideos.length > 0) {
            migratedVideos = migratedVideos.map(v => {
              if (!v.id) {
                // Old video without ID - assign one
                return { ...v, id: generateVideoId() };
              }
              return v;
            });

            setVideos(migratedVideos);
            setSelectedVideo(migratedVideos[0]);

            // Initialize video ID counter from loaded videos
            const maxVideoId = Math.max(...migratedVideos.map(v => {
              const match = v.id.match(/video_(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
            videoIdCounter = maxVideoId;
          }

          // Migrate old clips to have videoIds if they don't have them
          let migratedClips = project.clips || [];
          if (migratedClips.length > 0) {
            migratedClips = migratedClips.map(c => {
              if (!c.videoId) {
                // Old clip without videoId - find matching video by sourcePath
                const matchingVideo = migratedVideos.find(v => v.path === c.sourcePath);
                if (matchingVideo) {
                  return { ...c, videoId: matchingVideo.id };
                }
                // No matching video found - keep clip as is (will be orphaned)
                return c;
              }
              return c;
            });

            setClips(migratedClips);
            setSelectedClipId(migratedClips[0].id);

            // Initialize clip ID counter from loaded clips
            const maxClipId = Math.max(...migratedClips.map(c => {
              const match = c.id.match(/clip_(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
            clipIdCounter = maxClipId;
          }

          setProjectLoaded(true);
        } catch (error) {
          console.error('Failed to load project:', error);
          setProjectLoaded(true);
        }
      } else {
        setProjectLoaded(true);
      }
    };

    loadProject();
  }, []);

  // Auto-save project when clips or videos change
  useEffect(() => {
    // Don't save until project is loaded (avoid overwriting on startup)
    if (!projectLoaded) return;

    // Debounce saves to avoid too many writes
    const saveTimer = setTimeout(async () => {
      if (window.electronAPI && window.electronAPI.projectSave) {
        try {
          const projectData = {
            clips,
            videos,
          };
          await window.electronAPI.projectSave(projectData);
          console.log('Project auto-saved');
        } catch (error) {
          console.error('Failed to save project:', error);
        }
      }
    }, 300); // Debounce: wait 300ms after last change

    return () => clearTimeout(saveTimer);
  }, [clips, videos, projectLoaded]);

  // Calculate total timeline duration from clips
  const totalTimelineDuration = clips.reduce((max, clip) => {
    const clipEnd = clip.timelineStart + clip.duration;
    return Math.max(max, clipEnd);
  }, 0);

  const hasVideos = videos.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Demo Buddy</h1>
          <p>AI-Powered Video Editor</p>
        </div>
        {clips.length > 0 && (
          <button
            className="export-button-header"
            onClick={() => setShowExportDialog(true)}
            title="Export to MP4"
          >
            Export MP4
          </button>
        )}
      </header>

      <main className="app-main">
        {!hasVideos && <VideoUpload onVideosAdded={handleVideosAdded} />}

        {hasVideos && (
          <div className="workspace">
            <div className="content-area">
              <VideoPlayer
                video={selectedVideo}
                clips={clips}
                currentTime={currentTime}
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
                  <kbd>Cmd+Shift+G</kbd>
                  <span>Glue clips (close gaps)</span>
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

        {showExportDialog && (
          <ExportDialog
            clips={clips}
            onClose={() => setShowExportDialog(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
