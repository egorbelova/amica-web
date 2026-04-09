import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { tSync } from '@/contexts/languageCore';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { apiJson, setApiFetchUnauthorizedHandler } from '../utils/apiFetch';
import {
  setAccessToken,
  logout as authLogout,
  initAuth,
  getAccessToken,
  refreshTokenIfNeeded,
  setCustomRefreshTokenFn,
  setRefreshCookie,
  refreshTokenViaHttp,
} from '../utils/authStore';
import {
  websocketManager,
  type WebSocketMessage,
} from '@/utils/websocket-manager';
import type { DisplayMedia, User } from '@/types';
import type { WallpaperSetting } from './settings/types';
import { UserContext } from './UserContextCore';
import type { UserState, ApiResponse } from './UserContextCore';
import type { File as FileType } from '@/types';
import { setLastUserId, getLastUserId, deleteChatState } from '@/utils/chatStateStorage';
import { pollDeviceLoginUntilReady } from '@/utils/deviceLoginPoll';
import {
  DeviceLoginPendingOverlay,
  TrustedDeviceLoginRequestBody,
  TrustedDeviceLoginWarningBody,
} from '@/components/DeviceLogin/DeviceLoginFlows';
import { useWarning } from '@/contexts/warning/WarningContextCore';
import { BackupCodesSavedModal } from '@/components/DeviceLogin/BackupCodesModal';

const USER_CACHE_KEY_PREFIX = 'amica-user-cache';

