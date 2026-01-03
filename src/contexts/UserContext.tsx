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

export interface UserProfile {
  last_seen: string | null;
  bio: string | null;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  primary_avatar: any | null;
  media: any[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  profile: UserProfile;
  preferred_session_lifetime_days: number;
}

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

  const fetchUser = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiJson<{ user: User }>('/api/get_general_info/');
      setState({ user: data.user, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ user: null, loading: false, error: message });
    }
  };

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() =>
      setState({ user: null, loading: false, error: null })
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
            m.id === userId ? { ...m, small: newUrl } : m
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
    setState({ user: data.user, loading: false, error: null });
  };

  const loginWithPassword = (username: string, password: string) =>
    postJson<ApiResponse>('/api/login/', { username, password }).then(
      handleLoginSuccess
    );

  const loginWithGoogle = (idToken: string) =>
    postJson<ApiResponse>('/api/google/', { id_token: idToken }).then(
      handleLoginSuccess
    );

  const loginWithPasskey = (passkeyData: any) =>
    postJson<ApiResponse>('/api/passkey_auth_finish/', passkeyData).then(
      handleLoginSuccess
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
          []
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
