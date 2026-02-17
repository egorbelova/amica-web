import ProfileLanguage from '@/components/Profile/ProfileLanguage';
import ProfilePrivacy from '@/components/Profile/ProfilePrivacy';
import ProfileAccount from '@/components/Profile/ProfileAccount';
import ProfileAppearance from '@/components/Profile/ProfileAppearance';
import ProfileSessions from '@/components/Profile/ProfileSessions';
import { useSettings } from '@/contexts/settings/Settings';
import styles from './Profile.module.scss';
import { Icon } from '../Icons/AutoIcons';

export const ActiveProfileTab = () => {
  const { activeProfileTab, setActiveProfileTab, settingsFullWindow } =
    useSettings();
  if (!activeProfileTab) {
    return null;
  }
  return (
    <div className={styles.content}>
      {activeProfileTab === 'language' && <ProfileLanguage />}
      {activeProfileTab === 'privacy' && <ProfilePrivacy />}
      {activeProfileTab === 'account' && <ProfileAccount />}
      {activeProfileTab === 'appearance' && <ProfileAppearance />}
      {activeProfileTab === 'active_sessions' && <ProfileSessions />}
    </div>
  );
};
