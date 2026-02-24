import React, { useEffect, useState, useCallback } from 'react';
import { apiJson, setApiFetchUnauthorizedHandler } from '../utils/apiFetch';
import {
  setAccessToken,
  logout as authLogout,
  initAuth,
} from '../utils/authStore';
import {
  websocketManager,
  type WebSocketMessage,
} from '@/utils/websocket-manager';
import type { DisplayMedia, User } from '@/types';
import { useSettings } from './settings/context';
import type { WallpaperSetting } from './settings/types';
import { UserContext, postJson } from './UserContextCore';
import type { UserState, ApiResponse } from './UserContextCore';
import type { File as FileType } from '@/types';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
  const { setActiveWallpaper } = useSettings();

  const fetchUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiJson<{
        user: User;
        active_wallpaper?: WallpaperSetting;
      }>('/api/get_general_info/');
      setState({ user: data.user, loading: false, error: null });

      if (!data.active_wallpaper) return;
      setActiveWallpaper({
        id: data.active_wallpaper.id,
        url: data.active_wallpaper.url,
        type: data.active_wallpaper.type,
        blur: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ user: null, loading: false, error: message });
    }
  }, [setActiveWallpaper]);

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() =>
      setState({ user: null, loading: false, error: null }),
    );

    (async () => {
      initAuth();
      await fetchUser().catch(() => {});
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
    return () => websocketManager.off('message', handler);
  }, [fetchUser]);

  const handleLoginSuccess = useCallback(
    (data: ApiResponse) => {
      if (!data.access || !data.user) throw new Error('Invalid response');
      setAccessToken(data.access);
      return fetchUser();
    },
    [fetchUser],
  );

  const loginWithPassword = (username: string, password: string) =>
    postJson<ApiResponse>('/api/login/', { username, password }).then(
      handleLoginSuccess,
    );

  const loginWithGoogle = (idToken: string) =>
    postJson<ApiResponse>('/api/google/', { access_token: idToken }).then(
      handleLoginSuccess,
    );

  const loginWithPasskey = (passkeyData: unknown) =>
    postJson<ApiResponse>('/api/passkey_auth_finish/', passkeyData).then(
      handleLoginSuccess,
    );

  const logout = async () => {
    try {
      await apiJson('/api/logout/', { method: 'POST' });
    } finally {
      authLogout();
      setState({ user: null, loading: false, error: null });
    }
  };

  return (
    <UserContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user,
        refreshUser: fetchUser,
        setUser: useCallback(
          (user: User | null) => setState((prev) => ({ ...prev, user })),
          [],
        ),
        loginWithPassword,
        loginWithGoogle,
        loginWithPasskey,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
