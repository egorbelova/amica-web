import { useState } from 'react';
import { Icon } from '../Icons/AutoIcons';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { availableLanguages } from '@/contexts/LanguageContext';
import ProfileLanguage from './ProfileLanguage';
import ProfilePrivacy from './ProfilePrivacy';
import ProfileAccount from './ProfileAccount';
import ProfileAppearance from './ProfileAppearance';
import ProfileSessions from './ProfileSessions';
import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/contexts/settings/Settings';

export default function Profile() {
  const { t, locale } = useTranslation();
  const { user } = useUser();
  // const [active, setActive] = useState<SubTab>('account');
  const { activeProfileTab, setActiveProfileTab } = useSettings();

  const tabs = [
    {
      id: 'account' as const,
      label: user.username,
      icon: (
        <Avatar
          className={styles.avatar}
          displayName={user.username}
          displayMedia={user.profile.primary_avatar}
        />
      ),
    },
    {
      id: 'language' as const,
      label:
        t('profileTabs.language') +
        '>' +
        availableLanguages.find((l) => l.code === locale)?.name,
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
      id: 'active sessions' as const,
      label: t('profileTabs.active_sessions'),
      icon: <Icon name='Sessions' />,
    },
  ];

  return (
    <div className={styles.container}>
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
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        {activeProfileTab === 'language' && <ProfileLanguage />}
        {activeProfileTab === 'privacy' && <ProfilePrivacy />}
        {activeProfileTab === 'account' && <ProfileAccount />}
        {activeProfileTab === 'appearance' && <ProfileAppearance />}
        {activeProfileTab === 'active sessions' && <ProfileSessions />}
      </div>
    </div>
  );
}
