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
import { clientBindingHeaders } from '@/utils/clientBinding';
import { pollDeviceLoginUntilReady } from '@/utils/deviceLoginPoll';
import {
  DeviceLoginPendingOverlay,
  TrustedDeviceConfirmModal,
  RecoveryCooldownOverlay,
  RecoveryEmailOtpModal,
} from '@/components/DeviceLogin/DeviceLoginFlows';

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
  const [recoveryCooldown, setRecoveryCooldown] = useState<{
    tryAfter: string;
    message?: string;
  } | null>(null);
  const [recoveryOtpPending, setRecoveryOtpPending] = useState<{
    otpId: string;
  } | null>(null);
  const [recoveryOtpError, setRecoveryOtpError] = useState<string | null>(null);
  const [recoveryOtpSubmitting, setRecoveryOtpSubmitting] = useState(false);
  const [noTrustedDeviceBusy, setNoTrustedDeviceBusy] = useState(false);
  const [noTrustedDeviceError, setNoTrustedDeviceError] = useState<string | null>(
    null,
  );

  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
  const [pendingDeviceLogin, setPendingDeviceLogin] = useState<{
    challengeId: string;
    code: string;
  } | null>(null);
  const [trustedDeviceChallengeId, setTrustedDeviceChallengeId] = useState<
    string | null
  >(null);

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
        setState({ user: cachedUser, loading: false, error: null });
        if (!websocketManager.isConnected()) {
          websocketManager.connect();
        } else {
          fetchUser().catch(() => {});
        }
        refreshTokenIfNeeded()
          .then(() => {})
          .catch(() => {
            setCachedUser(null);
            setState({ user: null, loading: false, error: null });
          });
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
      if (data.recovery_cooldown && typeof data.try_after === 'string') {
        setRecoveryCooldown({
          tryAfter: data.try_after,
          message:
            typeof data.message === 'string' ? data.message : undefined,
        });
        return 'deferred';
      }
      if (data.needs_recovery_email_otp && data.otp_id != null) {
        setRecoveryOtpPending({ otpId: String(data.otp_id) });
        return 'deferred';
      }
      if (
        data.needs_device_confirmation &&
        typeof data.challenge_id === 'string' &&
        typeof data.code === 'string'
      ) {
        setPendingDeviceLogin({
          challengeId: data.challenge_id,
          code: data.code,
        });
        return 'deferred';
      }
      if (data.access && data.user) {
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
  }, []);

  const dismissRecoveryCooldown = useCallback(() => {
    setRecoveryCooldown(null);
  }, []);

  const dismissRecoveryOtp = useCallback(() => {
    setRecoveryOtpPending(null);
    setRecoveryOtpError(null);
  }, []);

  const requestDeviceRecoveryNoAccess = useCallback(async () => {
    const c = lastPasswordCredentialsRef.current;
    if (!c) {
      setNoTrustedDeviceError(tSync('login.noTrustedDeviceNeedPassword'));
      return;
    }
    setNoTrustedDeviceBusy(true);
    setNoTrustedDeviceError(null);
    try {
      const res = await fetch('/api/device-recovery/no-access/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...clientBindingHeaders(),
        },
        body: JSON.stringify({ username: c.u, password: c.p }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setNoTrustedDeviceError(String(data.error || 'Request failed'));
        return;
      }
      setPendingDeviceLogin(null);
      setRecoveryCooldown({
        tryAfter: String(data.cooldown_until ?? ''),
        message:
          typeof data.message === 'string' ? data.message : undefined,
      });
    } catch {
      setNoTrustedDeviceError(tSync('login.noTrustedDeviceRequestFailed'));
    } finally {
      setNoTrustedDeviceBusy(false);
    }
  }, []);

  const submitRecoveryOtp = useCallback(
    async (code: string) => {
      if (!recoveryOtpPending) return;
      setRecoveryOtpSubmitting(true);
      setRecoveryOtpError(null);
      try {
        const res = await fetch('/api/device-recovery/verify-otp/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...clientBindingHeaders(),
          },
          body: JSON.stringify({
            otp_id: recoveryOtpPending.otpId,
            code,
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          setRecoveryOtpError(
            String(data.error || tSync('login.recoveryOtpFailed')),
          );
          return;
        }
        setRecoveryOtpPending(null);
        handleLoginSuccess({
          access: data.access as string,
          user: data.user as User,
          refresh: undefined,
        });
      } catch {
        setRecoveryOtpError(tSync('login.recoveryOtpFailed'));
      } finally {
        setRecoveryOtpSubmitting(false);
      }
    },
    [recoveryOtpPending, handleLoginSuccess],
  );

  const applyDeviceChallenge = useCallback(
    (r: { challenge_id: string; code: string }) => {
      setPendingDeviceLogin({
        challengeId: r.challenge_id,
        code: r.code,
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
          setState((prev) => ({
            ...prev,
            error:
              e instanceof Error ? e.message : 'Device confirmation failed',
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
    const onPending = (msg: { challenge_id?: string }) => {
      if (msg.challenge_id) {
        setTrustedDeviceChallengeId(msg.challenge_id);
      }
    };
    websocketManager.on('device_login_pending', onPending);
    return () => {
      websocketManager.off('device_login_pending', onPending);
    };
  }, [state.user?.id]);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const loginWithPassword = useCallback(
    async (username: string, password: string) => {
      lastPasswordCredentialsRef.current = { u: username, p: password };
      setRecoveryCooldown(null);
      setRecoveryOtpPending(null);
      setRecoveryOtpError(null);
      setNoTrustedDeviceError(null);
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch('/api/login/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...clientBindingHeaders(),
          },
          body: JSON.stringify({ username, password }),
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
          throw new Error(String(data.error || 'Login failed'));
        }
        ingestSuccessfulAuthPayload(data, 'Login failed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw err;
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
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
      setRecoveryCooldown(null);
      setRecoveryOtpPending(null);
      setRecoveryOtpError(null);
      const res = await fetch('/api/google/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...clientBindingHeaders(),
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
      setRecoveryCooldown(null);
      setRecoveryOtpPending(null);
      setRecoveryOtpError(null);
      const res = await fetch('/api/passkey/auth/finish/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...clientBindingHeaders(),
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
      pendingDeviceLogin,
      dismissPendingDeviceLogin,
      applyDeviceChallenge,
      recoveryCooldown,
      dismissRecoveryCooldown,
      recoveryOtpPending,
      dismissRecoveryOtp,
      recoveryOtpError,
      recoveryOtpSubmitting,
      submitRecoveryOtp,
      requestDeviceRecoveryNoAccess,
      noTrustedDeviceBusy,
      noTrustedDeviceError,
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
      pendingDeviceLogin,
      dismissPendingDeviceLogin,
      applyDeviceChallenge,
      recoveryCooldown,
      dismissRecoveryCooldown,
      recoveryOtpPending,
      dismissRecoveryOtp,
      recoveryOtpError,
      recoveryOtpSubmitting,
      submitRecoveryOtp,
      requestDeviceRecoveryNoAccess,
      noTrustedDeviceBusy,
      noTrustedDeviceError,
      ingestSuccessfulAuthPayload,
    ],
  );

  return (
    <UserContext.Provider value={value}>
      <LanguageProvider>
        {children}
        {recoveryCooldown ? (
          <RecoveryCooldownOverlay
            tryAfterIso={recoveryCooldown.tryAfter}
            message={recoveryCooldown.message}
            onDismiss={dismissRecoveryCooldown}
          />
        ) : null}
        {pendingDeviceLogin ? (
          <DeviceLoginPendingOverlay
            code={pendingDeviceLogin.code}
            onCancel={dismissPendingDeviceLogin}
            onNoTrustedDevice={requestDeviceRecoveryNoAccess}
            noTrustedDeviceBusy={noTrustedDeviceBusy}
            noTrustedDeviceError={noTrustedDeviceError}
          />
        ) : null}
        {trustedDeviceChallengeId ? (
          <TrustedDeviceConfirmModal
            challengeId={trustedDeviceChallengeId}
            onClose={() => setTrustedDeviceChallengeId(null)}
          />
        ) : null}
        {recoveryOtpPending ? (
          <RecoveryEmailOtpModal
            onSubmit={submitRecoveryOtp}
            onCancel={dismissRecoveryOtp}
            error={recoveryOtpError}
            submitting={recoveryOtpSubmitting}
          />
        ) : null}
      </LanguageProvider>
    </UserContext.Provider>
  );
};

UserProvider.displayName = 'UserProvider';
