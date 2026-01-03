import { useTranslation } from '@/contexts/LanguageContext';
import styles from './Profile.module.scss';
import { useSettings } from '@/contexts/settings/useSettings';
import Toggle from '@/components/ui/toggle/Toggle';

export default function ProfileAppearance() {
  const { t } = useTranslation();
  const { settings, setSetting } = useSettings();

  const is24Hour = settings.timeFormat === '24h';

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.appearance')}</h3>
      <div className={styles.optionRow}>
        <div>{t('language.time.timeFormat')}</div>
        <Toggle
          checked={is24Hour}
          onChange={(checked) =>
            setSetting('timeFormat', checked ? '24h' : '12h')
          }
        />
      </div>
    </div>
  );
}
