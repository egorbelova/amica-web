import { useMemo } from 'react';
import { Icon } from '../Icons/AutoIcons';
import styles from './Profile.module.scss';
import { useTranslation, availableLanguages } from '@/contexts/languageCore';
import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContextCore';
import { useSettings } from '@/contexts/settings/context';
import { usePageStack } from '@/contexts/useStackHistory';
import { ActiveProfileTab } from './ActiveProfileTab';
import Button from '@/components/ui/button/Button';

const languageIcon = <Icon name='Language' />;
const privacyIcon = <Icon name='Privacy' />;
const appearanceIcon = <Icon name='Appearance' />;
const sessionsIcon = <Icon name='Sessions' />;
const arrowBackIcon = (
  <Icon name='Arrow' style={{ transform: 'rotate(180deg)' }} />
);
const fullscreenIcon = <Icon name='Fullscreen' />;
const arrowNavIcon = <Icon name='Arrow' className={styles.arrow} />;

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
  const tabs = useMemo(
    () => [
      {
        id: 'account' as const,
        label: user?.username || '',
        icon: (
          <Avatar
            className={styles.avatar}
            displayName={user?.username || ''}
            displayMedia={user?.profile?.primary_media || null}
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
        icon: languageIcon,
      },
      {
        id: 'privacy' as const,
        label: t('profileTabs.privacy'),
        icon: privacyIcon,
      },
      {
        id: 'appearance' as const,
        label: t('profileTabs.appearance'),
        icon: appearanceIcon,
      },
      {
        id: 'active_sessions' as const,
        label: t('profileTabs.active_sessions'),
        icon: sessionsIcon,
      },
    ],
    [locale, t, user?.profile?.primary_media, user?.username],
  );

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
            key={'profile-header-button'}
            onClick={() => setActiveProfileTab(null)}
            className={styles.close}
          >
            {arrowBackIcon}
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
          <Button
            key={'profile-header-button-maximize'}
            className={styles.maximize}
            onClick={() => setSettingsFullWindow(true)}
          >
            {fullscreenIcon}
          </Button>
        )}
      </div>

      {(!activeProfileTab || settingsFullWindow) && (
        <>
          {/* <SearchInput
            placeholder='Search settings'
            value={profileSearchTerm}
            onChange={setProfileSearchTerm}
            onClear={() => setProfileSearchTerm('')}
          /> */}
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
                {arrowNavIcon}
              </button>
            ))}
          </nav>
        </>
      )}
      {current === 'profile' && !settingsFullWindow && (
        <div className={styles.settingsContainer}>
          <ActiveProfileTab />
        </div>
      )}
    </div>
  );
}
