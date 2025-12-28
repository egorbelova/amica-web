import { availableLanguages, useTranslation } from '@/contexts/LanguageContext';
import styles from './Profile.module.scss';

export default function ProfileLanguage() {
  const { locale, changeLanguage, t } = useTranslation();

  const items = availableLanguages.map((lang) => ({
    label: lang.name,
    value: lang.code,
  }));

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.language')}</h3>
      {availableLanguages.map((lang) => (
        <div
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={styles.languageItem}
        >
          {locale === lang.code ? '✓ ' : ''}
          <span className={styles.languageFlag}>{lang.flag}</span>
          <div className={styles.languageInfo}>
            <span className={styles.languageName}>{lang.name}</span>
            <span className={styles.languageLabel}>
              {t(`language.languages.${lang.code}`)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
