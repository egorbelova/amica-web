import ProfilePasskeys from './ProfilePasskeys';
import ProfileBackupCodes from './ProfileBackupCodes';
import ProfileTotp from './ProfileTotp';
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
      <ProfilePasskeys />
      <ProfileTotp />
      <ProfileBackupCodes />
    </div>
  );
}
