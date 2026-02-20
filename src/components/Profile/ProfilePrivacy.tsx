// import { Icon } from '../Icons/AutoIcons';
import PasskeyRegisterButton from '../PasskeyButton/PasskeyRegisterButton';
import styles from './Profile.module.scss';
import ProfileTabDescription from './ProfileTabDescription';
// import { useTranslation } from '@/contexts/LanguageContext';

export default function ProfilePrivacy() {
  // const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <ProfileTabDescription
        title='Privacy'
        description='Manage your privacy settings and security such as passkeys.'
        iconName='Privacy'
        backgroundColor='#666'
      />
      <PasskeyRegisterButton />
    </div>
  );
}
