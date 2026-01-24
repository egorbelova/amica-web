import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icons/AutoIcons';

export default function VideoLayout({ full }) {
  const { objectUrl } = usePrivateMedia(full);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const [iconVisible, setIconVisible] = useState(false);

  useEffect(() => {
    setIconVisible(true);
    const timeout = setTimeout(() => setIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [showControls]);

  if (!objectUrl) return null;

  return (
    <>
      <video
        ref={videoRef}
        src={objectUrl}
        onClick={() => setShowControls((prev) => !prev)}
        onDoubleClick={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
          }
        }}
        // controls={showControls}
        muted={!showControls}
        autoPlay
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
        }}
      />

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
    </>
  );
}
