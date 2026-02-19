import { useState, useEffect } from 'react';
import SendArea from '../SendArea/SendArea';
import MessageList from '../MessageList/MessageList';
import ChatHeader from '../ChatHeader/ChatHeader';
// import BackgroundComponent from '../BackgroundComponent/BackgroundComponent';
import { useChat } from '@/contexts/ChatContextCore';
import SideBarMedia from '../SideBarMedia/SideBarMedia';
import styles from './MainChatWindow.module.scss';
import { useTranslation } from '@/contexts/languageCore';
import { useSettings } from '@/contexts/settings/context';
import wallpaperStyles from '@/pages/RoomPage.module.scss';
import { usePageStack } from '@/contexts/useStackHistory';
import { ActiveProfileTab } from '@/components/Profile/ActiveProfileTab';
import { Icon } from '../Icons/AutoIcons';

const MainChatWindow: React.FC = () => {
  const {
    settings,
    settingsFullWindow,
    setSettingsFullWindow,
    activeProfileTab,
  } = useSettings();
  const { activeWallpaper } = settings;

  const { t } = useTranslation();

  const { selectedChat, setSelectedChatId } = useChat();

  const [sideBarVisible, setSideBarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { current } = usePageStack();

  const [isSwiped, setIsSwiped] = useState(false);
  useEffect(() => {
    if (!selectedChat) {
      setIsSwiped(false);
      document.documentElement.style.setProperty(
        '--swipe-margin-inactive',
        '100%',
      );
      return;
    }
    setIsSwiped(true);
    document.documentElement.style.setProperty('--swipe-margin-inactive', '0%');
  }, [selectedChat]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleHeaderClick = () => {
    setSideBarVisible(true);
  };

  const [appearanceMenuVisible, setAppearanceMenuVisible] = useState(true);
  const tabs: Array<'chats' | 'appearance'> = ['chats', 'appearance'];
  const [activeTab, setActiveTab] = useState<'chats' | 'appearance'>(
    'appearance',
  );

  const handleNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  };

  const handlePrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex]);
  };

  return (
    <div className={`main_chat_window ${isSwiped ? 'swiped' : ''}`}>
      {windowWidth <= 768 && (
        <>
          {activeWallpaper?.url && (
            <>
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
            </>
          )}
        </>
      )}
      {/* {windowWidth <= 768 && <BackgroundComponent />} */}
      {current === 'profile' && settingsFullWindow && activeProfileTab && (
        <div className={styles.settingsContainer}>
          <div
            onClick={() => setSettingsFullWindow(false)}
            className={styles.minimize}
          >
            <Icon name='FullscreenExit' />
          </div>
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
          <div className={styles.noChatContainer}>
            <div
              className={styles.menuSwitch}
              onClick={() => setAppearanceMenuVisible(!appearanceMenuVisible)}
            >
              {appearanceMenuVisible ? 'X' : '?'}
            </div>
            {!appearanceMenuVisible && (
              <div className={styles.noChatText}>
                Select a chat to start messaging
              </div>
            )}
            {appearanceMenuVisible && (
              <div className={styles.tipsMenu}>
                {activeTab === 'appearance' && (
                  <div className={styles.mainContent}>
                    <div className={styles.header}>
                      {t('tipsMenu.appearance')}
                    </div>
                  </div>
                )}
                {activeTab === 'chats' && (
                  <div className={styles.mainContent}>
                    <div className={styles.header}>{t('tipsMenu.chats')}</div>
                  </div>
                )}
                <div className={styles.pageSwitch}>
                  <div className={styles.switchButton} onClick={handlePrevTab}>
                    {'<'} {t('tipsMenu.previousTip')}
                  </div>
                  <div className={styles.switchButton} onClick={handleNextTab}>
                    {t('tipsMenu.nextTip')} {'>'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default MainChatWindow;
