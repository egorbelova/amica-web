import { Icon } from '../Icons/AutoIcons';
import styles from './Profile.module.scss';
import { useTranslation, availableLanguages } from '@/contexts/languageCore';

import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContextCore';
import { useSettings } from '@/contexts/settings/context';
import { usePageStack } from '@/contexts/useStackHistory';
import { ActiveProfileTab } from './ActiveProfileTab';
import Button from '@/components/ui/button/Button';

export default function Profile() {
  const { t, locale } = useTranslation();
  const { user } = useUser();
  const {
    activeProfileTab,
    setActiveProfileTab,
    settingsFullWindow,
    setSettingsFullWindow,
    isResizingPermitted,
  } = useSettings();
  const { current } = usePageStack();

  const tabs = [
    {
      id: 'account' as const,
      label: user?.username || '',
      icon: (
        <Avatar
          className={styles.avatar}
          displayName={user?.username || ''}
          displayMedia={user?.profile?.primary_avatar || null}
        />
      ),
    },
    {
      id: 'language' as const,
      label:
        t('profileTabs.language') +
        ' (' +
        availableLanguages.find((l) => l.code === locale)?.name +
        ')',
      icon: <Icon name='Language' />,
    },
    {
      id: 'privacy' as const,
      label: t('profileTabs.privacy'),
      icon: <Icon name='Privacy' />,
    },
    {
      id: 'appearance' as const,
      label: t('profileTabs.appearance'),
      icon: <Icon name='Appearance' />,
    },
    // {
    //   id: 'notifications' as const,
    //   label: t('profileTabs.notifications'),
    //   icon: <Icon name='Notification' />,
    // },
    {
      id: 'active_sessions' as const,
      label: t('profileTabs.active_sessions'),
      icon: <Icon name='Sessions' />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        {activeProfileTab && (
          <div className={styles.titleText}>
            {t(`profileTabs.${activeProfileTab}`)}
          </div>
        )}

        {!activeProfileTab ? (
          <>Settings</>
        ) : (
          <Button
            onClick={() => setActiveProfileTab(null)}
            className={styles.close}
          >
            <Icon
              name='Arrow'
              className={styles.close}
              style={{ transform: 'rotate(180deg)' }}
            />
          </Button>
          // <button
          //   type='button'
          //   className={styles.close}
          //   onClick={() => setActiveProfileTab(null)}
          // >
          //   <Icon
          //     name='Arrow'
          //     className={styles.close}
          //     style={{ transform: 'rotate(180deg)' }}
          //   />
          // </button>
        )}
        {isResizingPermitted && activeProfileTab && !settingsFullWindow && (
          <div
            className={styles.maximize}
            onClick={() => setSettingsFullWindow(true)}
          >
            <Icon name='Fullscreen' />
          </div>
        )}
      </div>

      {(!activeProfileTab || settingsFullWindow) && (
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveProfileTab(tab.id)}
              className={`${styles.tab} ${
                activeProfileTab === tab.id ? styles.active : ''
              }`}
            >
              <div className={styles['tab__content']}>
                {tab.icon}
                <span>{tab.label}</span>
              </div>
              <Icon name='Arrow' className={styles.arrow} />
            </button>
          ))}
        </nav>
      )}
      {current === 'profile' && !settingsFullWindow && (
        <div className={styles.settingsContainer}>
          <ActiveProfileTab />
        </div>
      )}
    </div>
  );
}
