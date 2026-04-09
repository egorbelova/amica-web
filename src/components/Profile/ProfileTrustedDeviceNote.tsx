import { useTranslation } from '@/contexts/languageCore';
import { useUser } from '@/contexts/UserContextCore';
import styles from './Profile.module.scss';

export default function ProfileTrustedDeviceNote() {
  const { t } = useTranslation();
  const { user } = useUser();
  const has = Boolean(user?.has_trusted_device);

  return (
    <div className={styles.trustedDeviceNote}>
      <h3 className={styles.trustedDeviceNoteTitle}>
        {t('profile.trustedDeviceTitle')}
      </h3>
      <p className={styles.trustedDeviceNoteBody}>
        {has
          ? t('profile.trustedDeviceBodyHas')
          : t('profile.trustedDeviceBodyNone')}
      </p>
    </div>
  );
}
