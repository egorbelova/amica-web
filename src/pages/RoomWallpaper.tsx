import React, { useEffect, useRef, useState } from 'react';
import styles from './RoomPage.module.scss';
import { useSettings } from '@/contexts/settings/context';

const DESKTOP_BREAKPOINT = 768;

const RoomWallpaper: React.FC = () => {
  const { settings } = useSettings();
  const activeWallpaper = settings.activeWallpaper;
  const [isDesktopWidth, setIsDesktopWidth] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > DESKTOP_BREAKPOINT,
  );
  const lastIsDesktopRef = useRef(isDesktopWidth);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerWidth > DESKTOP_BREAKPOINT;
      if (next !== lastIsDesktopRef.current) {
        lastIsDesktopRef.current = next;
        setIsDesktopWidth(next);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('canplay', playVideo, { once: true });
    }

    const unlock = () => {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      video.removeEventListener('canplay', playVideo);
      document.removeEventListener('touchstart', unlock);
    };
  }, [activeWallpaper?.url]);

  const showWallpaper =
    (isDesktopWidth || settings.useBackgroundThroughoutTheApp) &&
    activeWallpaper?.url;

  if (!showWallpaper) return null;

  return (
    <>
      {activeWallpaper.type === 'photo' && (
        <>
          {isDesktopWidth && (
            <div
              className={styles.wallpaperGlow}
              style={{
                backgroundColor:
                  settings.activeWallpaperEditMode === 'colour-wash'
                    ? 'var(--mainColor)'
                    : 'transparent',
                filter: `blur(50px) ${settings.activeWallpaperEditMode === 'black-and-white' ? 'grayscale(100%)' : ''}`,
              }}
            >
              <img
                src={activeWallpaper.url}
                alt="Wallpaper"
                className={styles.wallpaper}
                style={{
                  mixBlendMode:
                    settings.activeWallpaperEditMode === 'colour-wash'
                      ? 'multiply'
                      : 'normal',
                }}
              />
            </div>
          )}
          <div
            className={styles.wallpaperContainer}
            style={{
              backgroundColor:
                settings.activeWallpaperEditMode === 'colour-wash'
                  ? 'var(--mainColor)'
                  : 'transparent',
            }}
          >
            <img
              src={activeWallpaper.url}
              alt="Wallpaper"
              className={styles.wallpaper}
              style={{
                filter: `blur(${activeWallpaper.blur}px) ${settings.activeWallpaperEditMode === 'black-and-white' ? 'grayscale(100%)' : ''}`,
                mixBlendMode:
                  settings.activeWallpaperEditMode === 'colour-wash'
                    ? 'overlay'
                    : 'normal',
              }}
            />
          </div>
        </>
      )}
      {activeWallpaper.type === 'video' && (
        <>
          {isDesktopWidth && (
            <div
              className={styles.wallpaperGlow}
              style={{
                backgroundColor:
                  settings.activeWallpaperEditMode === 'colour-wash'
                    ? 'var(--mainColor)'
                    : 'transparent',
                filter: `blur(50px) ${settings.activeWallpaperEditMode === 'black-and-white' ? 'grayscale(100%)' : ''}`,
              }}
            >
              <video
                src={activeWallpaper.url + '#t=0.001'}
                playsInline
                muted
                preload="metadata"
                className={styles.wallpaper}
                style={{
                  mixBlendMode:
                    settings.activeWallpaperEditMode === 'colour-wash'
                      ? 'multiply'
                      : 'normal',
                }}
              />
            </div>
          )}
          <div
            className={styles.wallpaperContainer}
            style={{
              backgroundColor:
                settings.activeWallpaperEditMode === 'colour-wash'
                  ? 'var(--mainColor)'
                  : 'transparent',
            }}
          >
            <video
              ref={videoRef}
              src={activeWallpaper.url + '#t=0.001'}
              playsInline
              muted
              loop
              preload="metadata"
              className={styles.wallpaper}
              style={{
                filter: `blur(${activeWallpaper.blur}px) ${settings.activeWallpaperEditMode === 'black-and-white' ? 'grayscale(100%)' : ''}`,
                mixBlendMode:
                  settings.activeWallpaperEditMode === 'colour-wash'
                    ? 'overlay'
                    : 'normal',
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

export default RoomWallpaper;
