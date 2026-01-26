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
  const [iconVisible, setIconVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setIconVisible(true);
    const timeout = setTimeout(() => setIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [showControls]);

  // if (!objectUrl) return null;

  const { autoplayVideos } = useSettings();

  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (clickTimeout.current) return;

    clickTimeout.current = setTimeout(() => {
      setShowControls((prev) => !prev);
      clickTimeout.current = null;
    }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }

    setPlaying((prev) => !prev);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
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

      {has_audio && (
        <Icon
          name={showControls ? 'SoundMaxFill' : 'SoundMuteFill'}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 25,
            height: 25,
            opacity: iconVisible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
