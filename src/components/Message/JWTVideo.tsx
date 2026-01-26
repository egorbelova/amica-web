import { useRef, useEffect } from 'react';

interface JWTVideoProps {
  url: string;
  autoPlay?: boolean;
  className?: string;
  muted?: boolean;
  playing?: boolean;
}

export function JWTVideo({
  url,
  className,
  muted = false,
  autoPlay = true,
  playing = true,
}: JWTVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      //   controls
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
}
