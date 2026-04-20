import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/contexts/languageCore';
import warnStyles from '@/components/Warning/Warning.module.scss';

export type LoginTotpSubmitKind = 'totp' | 'backup';

type Props = {
  open: boolean;
  onDismiss: () => void;
  /** Return true if the submitted factor was wrong (modal stays open). */
  onSubmitCode: (kind: LoginTotpSubmitKind, value: string) => Promise<boolean>;
};

export function LoginTotpModal({ open, onDismiss, onSubmitCode }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState('');
  const [mode, setMode] = useState<LoginTotpSubmitKind>('totp');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setCode('');
      setBackup('');
      setMode('totp');
      setError('');
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (mode === 'totp') inputRef.current?.focus();
      else backupInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, mode]);

  const runSubmit = useCallback(async () => {
    if (busy) return;
    if (mode === 'totp') {
      const digits = code.trim();
      if (digits.length !== 6) return;
      setBusy(true);
      setError('');
      try {
        const invalid = await onSubmitCode('totp', digits);
        if (invalid) setError(t('login.invalidTotp'));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setBusy(false);
      }
      return;
    }
    const raw = backup.trim();
    if (!raw) return;
    setBusy(true);
    setError('');
    try {
      const invalid = await onSubmitCode('backup', raw);
      if (invalid) setError(t('login.backupCodeInvalid'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }, [busy, mode, code, backup, onSubmitCode, t]);

  if (!open || typeof document === 'undefined') return null;

  const switchToBackup = () => {
    setMode('backup');
    setError('');
  };
  const switchToTotp = () => {
    setMode('totp');
    setError('');
  };

  const canSubmit =
    mode === 'totp' ? code.length === 6 : backup.trim().length > 0;

  const modal = (
    <div
      className={warnStyles.backdrop}
      role='alertdialog'
      aria-modal='true'
      aria-labelledby='login-totp-title'
    >
      <div className={warnStyles.panel}>
        <div className={warnStyles.inner}>
          <h2 id='login-totp-title' className={warnStyles.title}>
            {mode === 'totp'
              ? t('login.totpModalTitle')
              : t('login.totpBackupModalTitle')}
          </h2>
          <p className={warnStyles.body} style={{ marginTop: 0 }}>
            {mode === 'totp'
              ? t('login.totpModalBody')
              : t('login.totpBackupModalBody')}
          </p>
          {mode === 'totp' ? (
            <input
              ref={inputRef}
              inputMode='numeric'
              autoComplete='one-time-code'
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSubmit();
              }}
              disabled={busy}
              placeholder={t('login.totpLabel')}
              aria-label={t('login.totpLabel')}
              aria-invalid={Boolean(error)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 16,
                border: '1px solid var(--surface-border, rgba(127,127,127,0.35))',
                background: 'transparent',
                color: 'var(--messageMainColor, #fff)',
                fontSize: '1.125rem',
                letterSpacing: '0.2em',
                textAlign: 'center',
              }}
            />
          ) : (
            <input
              ref={backupInputRef}
              type='text'
              autoComplete='off'
              autoCorrect='off'
              autoCapitalize='characters'
              spellCheck={false}
              value={backup}
              onChange={(e) => {
                setBackup(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSubmit();
              }}
              disabled={busy}
              placeholder={t('login.backupCodePlaceholder')}
              aria-label={t('login.backupCodePlaceholder')}
              aria-invalid={Boolean(error)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 16,
                border: '1px solid var(--surface-border, rgba(127,127,127,0.35))',
                background: 'transparent',
                color: 'var(--messageMainColor, #fff)',
                fontSize: '1rem',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.15em',
                textAlign: 'center',
              }}
            />
          )}
          {error ? (
            <p
              role='alert'
              style={{
                color: '#f87171',
                fontSize: '0.875rem',
                margin: '10px 0 0',
              }}
            >
              {error}
            </p>
          ) : null}
          <button
            type='button'
            onClick={mode === 'totp' ? switchToBackup : switchToTotp}
            disabled={busy}
            style={{
              marginTop: 12,
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--linkColor, #60a5fa)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textAlign: 'left',
            }}
          >
            {mode === 'totp'
              ? t('login.totpUseBackupCodeButton')
              : t('login.totpUseAuthenticatorButton')}
          </button>
          <div className={warnStyles.actionsRow}>
            <button
              type='button'
              className={warnStyles.dismiss}
              disabled={busy}
              onClick={onDismiss}
            >
              {t('buttons.cancel')}
            </button>
            <button
              type='button'
              className={warnStyles.confirm}
              disabled={busy || !canSubmit}
              onClick={() => void runSubmit()}
            >
              {busy ? t('login.loggingIn') : t('buttons.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
