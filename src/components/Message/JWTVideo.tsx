import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { getAccessTokenOrThrow, refreshTokenIfNeeded } from '@/utils/authStore';

interface JWTVideoProps {
  url: string;
  autoPlay?: boolean;
  className?: string;
  muted?: boolean;
  playing?: boolean;
}

export const JWTVideo = forwardRef<HTMLVideoElement, JWTVideoProps>(
  ({ url, className, muted = false, autoPlay = true, playing = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      const addTokenToUrl = async () => {
        try {
          await refreshTokenIfNeeded();
          const token = await getAccessTokenOrThrow();
          const separator = url.includes('?') ? '&' : '?';
          setSignedUrl(`${url}${separator}token=${encodeURIComponent(token)}`);
        } catch (e) {
          console.error(e);
        }
      };

      addTokenToUrl();
    }, [url]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (playing) video.play().catch(() => {});
      else video.pause();
    }, [playing, signedUrl]);

    return (
      <video
        ref={videoRef}
        disablePictureInPicture
        playsInline
        src={signedUrl}
        autoPlay={autoPlay}
        muted={muted}
        loop
        preload='auto'
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000',
        }}
        className={className}
      />
    );
  },
);
