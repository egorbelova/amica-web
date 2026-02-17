import { availableLanguages, useTranslation } from '@/contexts/LanguageContext';
import styles from './Profile.module.scss';

export default function ProfileLanguage() {
  const { locale, changeLanguage, t } = useTranslation();

  return (
    <div className={styles.section}>
      {availableLanguages.map((lang) => (
        <div
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={styles.languageItem}
          role='button'
          tabIndex={0}
        >
          <span
            className={
              styles.check + ' ' + (lang.code === locale ? styles.active : '')
            }
          ></span>

          {/* <img
            src={`../flags/${lang.country}.webp`}
            alt={lang.name}
            className={styles.languageFlag}
            loading='lazy'
          /> */}

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
