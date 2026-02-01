import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { apiJson, setApiFetchUnauthorizedHandler } from '../utils/apiFetch';
import {
  setAccessToken,
  logout as authLogout,
  initAuth,
} from '../utils/authStore';
import { websocketManager } from '@/utils/websocket-manager';
import type { User } from '@/types';
import { useSettings } from './settings/Settings';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse {
  access: string;
  user: User;
  refresh?: string;
}

interface UserContextType extends UserState {
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPasskey: (passkeyData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
  const { setActiveWallpaper } = useSettings();

  const fetchUser = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiJson<{ user: User }>('/api/get_general_info/');
      setState({ user: data.user, loading: false, error: null });
      //@ts-ignore
      if (!data.active_wallpaper) return;
      setActiveWallpaper({
        //@ts-ignore
        id: data.active_wallpaper.id,
        //@ts-ignore
        url: data.active_wallpaper.url,
        //@ts-ignore
        type: data.active_wallpaper.type,
        blur: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ user: null, loading: false, error: message });
    }
  };

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() =>
      setState({ user: null, loading: false, error: null }),
    );

    (async () => {
      initAuth();
      await fetchUser().catch(() => {});
    })();
    const handler = (msg: any) => {
      if (msg.type === 'file_uploaded') {
        const userId = msg.data.object_id;
        const newUrl = msg.data.media;
        setState((prev) => {
          if (!prev.user) return prev;

          if (prev.user.id === userId) {
            return {
              ...prev,
              user: {
                ...prev.user,
                profile: {
                  ...prev.user.profile,
                  primary_avatar: newUrl,
                },
              },
            };
          }

          const updatedMedia = prev.user.profile.media.map((m) =>
            m.id === userId ? { ...m, small: newUrl } : m,
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
  }, []);

  const handleLoginSuccess = (data: ApiResponse) => {
    if (!data.access || !data.user) throw new Error('Invalid response');
    setAccessToken(data.access);
    return fetchUser();
  };

  const loginWithPassword = (username: string, password: string) =>
    postJson<ApiResponse>('/api/login/', { username, password }).then(
      handleLoginSuccess,
    );

  const loginWithGoogle = (idToken: string) =>
    postJson<ApiResponse>('/api/google/', { access_token: idToken }).then(
      handleLoginSuccess,
    );

  const loginWithPasskey = (passkeyData: any) =>
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

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
};
