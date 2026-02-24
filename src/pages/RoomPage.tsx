import React, { useEffect, useState, useRef } from 'react';
import LeftSideBar from '../components/LeftSideBar/LeftSideBar';
import MainChatWindow from '../components/MainChatWindow/MainChatWindow';
import { websocketManager } from '../utils/websocket-manager';
import './room.scss';
import styles from './RoomPage.module.scss';
import { useSettings } from '@/contexts/settings/context';
// import BackgroundComponent from '../components/BackgroundComponent/BackgroundComponent';
// import { usePageStack } from '@/contexts/useStackHistory';

const RoomPage: React.FC = () => {
  // const { push } = usePageStack();

  // useEffect(() => {
  //   push('home');
  // }, []);

  useEffect(() => {
    websocketManager.connect();
    return () => {
      websocketManager.disconnect();
    };
  }, []);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { settings } = useSettings();
  const activeWallpaper = settings.activeWallpaper;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  const [, setIsPlaying] = useState(false);

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

  return (
    <>
      {(windowWidth > 768 || settings.useBackgroundThroughoutTheApp) && (
        <>
          {activeWallpaper?.url && (
            <>
              {activeWallpaper?.type === 'photo' && (
                <>
                  {windowWidth > 768 && (
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
                        alt='Wallpaper'
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
                      alt='Wallpaper'
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
              {activeWallpaper?.type === 'video' && (
                <>
                  {windowWidth > 768 && (
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
                        preload='metadata'
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
                      preload='metadata'
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
          )}
        </>
      )}
      {/* {windowWidth > 768 && <BackgroundComponent />} */}
      <div className={styles.roomPageContainer}>
        <LeftSideBar />
        <MainChatWindow />
      </div>
    </>
  );
};

export default RoomPage;
