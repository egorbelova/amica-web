import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icons/AutoIcons';
import { JWTVideo } from './JWTVideo';
import { getAccessTokenOrThrow, refreshTokenIfNeeded } from '@/utils/authStore';

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

  useEffect(() => {
    setIconVisible(true);
    const timeout = setTimeout(() => setIconVisible(false), 700);
    return () => clearTimeout(timeout);
  }, [showControls]);

  // if (!objectUrl) return null;

  const [token, setToken] = useState<string | null>(null);

  // useEffect(() => {
  //   let isMounted = true;

  //   async function fetchToken() {
  //     try {
  //       await refreshTokenIfNeeded();
  //       const accessToken = await getAccessTokenOrThrow();
  //       if (isMounted) {
  //         setToken(accessToken);
  //       }
  //     } catch {
  //       if (isMounted) {
  //         setToken(null);
  //       }
  //     }
  //   }

  //   fetchToken();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [full]);
  console.log('Rendering VideoLayout with full URL:', full);
  return (
    <div
      onClick={() => setShowControls((prev) => !prev)}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <JWTVideo
        key={full}
        url={full}
        // token={token}
        has_audio={has_audio}
        muted={!showControls}
      />
      {/* <video
        ref={videoRef}
        src={full}
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
        preload='metadata'
        controls
        style={{
          width: '100%',
          height: '300px',
          display: 'block',
          objectFit: 'cover',
        }}
      /> */}

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