function getCachedUser(): User | null {
  try {
    const userId = getLastUserId();
    if (userId == null) return null;
    const raw = localStorage.getItem(`${USER_CACHE_KEY_PREFIX}-${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null): void {
  if (user === null) {
    const userId = getLastUserId();
    if (userId != null) {
      try {
        localStorage.removeItem(`${USER_CACHE_KEY_PREFIX}-${userId}`);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  try {
    localStorage.setItem(
      `${USER_CACHE_KEY_PREFIX}-${user.id}`,
      JSON.stringify(user),
    );
    setLastUserId(user.id);
  } catch {
    try {
      localStorage.removeItem(`${USER_CACHE_KEY_PREFIX}-${user.id}`);
    } catch {
      /* ignore */
    }
  }
}

/** Placeholder so we can render the app before WS connects; replaced by fetchUser(). */
function getPlaceholderUser(): User {
  return {
    id: 0,
    email: '',
    username: '',
    profile: {
      id: 0,
      last_seen: null,
      bio: null,
      phone: null,
      date_of_birth: null,
      location: null,
      primary_media: { id: '0', type: 'photo' },
      media: [],
    },
    preferred_session_lifetime_days: 0,
    last_seen: null,
  };
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const lastPasswordCredentialsRef = useRef<{ u: string; p: string } | null>(
    null,
  );
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[] | null>(
    null,
  );
  const [deviceBackupCodeBusy, setDeviceBackupCodeBusy] = useState(false);
  const [deviceBackupCodeError, setDeviceBackupCodeError] = useState<
    string | null
  >(null);
  const [deviceOtpBusy, setDeviceOtpBusy] = useState(false);
  const [deviceOtpError, setDeviceOtpError] = useState<string | null>(null);
  const { showWarning } = useWarning();

  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
  const [pendingDeviceLogin, setPendingDeviceLogin] = useState<{
    challengeId: string;
    requestDevice?: string;
  } | null>(null);

  const fetchUser = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: !prev.user || prev.user.id === 0,
      error: null,
    }));

    const applyGeneralInfo = (data: {
      user?: User;
      active_wallpaper?: WallpaperSetting;
      success?: boolean;
      error?: string;
    }) => {
      if (data.success && data.user) {
        setCachedUser(data.user);
        setState((prev) => {
          if (
            prev.user &&
            prev.user.id !== 0 &&
            prev.user.id === data.user!.id
          ) {
            return {
              ...prev,
              loading: false,
              activeWallpaperFromServer: data.active_wallpaper ?? prev.activeWallpaperFromServer,
            };
          }
          return {
            user: data.user!,
            loading: false,
            error: null,
            activeWallpaperFromServer: data.active_wallpaper ?? null,
          };
        });
      } else {
        setCachedUser(null);
        setState({
          user: null,
          loading: false,
          error: data.error ?? 'Failed to load user',
        });
      }
    };

    if (websocketManager.isConnected()) {
      const timeoutId = window.setTimeout(() => {
        setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      }, 15000);

      const handleGeneralInfo = (
        msg: WebSocketMessage & {
          success?: boolean;
          user?: unknown;
          active_wallpaper?: WallpaperSetting;
          error?: string;
        },
      ) => {
        if (msg.type !== 'general_info') return;
        window.clearTimeout(timeoutId);
        applyGeneralInfo({
          success: msg.success,
          user: msg.user as User | undefined,
          active_wallpaper: msg.active_wallpaper,
          error: msg.error,
        });
        websocketManager.off('general_info', handleGeneralInfo);
        websocketManager.off('message', handleError);
      };

      const handleError = (msg: WebSocketMessage) => {
        if (msg.type === 'error') {
          window.clearTimeout(timeoutId);
          setCachedUser(null);
          setState({
            user: null,
            loading: false,
            error: msg.message ?? 'Unknown error',
          });
          websocketManager.off('general_info', handleGeneralInfo);
          websocketManager.off('message', handleError);
        }
      };

      websocketManager.on('general_info', handleGeneralInfo);
      websocketManager.on('message', handleError);
      websocketManager.sendMessage({ type: 'get_general_info' });
      return;
    }

    websocketManager.connect();
  }, []);

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() => {
      setCachedUser(null);
      setState({ user: null, loading: false, error: null });
    });

    setCustomRefreshTokenFn(async () => {
      if (getAccessToken() === null) {
        await websocketManager.waitForConnection();
        if (getAccessToken() !== null) return;
        // WS may send connection_open (e.g. binding handshake differs) without access; recover via HTTP.
        await refreshTokenViaHttp();
        return;
      }
      if (websocketManager.isConnected()) {
        const access = await websocketManager.requestRefreshToken();
        setAccessToken(access);
        return;
      }
      await websocketManager.waitForConnection();
      const access = await websocketManager.requestRefreshToken();
      setAccessToken(access);
    });

    initAuth();

    const handleConnectionEstablished = () => {
      fetchUser().catch(() => {});
    };

    websocketManager.on('connection_established', handleConnectionEstablished);

    // Start WebSocket immediately so it isn't stalled behind refresh_token request
    websocketManager.connect();

    (async () => {
      const cachedUser = getCachedUser();
      if (cachedUser) {
        // Avoid flashing RoomPage before we know the refresh cookie is still valid.
        setState({ user: null, loading: true, error: null });
        if (!websocketManager.isConnected()) {
          websocketManager.connect();
        }
        try {
          await refreshTokenIfNeeded();
        } catch {
          setCachedUser(null);
          setState({ user: null, loading: false, error: null });
          return;
        }
        setState({ user: cachedUser, loading: false, error: null });
        if (websocketManager.isConnected()) {
          fetchUser().catch(() => {});
        }
        return;
      }

      setState({ user: null, loading: false, error: null });
      try {
        await refreshTokenIfNeeded();
      } catch {
        return;
      }
      if (!getAccessToken()) return;
      if (websocketManager.isConnected()) {
        fetchUser().catch(() => {});
        return;
      }
      setState({
        user: getPlaceholderUser(),
        loading: false,
        error: null,
      });
      websocketManager.connect();
    })();

    const handler = (msg: WebSocketMessage) => {
      if (msg.type === 'file_uploaded' && msg.data) {
        const userId = Number(msg.data.object_id);
        const media = msg.data.media as FileType;
        const fileObj: FileType =
          typeof media === 'object' && media !== null
            ? media
            : { id: -1, file_url: String(media) };

        setState((prev: UserState) => {
          if (!prev) return prev;

          const updatedMedia = prev.user.profile.media.map((m: DisplayMedia) =>
            m.id === userId ? { ...m, file_url: fileObj.file_url } : m,
          );

          return {
            ...prev,
            user: {
              ...prev.user,
              profile: {
                ...prev.user.profile,
                media: updatedMedia,
              },
            },
          };
        });
      }
    };

    websocketManager.on('message', handler);
    return () => {
      websocketManager.off('message', handler);
      websocketManager.off(
        'connection_established',
        handleConnectionEstablished,
      );
      setCustomRefreshTokenFn(null);
    };
  }, [fetchUser]);

  const handleLoginSuccess = useCallback(
    (data: ApiResponse) => {
      if (!data.access || !data.user) throw new Error('Invalid response');
      setAccessToken(data.access);
      if (data.refresh) setRefreshCookie(data.refresh);
      setState((prev) => ({
        ...prev,
        user: data.user,
        loading: false,
        error: null,
      }));
      if (websocketManager.isConnected()) {
        fetchUser().catch(() => {});
      } else {
        websocketManager.connect();
      }
    },
    [fetchUser],
  );

  const ingestSuccessfulAuthPayload = useCallback(
    (
      data: Record<string, unknown>,
      fallbackMessage = 'Unexpected auth response',
    ): 'session' | 'deferred' => {
      if (data.needs_device_confirmation && typeof data.challenge_id === 'string') {
        setDeviceBackupCodeError(null);
        setDeviceOtpError(null);
        const rd = data.request_device;
        setPendingDeviceLogin({
          challengeId: data.challenge_id,
          ...(typeof rd === 'string' && rd.trim()
            ? { requestDevice: rd.trim() }
            : {}),
        });
        return 'deferred';
      }
      if (data.access && data.user) {
        if (
          Array.isArray(data.backup_codes) &&
          (data.backup_codes as unknown[]).length > 0
        ) {
          setPendingBackupCodes(data.backup_codes as string[]);
        }
        handleLoginSuccess({
          access: data.access as string,
          refresh: data.refresh as string | undefined,
          user: data.user as User,
        });
        if (!websocketManager.isConnected()) {
          websocketManager.connect();
        }
        return 'session';
      }
      throw new Error(String(data.error || fallbackMessage));
    },
    [handleLoginSuccess],
  );

  const dismissPendingDeviceLogin = useCallback(() => {
    setPendingDeviceLogin(null);
    setDeviceBackupCodeError(null);
    setDeviceOtpError(null);
  }, []);

  const submitDeviceLoginOtp = useCallback(
    async (digits: string) => {
      const challengeId = pendingDeviceLogin?.challengeId;
      if (!challengeId) return;
      setDeviceOtpBusy(true);
      setDeviceOtpError(null);
      try {
        const res = await fetch('/api/device-login/submit-code/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challenge_id: challengeId,
            code: digits,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          if (data.error === 'Invalid code') {
            setDeviceOtpError(tSync('login.deviceOtpInvalid'));
          } else if (data.error === 'wrong_client') {
            setDeviceOtpError(tSync('login.deviceOtpWrongClient'));
          } else {
            setDeviceOtpError(
              String(data.error || tSync('login.deviceOtpFailed')),
            );
          }
        }
      } catch {
        setDeviceOtpError(tSync('login.deviceOtpFailed'));
      } finally {
        setDeviceOtpBusy(false);
      }
    },
    [pendingDeviceLogin?.challengeId],
  );

  const dismissPendingBackupCodes = useCallback(() => {
    setPendingBackupCodes(null);
  }, []);

  const submitDeviceLoginBackupCode = useCallback(
    async (rawCode: string) => {
      const c = lastPasswordCredentialsRef.current;
      if (!c) {
        setDeviceBackupCodeError(tSync('login.backupCodeNeedPassword'));
        return;
      }
      setDeviceBackupCodeBusy(true);
      setDeviceBackupCodeError(null);
      try {
        const res = await fetch('/api/login/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: c.u,
            password: c.p,
            backup_code: rawCode,
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          if (data.error === 'invalid_backup_code') {
            setDeviceBackupCodeError(tSync('login.backupCodeInvalid'));
            return;
          }
          throw new Error(String(data.error || 'Login failed'));
        }
        setPendingDeviceLogin(null);
        ingestSuccessfulAuthPayload(data, 'Login failed');
      } catch (e) {
        setDeviceBackupCodeError(
          e instanceof Error ? e.message : 'Login failed',
        );
      } finally {
        setDeviceBackupCodeBusy(false);
      }
    },
    [ingestSuccessfulAuthPayload],
  );

  const applyDeviceChallenge = useCallback(
    (r: { challenge_id: string; request_device?: string }) => {
      setDeviceOtpError(null);
      setDeviceBackupCodeError(null);
      const rd = r.request_device;
      setPendingDeviceLogin({
        challengeId: r.challenge_id,
        ...(typeof rd === 'string' && rd.trim()
          ? { requestDevice: rd.trim() }
          : {}),
      });
    },
    [],
  );

  useEffect(() => {
    const challengeId = pendingDeviceLogin?.challengeId;
    if (!challengeId) return;
    let cancelled = false;
    void pollDeviceLoginUntilReady(challengeId)
      .then((r) => {
        if (cancelled) return;
        setPendingDeviceLogin(null);
        if (r.backup_codes?.length) {
          setPendingBackupCodes(r.backup_codes);
        }
        handleLoginSuccess({
          access: r.access,
          user: r.user as User,
          refresh: undefined,
        });
        if (!websocketManager.isConnected()) {
          websocketManager.connect();
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPendingDeviceLogin(null);
          const msg =
            e instanceof Error && e.message === 'DEVICE_LOGIN_REJECTED'
              ? tSync('login.deviceLoginRejected')
              : e instanceof Error
                ? e.message
                : 'Device confirmation failed';
          setState((prev) => ({
            ...prev,
            error: msg,
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pendingDeviceLogin?.challengeId, handleLoginSuccess]);

  useEffect(() => {
    const uid = state.user?.id;
    if (!uid || uid === 0) return;
    const onPending = (msg: {
      challenge_id?: string;
      request_ip?: string;
      request_user_agent?: string;
      request_city?: string;
      request_country?: string;
      request_device?: string;
    }) => {
      const cid = msg.challenge_id;
      if (!cid) return;

      const deny = () => {
        void apiJson('/api/device-login/trusted-decision/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge_id: cid, decision: 'deny' }),
        }).catch(() => {});
      };

      showWarning({
        title: tSync('login.trustedDeviceRequestTitle'),
        dismissLabel: tSync('login.trustedDeviceDecline'),
        confirmLabel: tSync('login.trustedDeviceAllow'),
        onDismissAction: deny,
        body: (
          <TrustedDeviceLoginRequestBody
            ip={msg.request_ip || ''}
            city={msg.request_city || ''}
            country={msg.request_country || ''}
            device={msg.request_device || ''}
          />
        ),
        onConfirm: () => {
          void (async () => {
            try {
              const data = await apiJson<{ code?: string }>(
                '/api/device-login/trusted-decision/',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    challenge_id: cid,
                    decision: 'allow',
                  }),
                },
              );
              const code = (data.code || '').replace(/\D/g, '');
              if (code.length === 6) {
                queueMicrotask(() =>
                  showWarning({
                    title: tSync('login.trustedDeviceCodeTitle'),
                    dismissLabel: tSync('login.trustedDeviceWarningDismiss'),
                    body: (
                      <TrustedDeviceLoginWarningBody
                        code={code}
                        ip={msg.request_ip || ''}
                        city={msg.request_city || ''}
                        country={msg.request_country || ''}
                        device={msg.request_device || ''}
                      />
                    ),
                  }),
                );
              } else {
                queueMicrotask(() =>
                  showWarning({
                    title: tSync('login.trustedDeviceRevealFailedTitle'),
                    dismissLabel: tSync('login.trustedDeviceWarningDismiss'),
                    body: (
                      <p style={{ margin: 0, lineHeight: 1.45 }}>
                        {tSync('login.trustedDeviceRevealFailedBody')}
                      </p>
                    ),
                  }),
                );
              }
            } catch {
              queueMicrotask(() =>
                showWarning({
                  title: tSync('login.trustedDeviceRevealFailedTitle'),
                  dismissLabel: tSync('login.trustedDeviceWarningDismiss'),
                  body: (
                    <p style={{ margin: 0, lineHeight: 1.45 }}>
                      {tSync('login.trustedDeviceRevealFailedBody')}
                    </p>
                  ),
                }),
              );
            }
          })();
        },
      });
    };
    websocketManager.on('device_login_pending', onPending);
    return () => {
      websocketManager.off('device_login_pending', onPending);
    };
  }, [state.user?.id, showWarning]);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const loginWithPassword = useCallback(
    async (username: string, password: string, backupCode?: string) => {
      lastPasswordCredentialsRef.current = { u: username, p: password };
      setDeviceBackupCodeError(null);
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch('/api/login/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            ...(backupCode ? { backup_code: backupCode } : {}),
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          if (
            res.status === 403 &&
            data.error === 'email_not_verified'
          ) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: tSync('login.emailNotVerified'),
            }));
            return;
          }
          if (backupCode && data.error === 'invalid_backup_code') {
            throw new Error('INVALID_BACKUP');
          }
          throw new Error(String(data.error || 'Login failed'));
        }
        const outcome = ingestSuccessfulAuthPayload(data, 'Login failed');
        if (outcome === 'deferred') {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_BACKUP') {
          setState((prev) => ({ ...prev, loading: false }));
          throw err;
        }
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw err;
      }
    },
    [ingestSuccessfulAuthPayload],
  );

  const signupWithCredentials = useCallback(
    async (username: string, email: string, password: string) => {
      lastPasswordCredentialsRef.current = {
        u: (username || '').trim() || email.trim(),
        p: password,
      };
      // Avoid global loading: App unmounts login/signup when it is true.
      setState((prev) => ({ ...prev, error: null }));
      await websocketManager.waitForConnection();
      const result = await websocketManager.requestSignup(
        username,
        email,
        password,
      );
      if (result.kind === 'verify_email') {
        setState((prev) => ({ ...prev, error: null }));
        return {
          needsEmailVerification: true,
          email: result.email,
          emailVerificationOtpId: result.email_verification_otp_id,
        };
      }
      setAccessToken(result.access);
      if (result.refresh) setRefreshCookie(result.refresh);
      setState({
        user: result.user as User,
        loading: false,
        error: null,
      });
      if (websocketManager.isConnected()) {
        fetchUser().catch(() => {});
      } else {
        websocketManager.connect();
      }
      return { needsEmailVerification: false };
    },
    [fetchUser],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      lastPasswordCredentialsRef.current = null;
      const res = await fetch('/api/google/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: idToken }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(String(data.error || 'Google login failed'));
      }
      ingestSuccessfulAuthPayload(data, 'Google login failed');
    },
    [ingestSuccessfulAuthPayload],
  );

  const loginWithPasskey = useCallback(
    async (passkeyData: unknown) => {
      lastPasswordCredentialsRef.current = null;
      const res = await fetch('/api/passkey/auth/finish/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passkeyData),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        if (data.error === 'email_not_verified') {
          throw new Error(tSync('login.emailNotVerified'));
        }
        throw new Error(String(data.error || 'Passkey login failed'));
      }
      ingestSuccessfulAuthPayload(data, 'Passkey login failed');
    },
    [ingestSuccessfulAuthPayload],
  );

  const dismissAuthError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const logout = useCallback(async () => {
    const userId = state.user?.id ?? getLastUserId();
    if (userId && userId > 0) {
      deleteChatState(userId).catch(() => {});
    }
    try {
      await apiJson('/api/logout/', { method: 'POST' });
    } finally {
      setCachedUser(null);
      setLastUserId(0);
      authLogout();
      setState({ user: null, loading: false, error: null });
    }
  }, [state.user?.id]);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: !!state.user,
      refreshUser: fetchUser,
      setUser,
      loginWithPassword,
      signupWithCredentials,
      loginWithGoogle,
      loginWithPasskey,
      logout,
      dismissAuthError,
      pendingDeviceLogin,
      dismissPendingDeviceLogin,
      applyDeviceChallenge,
      pendingBackupCodes,
      dismissPendingBackupCodes,
      ingestSuccessfulAuthPayload,
    }),
    [
      state,
      fetchUser,
      setUser,
      loginWithPassword,
      signupWithCredentials,
      loginWithGoogle,
      loginWithPasskey,
      logout,
      dismissAuthError,
      pendingDeviceLogin,
      dismissPendingDeviceLogin,
      applyDeviceChallenge,
      pendingBackupCodes,
      dismissPendingBackupCodes,
      ingestSuccessfulAuthPayload,
    ],
  );

  return (
    <UserContext.Provider value={value}>
      <LanguageProvider>
        {children}
        {pendingBackupCodes?.length ? (
          <BackupCodesSavedModal
            codes={pendingBackupCodes}
            onDismiss={dismissPendingBackupCodes}
          />
        ) : null}
        {pendingDeviceLogin ? (
          <DeviceLoginPendingOverlay
            requestDevice={pendingDeviceLogin.requestDevice}
            onCancel={dismissPendingDeviceLogin}
            onSubmitOtp={submitDeviceLoginOtp}
            otpBusy={deviceOtpBusy}
            otpError={deviceOtpError}
            onSubmitBackupCode={submitDeviceLoginBackupCode}
            backupCodeBusy={deviceBackupCodeBusy}
            backupCodeError={deviceBackupCodeError}
          />
        ) : null}
      </LanguageProvider>
    </UserContext.Provider>
  );
};

UserProvider.displayName = 'UserProvider';
