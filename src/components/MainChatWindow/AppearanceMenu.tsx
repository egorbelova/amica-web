import { useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import Button from '../ui/button/Button';
import { Icon } from '../Icons/AutoIcons';
import styles from './AppearanceMenu.module.scss';

const tabs: Array<'chats' | 'appearance'> = ['chats', 'appearance'];

const AppearanceMenu: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
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
    <div className={styles.container}>
      <Button
        className={styles.menuSwitch}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <Icon name='Cross' /> : '?'}
      </Button>
      {!visible && (
        <div className={styles.noChatText}>
          Select a chat to start messaging
        </div>
      )}
      {visible && (
        <div className={styles.tipsMenu}>
          {activeTab === 'appearance' && (
            <div className={styles.mainContent}>
              <div className={styles.header}>{t('tipsMenu.appearance')}</div>
            </div>
          )}
          {activeTab === 'chats' && (
            <div className={styles.mainContent}>
              <div className={styles.header}>{t('tipsMenu.chats')}</div>
            </div>
          )}
          <div className={styles.pageSwitch}>
            <Button
              key={'appearance-menu-previous-button'}
              className={styles.switchButton}
              onClick={handlePrevTab}
            >
              <Icon
                name='Arrow'
                className={styles.arrowIcon}
                style={{ transform: 'rotate(180deg)' }}
              />
              {t('tipsMenu.previousTip')}
            </Button>
            <Button
              key={'appearance-menu-next-button'}
              className={styles.switchButton}
              onClick={handleNextTab}
            >
              {t('tipsMenu.nextTip')}
              <Icon name='Arrow' className={styles.arrowIcon} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceMenu;
