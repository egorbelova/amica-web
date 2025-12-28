import React, { useState, useEffect, useRef } from 'react';
import { stringToColor, pSBC } from '../../utils/index';
import styles from './Avatar.module.scss';

export interface PhotoMedia {
  type: 'photo';
  small: string;
  medium?: string;
}

export interface VideoMedia {
  type: 'video';
  url: string;
  duration?: number | null;
}

export type DisplayMedia = PhotoMedia | VideoMedia;

export interface AvatarProps {
  displayName: string;
  //@ts-ignore
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
    ...(displayMedia
      ? {}
      : {
          background: `linear-gradient(0deg, ${darkerColor} 0%, ${middleColor} 35%, ${avatarColor} 100%)`,
        }),
  };

  const avatarRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(12);

  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;

    const updateFont = () => {
      setFontSize(el.clientWidth * 0.45);
    };

    updateFont();

    const observer = new ResizeObserver(() => updateFont());
    observer.observe(el);

    return () => observer.disconnect();
  }, [displayName, displayMedia]);

  const isVideo = displayMedia?.type === 'video';
  const mediaUrl =
    displayMedia?.type === 'photo'
      ? size === 'medium' && displayMedia.medium
        ? displayMedia.medium
        : displayMedia.small
      : displayMedia?.url;

  return (
    <div
      ref={avatarRef}
      className={`${styles.profilePicture} ${className}`}
      style={avatarStyle}
      title={displayName}
      onClick={onClick}
    >
      {displayMedia ? (
        isVideo ? (
          <video
            className={styles.avatarImage}
            src={mediaUrl}
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            className={styles.avatarImage}
            src={mediaUrl}
            alt={`${displayName} avatar`}
            loading='eager'
          />
        )
      ) : (
        <span className={styles.avatarInitials} style={{ fontSize }}>
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
