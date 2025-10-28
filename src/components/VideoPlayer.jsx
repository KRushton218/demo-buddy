import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ video, clips = [], currentTime: timelineTime, onTimeUpdate, onDurationChange, onSeek }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeClip, setActiveClip] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [video]);

  // Expose seek and togglePlay functions via callback
  useEffect(() => {
    if (onSeek && videoRef.current) {
      window.videoPlayerSeek = (timelinePos) => {
        if (!videoRef.current) return;

        // Find clip at timeline position
        const clip = findClipAtTime(timelinePos);

        if (clip) {
          // Convert timeline position to source time
          const sourceTime = timelineToSourceTime(timelinePos, clip);
          videoRef.current.currentTime = sourceTime;
          setCurrentTime(timelinePos);
        }
      };
    }

    window.videoPlayerTogglePlay = () => {
      togglePlay();
    };

    return () => {
      delete window.videoPlayerSeek;
      delete window.videoPlayerTogglePlay;
    };
  }, [onSeek, isPlaying, clips]);

  // Sync video player when timeline position changes externally (from seeks)
  useEffect(() => {
    if (!videoRef.current || clips.length === 0) return;

    const clip = findClipAtTime(timelineTime);

    if (clip) {
      const expectedSourceTime = timelineToSourceTime(timelineTime, clip);
      const currentSourceTime = videoRef.current.currentTime;

      // Only update if there's a significant difference (avoid feedback loops)
      if (Math.abs(currentSourceTime - expectedSourceTime) > 0.1) {
        videoRef.current.currentTime = expectedSourceTime;
        setActiveClip(clip); // Update active clip when seeking
      }
    }
  }, [timelineTime, clips]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Find which clip contains the given timeline position
  const findClipAtTime = (time) => {
    return clips.find(clip => {
      const clipEnd = clip.timelineStart + clip.duration;
      return time >= clip.timelineStart && time < clipEnd;
    });
  };

  // Convert timeline time to source video time
  const timelineToSourceTime = (timelinePos, clip) => {
    if (!clip) return 0;
    const relativeTime = timelinePos - clip.timelineStart;
    return clip.sourceStart + relativeTime;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || clips.length === 0) return;

    const sourceTime = videoRef.current.currentTime;

    // Use active clip, or find initial clip if not set
    let clip = activeClip;
    if (!clip) {
      clip = findClipAtTime(0); // Start with first clip
      if (clip) {
        setActiveClip(clip);
      } else {
        return; // No clips available
      }
    }

    // Check if we're still within the current clip's boundaries
    if (sourceTime < clip.sourceStart || sourceTime >= clip.sourceEnd) {
      // We've gone outside the current clip

      if (sourceTime >= clip.sourceEnd) {
        // Reached end of current clip - try to find next clip
        const nextClip = clips.find(c => c.timelineStart === clip.timelineStart + clip.duration);

        if (nextClip && nextClip.videoId === clip.videoId) {
          // Next clip is from same source and contiguous - jump to it
          videoRef.current.currentTime = nextClip.sourceStart;
          setActiveClip(nextClip);
        } else {
          // No contiguous next clip from same source - pause
          videoRef.current.pause();
          setIsPlaying(false);
          // Seek timeline to end of current clip
          if (onTimeUpdate) {
            onTimeUpdate(clip.timelineStart + clip.duration);
          }
        }
        return;
      }
    }

    // Calculate timeline position from source time and active clip
    const calculatedTimelinePos = clip.timelineStart + (sourceTime - clip.sourceStart);
    setCurrentTime(calculatedTimelinePos);

    if (onTimeUpdate) {
      onTimeUpdate(calculatedTimelinePos);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (onDurationChange) {
        onDurationChange(dur);
      }
    }
  };


  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className="video-player empty">
        <div className="empty-state">
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
          <p>Select a video to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player">
      <div className="video-player-header">
        <h3>{video.name}</h3>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          src={`media://${video.path}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      <div className="video-controls">
        <button className="play-button" onClick={togglePlay} title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="time-display">
          {formatTime(timelineTime)} / {formatTime(clips.reduce((total, clip) => Math.max(total, clip.timelineStart + clip.duration), 0))}
        </div>

        <div className="spacer"></div>

        <button className="volume-button" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted || volume === 0 ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>

        <input
          type="range"
          className="volume-bar"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          title="Adjust volume"
        />
      </div>
    </div>
  );
}

export default VideoPlayer;
