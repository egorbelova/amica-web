import React, { useState, useEffect, useRef } from 'react';
import { stringToColor, pSBC } from '../../utils/index';
import styles from './Avatar.module.scss';
import type { DisplayMedia, PhotoMedia, VideoMedia, MediaLayer } from '@/types';
import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import { apiFetch } from '@/utils/apiFetch';

export interface AvatarProps {
  displayName: string;
  displayMedia?: DisplayMedia | null;
  className?: string;
  size?: 'small' | 'medium';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface MediaLayerWithUrl extends MediaLayer {
  url?: string;
  ready?: boolean;
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
  const [layers, setLayers] = useState<MediaLayerWithUrl[]>([]);
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

  const [url, setUrl] = useState<string | null>(null);

  async function fetchPrivateMedia(url: string) {
    const res = await apiFetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return objectUrl;
  }

  useEffect(() => {
    if (!displayMedia) return;

    const id = crypto.randomUUID();
    const newLayer: MediaLayerWithUrl = {
      id,
      media: displayMedia,
      ready: false,
    };
    setLayers((prev) => [...prev, newLayer]);

    async function loadUrl() {
      const protectedUrl =
        displayMedia?.type === 'photo'
          ? size === 'medium' && (displayMedia as PhotoMedia).medium
            ? (displayMedia as PhotoMedia).medium
            : (displayMedia as PhotoMedia).small
          : (displayMedia as VideoMedia).url;

      const objectUrl = await fetchPrivateMedia(protectedUrl || '');
      setUrl(objectUrl);
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === id ? { ...layer, url: objectUrl, ready: true } : layer,
        ),
      );
    }

    loadUrl();
  }, [displayMedia, size]);

  const renderMedia = (media: DisplayMedia | null, url?: string) => {
    if (!media || !url) return null;
    if (media.type === 'video') {
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
    }
    return (
      <img
        className={styles.avatarImage}
        src={url}
        alt={`${displayName} avatar`}
        draggable={false}
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
        {renderMedia(currentMedia || null, url || undefined) || (
          <span className={styles.avatarInitials} style={{ fontSize }}>
            {initials}
          </span>
        )}
      </div>

      {layers.map(
        (layer) =>
          layer.ready && (
            <div
              key={layer.id}
              className={styles.avatarLayer}
              style={{
                opacity: 0,
                animation: `fadeIn ${fadeDuration}ms ease forwards`,
              }}
              onAnimationEnd={() => {
                setCurrentMedia(layer.media);
                setLayers((prev) => prev.slice(prev.length - 1));
              }}
            >
              {renderMedia(layer.media, layer.url) || (
                <span className={styles.avatarInitials} style={{ fontSize }}>
                  {initials}
                </span>
              )}
            </div>
          ),
      )}
    </div>
  );
};

export default Avatar;
