import PasskeyRegisterButton from '../PasskeyButton/PasskeyRegisterButton';
import ProfileBackupCodes from './ProfileBackupCodes';
import ProfileTrustedDeviceNote from './ProfileTrustedDeviceNote';
import styles from './Profile.module.scss';
import ProfileTabDescription from './ProfileTabDescription';
import { useTranslation } from '@/contexts/languageCore';

export default function ProfilePrivacy() {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <ProfileTabDescription
        title={t('profileTabs.privacy')}
        description={t('profile.privacyDescription')}
        iconName='Privacy'
        backgroundColor='#666'
      />
      <ProfileTrustedDeviceNote />
      <PasskeyRegisterButton />
      <ProfileBackupCodes />
    </div>
  );
}
