import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  memo,
} from 'react';
import { getAccessTokenOrThrow, refreshTokenIfNeeded } from '@/utils/authStore';

interface JWTVideoProps {
  url: string;
  autoPlay?: boolean;
  className?: string;
  muted?: boolean;
  playing?: boolean;
}

const JWTVideoInner = forwardRef<HTMLVideoElement, JWTVideoProps>(
  ({ url, className, muted = false, autoPlay = true, playing = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          await refreshTokenIfNeeded();
          const token = await getAccessTokenOrThrow();
          const separator = url.includes('?') ? '&' : '?';
          const next = `${url}${separator}token=${encodeURIComponent(token)}`;
          if (cancelled) {
            return;
          }
          setSignedUrl((prev) => (prev === next ? prev : next));
        } catch (e) {
          console.error(e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [url]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !signedUrl) return;
      if (video.src !== signedUrl) video.src = signedUrl;
    }, [signedUrl]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !signedUrl) return;
      if (playing && video.paused) video.play().catch(() => {});
      if (!playing && !video.paused) video.pause();
    }, [playing, signedUrl]);

    return (
      <video
        ref={videoRef}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        controlsList='nodownload'
        loop
        preload='none'
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000',
        }}
        className={className}
        disablePictureInPicture
        // pip='false'
      />
    );
  },
);

JWTVideoInner.displayName = 'JWTVideo';

export const JWTVideo = memo(JWTVideoInner);
