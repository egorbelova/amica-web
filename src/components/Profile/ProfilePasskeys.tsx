import { useCallback } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import { useWarning } from '@/contexts/warning/WarningContextCore';
import PasskeyRegisterButton from '../PasskeyButton/PasskeyRegisterButton';
import Button from '../ui/button/Button';
import styles from './Profile.module.scss';
import { usePasskeys } from './usePasskeys';

export default function ProfilePasskeys() {
  const { t, locale } = useTranslation();
  const intlLocale = locale === 'ua' ? 'uk' : locale;
  const { showWarning } = useWarning();
  const { passkeys, loading, error, loadPasskeys, removePasskey } =
    usePasskeys();

  const formatDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleString(intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [intlLocale],
  );

  const confirmRemove = useCallback(
    (id: string) => {
      showWarning({
        title: t('profile.revokePasskeyConfirmTitle'),
        body: (
          <p style={{ margin: 0, lineHeight: 1.45 }}>
            {t('profile.revokePasskeyConfirmBody')}
          </p>
        ),
        dismissLabel: t('buttons.cancel'),
        confirmLabel: t('profile.revokePasskey'),
        onConfirm: () => {
          void removePasskey(id).catch(() => {});
        },
      });
    },
    [removePasskey, showWarning, t],
  );

  return (
    <div className={styles.passkeysBlock}>
      <h3 className={styles.passkeysHeading}>{t('profile.passkeysTitle')}</h3>
      <p className={styles.passkeysDescription}>
        {t('profile.passkeysDescription')}
      </p>
      <PasskeyRegisterButton onRegistered={() => void loadPasskeys()} />
      {error ? <p className={styles.passkeysError}>{error}</p> : null}
      {loading ? (
        <p className={styles.passkeysMuted}>{t('sessions.loading')}</p>
      ) : passkeys.length === 0 ? (
        <p className={styles.passkeysMuted}>{t('profile.passkeysEmpty')}</p>
      ) : (
        <ul className={styles.passkeysList}>
          {passkeys.map((p) => (
            <li key={p.id} className={styles.passkeysRow}>
              <span className={styles.passkeysLabel}>
                {t('profile.passkeyAdded').replace(
                  '{date}',
                  formatDate(p.created_at),
                )}
              </span>
              <Button
                type='button'
                className={styles.passkeysRevokeBtn}
                onClick={() => confirmRemove(p.id)}
              >
                {t('profile.revokePasskey')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
