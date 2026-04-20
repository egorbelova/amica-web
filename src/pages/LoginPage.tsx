import React, { useState, useEffect, useRef, useCallback } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton/GoogleLoginButton';
import { PasskeyLoginButton } from '../components/PasskeyButton/PasskeyLoginButton';
import {
  LoginTotpModal,
  type LoginTotpSubmitKind,
} from '@/components/Login/LoginTotpModal';
import { useUser } from '../contexts/UserContextCore';
import { useTranslation } from '@/contexts/languageCore';
import styles from './LoginPage.module.scss';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginPageProps {
  onShowSignup: () => void;
}

/** Email field: trim and lowercase (display + submitted value). */
function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

const LoginPage: React.FC<LoginPageProps> = ({ onShowSignup }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [loginBusy, setLoginBusy] = useState(false);
  const [error, setError] = useState<string>('');
  const [emailVerifiedNotice] = useState(() => {
    try {
      return (
        new URLSearchParams(window.location.search).get('verified') === '1'
      );
    } catch {
      return false;
    }
  });
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const {
    loginWithPassword,
    loading,
    error: contextError,
    dismissAuthError,
    pendingTotpSecondFactor,
    submitTotpSecondFactor,
    dismissPendingTotpSecondFactor,
    passwordLoginNeedsTotp,
    dismissPasswordLoginTotp,
  } = useUser();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!emailVerifiedNotice) return;
    try {
      const path = window.location.pathname || '/';
      window.history.replaceState({}, '', path);
    } catch {
      /* ignore */
    }
  }, [emailVerifiedNotice]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'username' || name === 'password') {
        dismissPasswordLoginTotp();
      }
      const next = name === 'password' ? value : normalizeEmailInput(value);

      setFormData((prev) => ({
        ...prev,
        [name]: next,
      }));

      if (error) setError('');
      if (contextError) dismissAuthError();
    },
    [error, contextError, dismissAuthError, dismissPasswordLoginTotp],
  );

  const handleLogin = useCallback(async () => {
    setLoginBusy(true);
    try {
      await loginWithPassword(formData.username, formData.password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoginBusy(false);
    }
  }, [formData.username, formData.password, loginWithPassword]);

  const handleTotpModalSubmit = useCallback(
    async (kind: LoginTotpSubmitKind, value: string) => {
      const r = await loginWithPassword(
        formData.username,
        formData.password,
        { kind, code: value },
      );
      return r === 'invalid_totp' || r === 'invalid_backup_code';
    },
    [formData.username, formData.password, loginWithPassword],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (e.currentTarget === usernameRef.current) {
        passwordRef.current?.focus();
        return;
      }
      if (e.currentTarget === passwordRef.current) void handleLogin();
    },
    [handleLogin],
  );

  const handleSignUp = useCallback(() => onShowSignup(), [onShowSignup]);

  const formDisabled = loading || loginBusy;

  const totpModalOpen =
    passwordLoginNeedsTotp || Boolean(pendingTotpSecondFactor);

  const handleTotpModalDismiss = useCallback(() => {
    if (pendingTotpSecondFactor) dismissPendingTotpSecondFactor();
    else dismissPasswordLoginTotp();
  }, [
    pendingTotpSecondFactor,
    dismissPendingTotpSecondFactor,
    dismissPasswordLoginTotp,
  ]);

  const handleUnifiedTotpSubmit = useCallback(
    async (kind: LoginTotpSubmitKind, value: string) => {
      if (pendingTotpSecondFactor) {
        return submitTotpSecondFactor(kind, value);
      }
      return handleTotpModalSubmit(kind, value);
    },
    [pendingTotpSecondFactor, submitTotpSecondFactor, handleTotpModalSubmit],
  );

  return (
    <div className={styles['login-wrapper']}>
      <div className={styles['login-top-fill']} />
      <div className={styles['login-form']}>
        <h4 className={styles['login-title']}>{t('login.signIn')}</h4>
        {emailVerifiedNotice ? (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.15)',
              color: 'var(--color-text-primary, #fff)',
              fontSize: 14,
              lineHeight: 1.4,
            }}
            role='status'
          >
            {t('login.emailVerifiedBanner')}
          </div>
        ) : null}

        <fieldset className={styles['form']}>
          <input
            ref={usernameRef}
            name='username'
            value={formData.username}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={formDisabled}
            autoComplete='email'
            required
            placeholder={t('login.email')}
            inputMode='email'
            autoCapitalize='none'
            spellCheck={false}
          />
        </fieldset>
        <fieldset className={styles['form']}>
          <input
            ref={passwordRef}
            type='password'
            name='password'
            value={formData.password}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={formDisabled}
            autoComplete='current-password'
            required
            placeholder={t('login.password')}
          />
        </fieldset>
        {(error || contextError) && (
          <div style={{ color: 'red', margin: '8px 0' }}>
            {error || contextError}
          </div>
        )}
        <button
          type='button'
          className={styles['next-button']}
          disabled={formDisabled || !formData.username || !formData.password}
          onClick={() => void handleLogin()}
        >
          {loginBusy ? t('login.loggingIn') : t('buttons.next')}
        </button>

        <GoogleLoginButton className={styles['google-login-button']} />
        <PasskeyLoginButton styles={styles} />
        <div className={styles['need-account']}>
          <span>{t('login.needAccount')}</span>
          <a onClick={handleSignUp}>{t('login.signUp')}</a>
        </div>
      </div>
      <div className={styles['login-bottom-fill']} />

      <LoginTotpModal
        open={totpModalOpen}
        onDismiss={handleTotpModalDismiss}
        onSubmitCode={handleUnifiedTotpSubmit}
      />
    </div>
  );
};

export default React.memo(LoginPage);
