import React, { useState, useEffect, useRef } from 'react';
import { stringToColor, pSBC } from '../../utils/index';
import styles from './Avatar.module.scss';
import type { DisplayMedia, PhotoMedia, VideoMedia, MediaLayer } from '@/types';

export interface AvatarProps {
  displayName: string;
  displayMedia?: DisplayMedia | null;
  className?: string;
  size?: 'small' | 'medium';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Avatar: React.FC<AvatarProps> = ({
  displayName,
  displayMedia,
  className = '',
  size,
  onClick,
}) => {
  const avatarColor = stringToColor(displayName);
  const middleColor = pSBC(-0.6, avatarColor);
  const darkerColor = pSBC(-0.8, avatarColor);
  const [layers, setLayers] = useState<MediaLayer[]>([]);
  const fadeDuration = 1000;

  const avatarRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(12);
  const [currentMedia, setCurrentMedia] = useState<DisplayMedia | null>(
    displayMedia || null,
  );

  const getInitials = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);

    if (words.length === 0) return '';

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      const firstLetter = words[0].charAt(0).toUpperCase();
      const lastLetter = words[words.length - 1].charAt(0).toUpperCase();
      return firstLetter + lastLetter;
    }
  };

  const initials = getInitials(displayName);

  const avatarStyle = {
    background: !displayMedia
      ? `linear-gradient(0deg, ${darkerColor} 0%, ${middleColor} 35%, ${avatarColor} 100%)`
      : undefined,
  };

  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    const updateFont = () => setFontSize(el.clientWidth * 0.45);
    updateFont();
    const obs = new ResizeObserver(() => updateFont());
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!displayMedia) return;

    const id = Date.now();
    const newLayer: MediaLayer = { id, media: displayMedia };

    setLayers((prev) => [...prev, newLayer]);
  }, [displayMedia]);

  const renderMedia = (media: DisplayMedia | null) => {
    if (!media) return null;
    const isVideo = media.type === 'video';
    const url =
      media.type === 'photo'
        ? size === 'medium' && (media as PhotoMedia).medium
          ? (media as PhotoMedia).medium
          : (media as PhotoMedia).small
        : (media as VideoMedia).url;

    if (isVideo)
      return (
        <video
          className={styles.avatarImage}
          src={url}
          muted
          autoPlay
          loop
          playsInline
          preload='metadata'
        />
      );

    return (
      <img
        className={styles.avatarImage}
        src={url}
        alt={`${displayName} avatar`}
      />
    );
  };

  return (
    <div
      ref={avatarRef}
      className={`${styles.profilePicture} ${className}`}
      style={avatarStyle}
      title={displayName}
      onClick={onClick}
    >
      <div className={styles.avatarLayer}>
        {renderMedia(currentMedia) || (
          <span className={styles.avatarInitials} style={{ fontSize }}>
            {initials}
          </span>
        )}
      </div>

      {layers.map((layer) => (
        <div
          key={layer.id}
          className={styles.avatarLayer}
          style={{
            opacity: 0,
            animation: `fadeIn ${fadeDuration}ms ease forwards`,
          }}
          onAnimationEnd={() => {
            setCurrentMedia(layer.media);
            setLayers((prev) => {
              if (prev.length > 1) {
                return prev.slice(prev.length - 1);
              }
              return prev;
            });
          }}
        >
          {renderMedia(layer.media) || (
            <span className={styles.avatarInitials} style={{ fontSize }}>
              {initials}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Avatar;
