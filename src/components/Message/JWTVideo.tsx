import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

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

    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      if (playing && videoRef.current) {
        videoRef.current.play();
      } else if (!playing && videoRef.current) {
        videoRef.current.pause();
      }
    }, [playing]);

    return (
      <video
        ref={videoRef}
        disablePictureInPicture
        playsInline
        src={url}
        autoPlay={autoPlay}
        muted={muted}
        loop
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
