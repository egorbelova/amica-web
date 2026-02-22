import { useState, useEffect, useLayoutEffect } from 'react';
import SendArea from '../SendArea/SendArea';
import MessageList from '../MessageList/MessageList';
import ChatHeader from '../ChatHeader/ChatHeader';
// import BackgroundComponent from '../BackgroundComponent/BackgroundComponent';
import { useChat } from '@/contexts/ChatContextCore';
import SideBarMedia from '../SideBarMedia/SideBarMedia';
import styles from './MainChatWindow.module.scss';
import { useSettings } from '@/contexts/settings/context';
import wallpaperStyles from '@/pages/RoomPage.module.scss';
import { usePageStack } from '@/contexts/useStackHistory';
import { ActiveProfileTab } from '@/components/Profile/ActiveProfileTab';
import { Icon } from '../Icons/AutoIcons';
import Button from '../ui/button/Button';
import AppearanceMenu from './AppearanceMenu';

const MainChatWindow: React.FC = () => {
  const {
    settings,
    settingsFullWindow,
    setSettingsFullWindow,
    activeProfileTab,
  } = useSettings();
  const { activeWallpaper } = settings;

  const { selectedChat, setSelectedChatId } = useChat();

  const [sideBarVisible, setSideBarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { current } = usePageStack();

  const isSwiped = Boolean(selectedChat);

  useLayoutEffect(() => {
    const margin = isSwiped ? '0%' : '100%';
    document.documentElement.style.setProperty(
      '--swipe-margin-inactive',
      margin,
    );

    return () => {
      document.documentElement.style.setProperty(
        '--swipe-margin-inactive',
        '100%',
      );
    };
  }, [isSwiped]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleHeaderClick = () => {
    setSideBarVisible(true);
  };

  return (
    <div className={`main_chat_window ${isSwiped ? 'swiped' : ''}`}>
      {windowWidth <= 768 && (
        <>
          {activeWallpaper?.url && (
            <div className={wallpaperStyles.wallpaperContainer}>
              {activeWallpaper?.type === 'photo' && (
                <img
                  src={activeWallpaper.url}
                  alt='Wallpaper'
                  className={wallpaperStyles.wallpaper}
                  style={{
                    filter: `blur(${activeWallpaper.blur}px)`,
                  }}
                />
              )}
              {activeWallpaper?.type === 'video' && (
                <video
                  src={activeWallpaper.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload='metadata'
                  className={wallpaperStyles.wallpaper}
                  style={{
                    filter: `blur(${activeWallpaper.blur}px)`,
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
      {/* {windowWidth <= 768 && <BackgroundComponent />} */}
      {current === 'profile' && settingsFullWindow && activeProfileTab && (
        <div className={styles.settingsContainer}>
          <Button
            onClick={() => setSettingsFullWindow(false)}
            className={styles.minimize}
          >
            <Icon name='FullscreenExit' />
          </Button>
          <ActiveProfileTab />
        </div>
      )}
      {selectedChat && (!settingsFullWindow || current === 'chats') && (
        <>
          <ChatHeader
            onChatInfoClick={handleHeaderClick}
            onGoHome={() => {
              setSelectedChatId(null);
              location.hash = '';
            }}
          />
          <div className={`room_wrapper ${sideBarVisible ? 'shifted' : ''}`}>
            <MessageList />
            <SendArea />
          </div>
          <SideBarMedia
            visible={sideBarVisible}
            onClose={() => setSideBarVisible(false)}
          />
        </>
      )}
      {!selectedChat &&
        (!settingsFullWindow || current === 'chats' || !activeProfileTab) && (
          <AppearanceMenu />
        )}
    </div>
  );
};

export default MainChatWindow;
