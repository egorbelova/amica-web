import { useUser } from '@/contexts/UserContext';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { Icon } from '../Icons/AutoIcons';
import EditableAvatar from '@/components/Avatar/EditableAvatar';

export default function ProfileAccount() {
  const { user, logout, setUser } = useUser();
  const { t } = useTranslation();

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.account')}</h3>

      <EditableAvatar
        displayName={user.username}
        avatar={user?.profile?.primary_avatar}
        objectId={user.profile.id}
        contentType='profile'
        onAvatarChange={(primary_avatar) => {
          setUser({
            ...user,
            profile: {
              ...user.profile,
              primary_avatar,
            },
          });
        }}
        isEditable={true}
      />

      <div tabIndex={0} onClick={logout} className={styles.logoutBtn}>
        <Icon name='Logout' className={styles.logoutIcon} />
        {t('profile.signOut')}
      </div>
    </div>
  );
}
