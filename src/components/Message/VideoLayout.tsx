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
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundIconVisible, setSoundIconVisible] = useState(false);
  const [playIconVisible, setPlayIconVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const { autoplayVideos } = useSettings();
  const [playing, setPlaying] = useState(autoplayVideos);

  useEffect(() => {
    setSoundIconVisible(true);
    const timeout = setTimeout(() => setSoundIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [showControls]);

  useEffect(() => {
    setPlayIconVisible(true);
    const timeout = setTimeout(() => setPlayIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [videoRef]);

  const lastTap = useRef<number>(0);

  const handlePointerDown = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setShowControls((prev) => !prev);
      lastTap.current = 0;
    } else {
      lastTap.current = now;

      setTimeout(() => {
        if (lastTap.current !== 0) {
          setPlaying((prev) => !prev);
          lastTap.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleProgressClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const video = videoRef.current;
    if (!video) return;

    // const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    // const clickPos = e.clientX - rect.left;
    // const newTime = (clickPos / rect.width) * video.duration;
    // video.currentTime = newTime;
    // setProgress((newTime / video.duration) * 100);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000',
      }}
    >
      <JWTVideo
        ref={videoRef}
        key={full}
        url={full}
        muted={!showControls}
        autoPlay={autoplayVideos}
        playing={playing}
      />

      <div
        onClick={handleProgressClick}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 5,
          background: 'rgba(255,255,255,0.2)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#fff',
          }}
        />
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
        <Icon
          name={showControls ? 'SoundMaxFill' : 'SoundMuteFill'}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 25,
            height: 25,
            opacity: soundIconVisible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
