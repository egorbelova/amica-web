import { Icon } from '../Icons/AutoIcons';
import PasskeyRegisterButton from '../PasskeyButton/PasskeyRegisterButton';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';

export default function ProfilePrivacy() {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <PasskeyRegisterButton />
    </div>
  );
}
