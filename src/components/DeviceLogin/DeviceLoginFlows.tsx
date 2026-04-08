import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import { clientBindingHeaders } from '@/utils/clientBinding';
import { getAccessTokenOrThrow } from '@/utils/authStore';
import styles from './DeviceLoginFlows.module.scss';

export function DeviceLoginPendingOverlay({
  code,
  onCancel,
  onNoTrustedDevice,
  noTrustedDeviceBusy,
  noTrustedDeviceError,
}: {
  code: string;
  onCancel: () => void;
  onNoTrustedDevice?: () => void | Promise<void>;
  noTrustedDeviceBusy?: boolean;
  noTrustedDeviceError?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={styles.overlay}
      role='dialog'
      aria-modal='true'
      aria-live='polite'
    >
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{t('login.deviceLoginTitle')}</h2>
          <p className={styles.hint}>{t('login.deviceLoginHint')}</p>
          <div className={styles.code}>{code}</div>
          <p className={styles.waiting}>{t('login.deviceLoginWaiting')}</p>
          {onNoTrustedDevice ? (
            <>
              {noTrustedDeviceError ? (
                <p className={styles.error}>{noTrustedDeviceError}</p>
              ) : null}
              <button
                type='button'
                disabled={noTrustedDeviceBusy}
                onClick={() => void onNoTrustedDevice()}
                className={`${styles.btn} ${styles.btnBlock} ${styles.btnSecondary}`}
              >
                {t('login.noTrustedDeviceLink')}
              </button>
            </>
          ) : null}
          <button
            type='button'
            onClick={onCancel}
            className={`${styles.btn} ${styles.btnBlock} ${styles.btnSecondary}`}
          >
            {t('login.deviceLoginCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrustedDeviceConfirmModal({
  challengeId,
  onClose,
}: {
  challengeId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    setError('');
    setSubmitting(true);
    try {
      const token = await getAccessTokenOrThrow();
      const res = await fetch('/api/device-login/confirm/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...clientBindingHeaders(),
        },
        body: JSON.stringify({ challenge_id: challengeId, code: code.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Invalid code');
        return;
      }
      onClose();
    } catch {
      setError('Request failed');
    } finally {
      setSubmitting(false);
    }
  }, [challengeId, code, onClose]);

  return (
    <div className={styles.overlay} role='dialog' aria-modal='true'>
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{t('login.trustedConfirmTitle')}</h2>
          <p className={styles.hint}>{t('login.trustedConfirmHint')}</p>
          <input
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            maxLength={8}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder='000000'
            className={styles.otpInput}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.row}>
            <button
              type='button'
              onClick={onClose}
              className={`${styles.btn} ${styles.rowBtn} ${styles.btnSecondary}`}
            >
              {t('login.trustedConfirmDismiss')}
            </button>
            <button
              type='button'
              disabled={submitting || code.length < 6}
              onClick={() => void submit()}
              className={`${styles.btn} ${styles.rowBtn} ${styles.btnPrimary}`}
            >
              {t('login.trustedConfirmSubmit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecoveryCooldownOverlay({
  tryAfterIso,
  message,
  onDismiss,
}: {
  tryAfterIso: string;
  message?: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const formatted = useMemo(() => {
    try {
      return new Date(tryAfterIso).toLocaleString();
    } catch {
      return tryAfterIso;
    }
  }, [tryAfterIso]);

  return (
    <div
      className={styles.overlay}
      role='dialog'
      aria-modal='true'
      aria-live='polite'
    >
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{t('login.recoveryCooldownTitle')}</h2>
          <p className={styles.hint}>
            {message || t('login.recoveryCooldownBody')}
          </p>
          <p className={styles.datetime}>{formatted}</p>
          <button
            type='button'
            onClick={onDismiss}
            className={`${styles.btn} ${styles.btnBlock} ${styles.btnPrimary}`}
          >
            {t('login.recoveryCooldownOk')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecoveryEmailOtpModal({
  onSubmit,
  onCancel,
  error,
  submitting,
}: {
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
  error: string | null;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = useCallback(async () => {
    setLocalError('');
    const normalized = code.replace(/\D/g, '');
    if (normalized.length !== 6) {
      setLocalError(t('login.recoveryOtpInvalid'));
      return;
    }
    await onSubmit(normalized);
  }, [code, onSubmit, t]);

  const displayError = error || localError;
  const codeOk = code.replace(/\D/g, '').length >= 6;

  return (
    <div className={styles.overlay} role='dialog' aria-modal='true'>
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{t('login.recoveryOtpTitle')}</h2>
          <p className={styles.hint}>{t('login.recoveryOtpBody')}</p>
          <input
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            maxLength={8}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder='000000'
            className={styles.otpInput}
          />
          {displayError ? <p className={styles.error}>{displayError}</p> : null}
          <div className={styles.row}>
            <button
              type='button'
              onClick={onCancel}
              className={`${styles.btn} ${styles.rowBtn} ${styles.btnSecondary}`}
            >
              {t('login.recoveryOtpCancel')}
            </button>
            <button
              type='button'
              disabled={submitting || !codeOk}
              onClick={() => void submit()}
              className={`${styles.btn} ${styles.rowBtn} ${styles.btnPrimary}`}
            >
              {t('login.recoveryOtpSubmit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
