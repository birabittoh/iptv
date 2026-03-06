import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoPlayerProps {
  url: string;
  title: string;
}

function getTwitchChannel(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'www.twitch.tv' || parsed.hostname === 'twitch.tv') {
      const channel = parsed.pathname.replace(/^\//, '').split('/')[0];
      return channel || null;
    }
  } catch {}
  return null;
}

const TwitchPlayer: React.FC<{ channel: string; title: string }> = ({ channel, title }) => {
  const parent = window.location.hostname;
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${parent}&autoplay=true`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe
        src={src}
        title={title}
        allowFullScreen
        className="w-full h-full"
        allow="autoplay; fullscreen"
        style={{ border: 'none' }}
      />
    </div>
  );
};

const HlsPlayer: React.FC<{ url: string; title: string }> = ({ url, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error. The stream might be offline.");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error. Trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              setError("An error occurred while loading the stream.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setError("Your device does not support this stream format.");
      });
    } else {
      setError("HLS playback is not supported on this browser.");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group",
        !showControls && "cursor-none"
      )}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onTouchStart={handleUserActivity}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-white font-medium">Loading Stream...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 z-20 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Playback Error</h3>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={toggleFullscreen} className="text-white hover:text-emerald-400 transition-colors" title="Fullscreen (F)">
              <Maximize className="w-6 h-6" />
            </button>
            <button onClick={togglePlay} className="text-white hover:text-emerald-400 transition-colors" title="Play/Pause (Space)">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-emerald-400 transition-colors" title="Mute (M)">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          <div className="text-white font-medium truncate max-w-[200px] md:max-w-md text-right">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const twitchChannel = getTwitchChannel(url);

  if (twitchChannel) {
    return <TwitchPlayer channel={twitchChannel} title={title} />;
  }

  return <HlsPlayer url={url} title={title} />;
};
