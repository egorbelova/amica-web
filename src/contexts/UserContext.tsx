import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { apiJson, setApiFetchUnauthorizedHandler } from '../utils/apiFetch';
import {
  setAccessToken,
  logout as authLogout,
  initAuth,
  getAccessToken,
  refreshTokenIfNeeded,
  setCustomRefreshTokenFn,
  refreshTokenViaHttp,
} from '../utils/authStore';
import {
  websocketManager,
  type WebSocketMessage,
} from '@/utils/websocket-manager';
import type { DisplayMedia, User } from '@/types';
import { useSettingsActions } from './settings/context';
import type { WallpaperSetting } from './settings/types';
import { UserContext, postJson } from './UserContextCore';
import type { UserState, ApiResponse } from './UserContextCore';
import type { File as FileType } from '@/types';

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
  const { setActiveWallpaper } = useSettingsActions();

  const fetchUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const applyGeneralInfo = (data: {
      user?: User;
      active_wallpaper?: WallpaperSetting;
      success?: boolean;
      error?: string;
    }) => {
      if (data.success && data.user) {
        setState({ user: data.user, loading: false, error: null });
        if (data.active_wallpaper) {
          setActiveWallpaper({
            id: data.active_wallpaper.id,
            url: data.active_wallpaper.url,
            type: data.active_wallpaper.type,
            blur: 0,
          });
        }
      } else {
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
  }, [setActiveWallpaper]);

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() =>
      setState({ user: null, loading: false, error: null }),
    );

    setCustomRefreshTokenFn(async () => {
      if (getAccessToken() === null) {
        await refreshTokenViaHttp();
        return;
      }
      if (websocketManager.isConnected()) {
        try {
          const access = await websocketManager.requestRefreshToken();
          setAccessToken(access);
        } catch {
          await refreshTokenViaHttp();
        }
        return;
      }
      await refreshTokenViaHttp();
    });

    initAuth();

    const handleConnectionEstablished = () => {
      fetchUser().catch(() => {});
    };

    websocketManager.on('connection_established', handleConnectionEstablished);

    (async () => {
      try {
        await refreshTokenIfNeeded();
      } catch {
        setState({ user: null, loading: false, error: null });
        return;
      }
      if (!getAccessToken()) {
        setState({ user: null, loading: false, error: null });
        return;
      }
      if (websocketManager.isConnected()) {
        fetchUser().catch(() => {});
        return;
      }
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
      websocketManager.off('connection_established', handleConnectionEstablished);
      setCustomRefreshTokenFn(null);
    };
  }, [fetchUser]);

  const handleLoginSuccess = useCallback(
    (data: ApiResponse) => {
      if (!data.access || !data.user) throw new Error('Invalid response');
      setAccessToken(data.access);
      if (websocketManager.isConnected()) {
        return fetchUser();
      }
      websocketManager.connect();
      // fetchUser will be called on connection_established
    },
    [fetchUser],
  );

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const loginWithPassword = useCallback(
    (username: string, password: string) =>
      postJson<ApiResponse>('/api/login/', { username, password }).then(
        handleLoginSuccess,
      ),
    [handleLoginSuccess],
  );

  const loginWithGoogle = useCallback(
    (idToken: string) =>
      postJson<ApiResponse>('/api/google/', { access_token: idToken }).then(
        handleLoginSuccess,
      ),
    [handleLoginSuccess],
  );

  const loginWithPasskey = useCallback(
    (passkeyData: unknown) =>
      postJson<ApiResponse>('/api/passkey_auth_finish/', passkeyData).then(
        handleLoginSuccess,
      ),
    [handleLoginSuccess],
  );

  const logout = useCallback(async () => {
    try {
      await apiJson('/api/logout/', { method: 'POST' });
    } finally {
      authLogout();
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: !!state.user,
      refreshUser: fetchUser,
      setUser,
      loginWithPassword,
      loginWithGoogle,
      loginWithPasskey,
      logout,
    }),
    [
      state,
      fetchUser,
      setUser,
      loginWithPassword,
      loginWithGoogle,
      loginWithPasskey,
      logout,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

UserProvider.displayName = 'UserProvider';
