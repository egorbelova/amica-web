import { useEffect, useRef, useState } from 'react';

interface JWTVideoProps {
  url: string;
  token?: string;
  className?: string;
  has_audio?: boolean | null;
  muted?: boolean;
}

export function JWTVideo({
  url,
  token,
  className,
  has_audio,
  muted = false,
}: JWTVideoProps) {
  return (
    <video
      //   ref={videoRef}
      //   controls
      src={url}
      autoPlay
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
