import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import { apiJson, type ApiError } from '@/utils/apiFetch';
import { BackupCodesSavedModal } from '@/components/DeviceLogin/BackupCodesModal';
import { useWarning } from '@/contexts/warning/WarningContextCore';
import { useUser } from '@/contexts/UserContextCore';
import Button from '@/components/ui/button/Button';
import styles from './Profile.module.scss';

export default function ProfileBackupCodes() {
  const { t } = useTranslation();
  const { showWarning } = useWarning();
  const { user } = useUser();
  const totpOn = Boolean(user?.totp_enabled);
  const [unusedBackupCount, setUnusedBackupCount] = useState<number | null>(
    null,
  );
  const [regenerateBusy, setRegenerateBusy] = useState(false);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[] | null>(
    null,
  );

  const loadBackupStatus = useCallback(async () => {
    if (!totpOn) {
      setUnusedBackupCount(null);
      return;
    }
    try {
      const data = await apiJson<{
        unused_count?: number;
        totp_enabled?: boolean;
      }>('/api/backup-codes/status/');
      setUnusedBackupCount(
        typeof data.unused_count === 'number' ? data.unused_count : 0,
      );
    } catch {
      setUnusedBackupCount(null);
    }
  }, [totpOn]);

  useEffect(() => {
    void loadBackupStatus();
  }, [loadBackupStatus, user?.id, totpOn]);

  const runRegenerateBackupCodes = useCallback(async () => {
    setRegenerateBusy(true);
    try {
      const data = await apiJson<{ backup_codes?: string[] }>(
        '/api/backup-codes/regenerate/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );
      if (data.backup_codes?.length) {
        setRegeneratedCodes(data.backup_codes);
      }
      void loadBackupStatus();
    } catch (e) {
      const d = (e as ApiError).data as { error?: string } | undefined;
      if (d?.error === 'totp_not_enabled') {
        window.alert(t('profile.backupCodesRequiresTotp'));
      } else {
        window.alert(t('profile.backupCodesRegenerateError'));
      }
    } finally {
      setRegenerateBusy(false);
    }
  }, [loadBackupStatus, t]);

  const requestRegenerateBackupCodes = useCallback(() => {
    showWarning({
      title: t('profile.backupCodesRegenerateWarningTitle'),
      body: (
        <p style={{ margin: 0, lineHeight: 1.45 }}>
          {t('profile.regenerateBackupCodesConfirm')}
        </p>
      ),
      dismissLabel: t('profile.backupCodesRegenerateCancel'),
      confirmLabel: t('profile.backupCodesRegenerateConfirm'),
      onConfirm: () => {
        void runRegenerateBackupCodes();
      },
    });
  }, [showWarning, t, runRegenerateBackupCodes]);

  const unusedLabel =
    totpOn && unusedBackupCount != null
      ? t('profile.backupCodesUnused').replace(
          '{count}',
          String(unusedBackupCount),
        )
      : null;

  if (!totpOn) {
    return null;
  }

  return (
    <div className={styles.backupCodesBlock}>
      <h3 className={styles.backupCodesHeading}>{t('profile.backupCodesTitle')}</h3>
      <p className={styles.backupCodesDescription}>
        {t('profile.backupCodesDescription')}
      </p>
      {unusedLabel ? (
        <p className={styles.backupCodesCount}>{unusedLabel}</p>
      ) : null}
      <Button
        type='button'
        disabled={regenerateBusy}
        onClick={requestRegenerateBackupCodes}
        className={styles.backupCodesButton}
      >
        {regenerateBusy ? '…' : t('profile.regenerateBackupCodes')}
      </Button>

      {regeneratedCodes?.length ? (
        <BackupCodesSavedModal
          codes={regeneratedCodes}
          onDismiss={() => setRegeneratedCodes(null)}
        />
      ) : null}
    </div>
  );
}
