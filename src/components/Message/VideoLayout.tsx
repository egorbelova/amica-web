import { usePrivateMedia } from '@/hooks/usePrivateMedia';
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
  // const { objectUrl } = usePrivateMedia(full);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const [soundIconVisible, setSoundIconVisible] = useState(false);
  const [playIconVisible, setPlayIconVisible] = useState(false);
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

  // if (!objectUrl) return null;

  const lastTap = useRef<number>(0);

  const handlePointerDown = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setPlaying((prev) => !prev);
      lastTap.current = 0;
    } else {
      lastTap.current = now;

      setTimeout(() => {
        if (lastTap.current !== 0) {
          setShowControls((prev) => !prev);
          lastTap.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <JWTVideo
        key={full}
        url={full}
        muted={!showControls}
        autoPlay={autoplayVideos}
        playing={playing}
      />
      <Icon
        name={playing ? 'Pause' : 'Play'}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 50,
          height: 50,
          opacity: playIconVisible ? 1 : 0,
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
