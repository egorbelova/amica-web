import React, { useEffect, useState } from 'react';
import LeftSideBar from '../components/LeftSideBar/LeftSideBar';
import MainChatWindow from '../components/MainChatWindow/MainChatWindow';
import { websocketManager } from '../utils/websocket-manager';
import './room.scss';
import styles from './RoomPage.module.scss';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '@/contexts/settings/Settings';
import BackgroundComponent from '../components/BackgroundComponent/BackgroundComponent';

const RoomPage: React.FC = () => {
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

  // if ('serviceWorker' in navigator) {
  //   console.log('Service Worker registration');
  //   navigator.serviceWorker.register('/sw.js');
  // }
  console.log(activeWallpaper);
  return (
    <>
      {(windowWidth > 768 || settings.useBackgroundThroughoutTheApp) && (
        <>
          {activeWallpaper?.url && (
            <>
              <img
                src={activeWallpaper.url}
                alt='Wallpaper'
                className={styles.wallpaper}
                style={{
                  filter: `blur(${activeWallpaper.blur}px)`,
                }}
              />
              <video
                src={activeWallpaper.url}
                autoPlay
                muted
                loop
                playsInline
                // @ts-ignore
                fetchPriority='high'
                preload='metadata'
                className={styles.wallpaper}
                style={{
                  filter: `blur(${activeWallpaper.blur}px)`,
                }}
              />
            </>
          )}
          {/* <video
            autoPlay
            muted
            loop
            playsInline
            // @ts-ignore
            fetchPriority='high'
            preload='metadata'
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              minWidth: '100%',
              minHeight: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover',
            }}
          >
            <source
              src='Videos/blue-sky-seen-directly-with-some-clouds_480p_infinity.webm'
              type='video/webm'
            />
            <track kind='captions' label='English' />
            Your browser does not support the video tag.
          </video> */}
        </>
      )}
      {/* {windowWidth > 768 && <BackgroundComponent />} */}

      <LeftSideBar />
      <MainChatWindow />
    </>
  );
};

export default RoomPage;
