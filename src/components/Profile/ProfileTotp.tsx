import { useCallback, useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import { apiJson, type ApiError } from '@/utils/apiFetch';
import { useUser } from '@/contexts/UserContextCore';
import Button from '@/components/ui/button/Button';
import { CopyTextButton } from '@/components/ui/CopyTextButton';
import styles from './Profile.module.scss';

export default function ProfileTotp() {
  const { t } = useTranslation();
  const { user, refreshUser } = useUser();
  const [busy, setBusy] = useState(false);
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const totpOn = Boolean(user?.totp_enabled);
  const inSetup = Boolean(setupSecret && !totpOn);

  const startSetup = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const data = await apiJson<{
        otpauth_uri?: string;
        secret?: string;
      }>('/api/totp/setup/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (data.otpauth_uri && data.secret) {
        setSetupUri(data.otpauth_uri);
        setSetupSecret(data.secret);
        setConfirmCode('');
      }
    } catch (e) {
      const d = (e as ApiError).data as { error?: string } | undefined;
      setMessage(
        d?.error === 'trusted_device_required'
          ? t('profile.totpTrustedDeviceRequired')
          : t('profile.totpSetupStartError'),
      );
    } finally {
      setBusy(false);
    }
  }, [t]);

  const confirmSetup = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiJson<{ success?: boolean }>('/api/totp/setup/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: confirmCode.trim() }),
      });
      setSetupUri(null);
      setSetupSecret(null);
      setConfirmCode('');
      await refreshUser();
    } catch (e) {
      const d = (e as ApiError).data as { error?: string } | undefined;
      setMessage(
        d?.error === 'invalid_totp'
          ? t('profile.totpInvalidCode')
          : t('profile.totpConfirmError'),
      );
    } finally {
      setBusy(false);
    }
  }, [confirmCode, refreshUser, t]);

  const cancelSetup = useCallback(() => {
    setSetupUri(null);
    setSetupSecret(null);
    setConfirmCode('');
    setMessage(null);
  }, []);

  const disableTotp = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiJson('/api/totp/disable/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.trim(),
        }),
      });
      setDisablePassword('');
      setDisableCode('');
      await refreshUser();
    } catch (e) {
      const d = (e as ApiError).data as { error?: string } | undefined;
      if (d?.error === 'invalid_password') {
        setMessage(t('profile.totpWrongPassword'));
      } else if (d?.error === 'invalid_totp') {
        setMessage(t('profile.totpInvalidCode'));
      } else {
        setMessage(t('profile.totpDisableError'));
      }
    } finally {
      setBusy(false);
    }
  }, [disableCode, disablePassword, refreshUser, t]);

  return (
    <div className={styles.backupCodesBlock}>
      <h3 className={styles.backupCodesHeading}>{t('profile.totpTitle')}</h3>
      <p className={styles.backupCodesDescription}>
        {t('profile.totpDescription')}
      </p>

      {message ? (
        <p className={styles.backupCodesCount} role='alert'>
          {message}
        </p>
      ) : null}

      {totpOn ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className={styles.backupCodesCount}>
            {t('profile.totpEnabledStatus')}
          </p>
          <form>
            <input
              type='password'
              autoComplete='off'
              autoCorrect='off'
              autoCapitalize='none'
              spellCheck={false}
              inputMode='text'
              aria-autocomplete='none'
              role='textbox'
              placeholder={t('profile.totpDisablePasswordPlaceholder')}
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              disabled={busy}
              style={{ padding: '8px 10px', borderRadius: 8 }}
            />
          </form>
          <input
            inputMode='numeric'
            autoComplete='one-time-code'
            placeholder={t('profile.totpCodePlaceholder')}
            value={disableCode}
            onChange={(e) =>
              setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            disabled={busy}
            style={{ padding: '8px 10px', borderRadius: 8 }}
          />
          <Button
            type='button'
            disabled={busy || !disablePassword || disableCode.length !== 6}
            onClick={() => void disableTotp()}
            className={styles.backupCodesButton}
          >
            {busy ? '…' : t('profile.totpDisable')}
          </Button>
        </div>
      ) : inSetup ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {setupUri ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <a href={setupUri} className={styles.backupCodesDescription}>
                {t('profile.totpOpenAuthenticatorLink')}
              </a>
              <CopyTextButton
                text={setupUri}
                label={t('profile.totpCopyAuthenticatorLink')}
                copiedLabel={t('buttons.copied')}
                className={styles.totpCopyButton}
                disabled={busy}
              />
            </div>
          ) : null}
          {setupSecret ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <p
                className={styles.backupCodesCount}
                style={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  margin: 0,
                }}
              >
                {setupSecret}
              </p>
              <CopyTextButton
                text={setupSecret}
                label={t('profile.totpCopySecret')}
                copiedLabel={t('buttons.copied')}
                className={styles.totpCopyButton}
                disabled={busy}
              />
            </div>
          ) : null}
          <input
            inputMode='numeric'
            autoComplete='one-time-code'
            placeholder={t('profile.totpCodePlaceholder')}
            value={confirmCode}
            onChange={(e) =>
              setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            disabled={busy}
            style={{ padding: '8px 10px', borderRadius: 8 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button type='button' disabled={busy} onClick={cancelSetup}>
              {t('buttons.cancel')}
            </Button>
            <Button
              type='button'
              disabled={busy || confirmCode.length !== 6}
              onClick={() => void confirmSetup()}
              className={styles.backupCodesButton}
            >
              {busy ? '…' : t('profile.totpConfirmEnable')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type='button'
          disabled={busy}
          onClick={() => void startSetup()}
          className={styles.backupCodesButton}
        >
          {busy ? '…' : t('profile.totpEnable')}
        </Button>
      )}
    </div>
  );
}
