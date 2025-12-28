import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContext';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { Icon } from '../Icons/AutoIcons';

export default function ProfileAccount() {
  const { user, logout } = useUser();
  const { t } = useTranslation();

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.account')}</h3>
      <Avatar
        displayName={user.username}
        className={styles.avatar}
        displayMedia={user?.profile?.primary_avatar ?? undefined}
        size='small'
      />
      <div tabIndex={0} onClick={logout} className={styles.logoutBtn}>
        <Icon name='Logout' className={styles.logoutIcon} />
        {t('profile.signOut')}
      </div>
    </div>
  );
}
