import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icons/AutoIcons';
import { JWTVideo } from './JWTVideo';
import { useSettings } from '@/contexts/settings/Settings';

export default function VideoLayout({
  full,
  has_audio,
}: {
  full: string;
  has_audio: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundIconVisible, setSoundIconVisible] = useState(false);
  const [playIconVisible, setPlayIconVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const { autoplayVideos } = useSettings();
  const [playing, setPlaying] = useState(autoplayVideos);
  const [muted, setMuted] = useState(autoplayVideos);
  const [buffered, setBuffered] = useState(0);

  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const wasPlayingBeforeDrag = useRef(false);

  const seekByClientX = (clientX: number) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !video.duration) return;

    const rect = bar.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(pos, 1));

    video.currentTime = clamped * video.duration;
    setProgress(clamped * 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    wasPlayingBeforeDrag.current = playing;
    setPlaying(false);

    isDragging.current = true;
    seekByClientX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    seekByClientX(e.clientX);
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDragging.current) return;

    isDragging.current = false;

    if (wasPlayingBeforeDrag.current) {
      setPlaying(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    wasPlayingBeforeDrag.current = playing;
    setPlaying(false);

    isDragging.current = true;
    seekByClientX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    seekByClientX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (wasPlayingBeforeDrag.current) {
      setPlaying(true);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBufferedPlayable = () => {
      if (video.duration > 0 && video.buffered.length > 0) {
        let playableEnd = 0;

        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime) {
            playableEnd = video.buffered.end(i);
          }
        }

        setBuffered(Math.min((playableEnd / video.duration) * 100, 100));
      }
    };

    const updateProgress = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
        requestAnimationFrame(updateProgress);
      }
    };

    video.addEventListener('progress', updateBufferedPlayable);
    requestAnimationFrame(updateProgress);

    return () => {
      video.removeEventListener('progress', updateBufferedPlayable);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
      rafId = requestAnimationFrame(updateProgress);
    };

    rafId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    setSoundIconVisible(true);
    const timeout = setTimeout(() => setSoundIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [muted]);

  useEffect(() => {
    setPlayIconVisible(true);
    const timeout = setTimeout(() => setPlayIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [playing]);

  const lastTap = useRef<number>(0);

  const handleClick = () => {
    if (isDragging.current) return;
    setPlaying((prev) => !prev);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000',
      }}
    >
      <JWTVideo
        ref={videoRef}
        url={full}
        muted={muted}
        autoPlay={autoplayVideos}
        playing={playing}
      />

      <div
        ref={progressRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 20,
          cursor: 'pointer',
          touchAction: 'none',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 5,
            background: 'rgba(255,255,255,0.2)',
            bottom: 0,
          }}
        >
          {/* Buffered */}

          <div
            style={{
              width: `${buffered}%`,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.5)',
              position: 'absolute',
              top: 0,
              left: 0,
              transition: 'width 0.3s ease-in-out',
            }}
          />

          {/* Played */}
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#fff',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </div>
      </div>

      <Icon
        name={playing ? 'Pause' : 'Play'}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 50,
          height: 50,
          opacity: playIconVisible || !playing ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none',
        }}
      />
      {has_audio && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setMuted((prev) => !prev);
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 25,
            height: 25,
            cursor: 'pointer',
            // opacity: soundIconVisible ? 1 : 0,
            // transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <Icon name={muted ? 'SoundMuteFill' : 'SoundMaxFill'} />
        </div>
      )}
    </div>
  );
}
