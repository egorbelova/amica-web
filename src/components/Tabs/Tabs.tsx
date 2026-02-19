import { useTabs } from './TabsContext';
import { useUser } from '@/contexts/UserContext';
import { Icon } from '@/components/Icons/AutoIcons';
import Avatar from '@/components/Avatar/Avatar';
import styles from './Tabs.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/settings/Settings';
import { useEffect, useRef } from 'react';

type TabValue = 'contacts' | 'chats' | 'profile';

type TabConfig = {
  id: TabValue;
  label: string;
  icon?: React.ReactNode;
  avatar?: boolean;
};

export function Tabs() {
  const { activeTab, setActiveTab } = useTabs();
  const { user } = useUser();
  const { t } = useTranslation();
  const { activeProfileTab, addUserWallpaper } = useSettings();
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const tabs: TabConfig[] = [
    {
      id: 'contacts',
      label: t('tabs.contacts'),
      icon: <Icon name='ContactHeart' />,
    },
    { id: 'chats', label: t('tabs.chats'), icon: <Icon name='Chats' /> },
    { id: 'profile', label: t('tabs.profile'), avatar: true },
  ];

  return (
    <nav className={styles.tabs}>
      {activeProfileTab === 'appearance' && activeTab === 'profile' && (
        <div className={styles['new-wallpaper']}>
          <button
            type='button'
            className={styles['new-wallpaper__button']}
            onClick={() => {
              wallpaperInputRef.current?.click();
            }}
          >
            <Icon name='Wallpaper' className={styles['new-wallpaper__icon']} />
            <span>Add New Wallpaper</span>
          </button>
          <input
            ref={wallpaperInputRef}
            className={styles['new-wallpaper__input']}
            type='file'
            accept='image/*,video/*'
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              addUserWallpaper(file);
            }}
          />
        </div>
      )}
      <div className={styles['main-navigation-wrapper']}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
            type='button'
          >
            {tab.icon && !tab.avatar && (
              <div className={styles.icon}>{tab.icon}</div>
            )}

            {tab.avatar && (
              <div className={styles.avatar}>
                <Avatar
                  displayName={user?.username || ''}
                  displayMedia={user?.profile?.primary_avatar || null}
                  size='small'
                />
              </div>
            )}

            <span className={styles.label}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
