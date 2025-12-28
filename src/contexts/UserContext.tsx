import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  apiJson,
  initAuth,
  setAccessToken,
  setApiFetchUnauthorizedHandler,
} from '../utils/apiFetch';

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
    } catch (err: any) {
      setState({ user: null, loading: false, error: err.message });
    }
  };

  useEffect(() => {
    setApiFetchUnauthorizedHandler(() =>
      setState({ user: null, loading: false, error: null })
    );
    initAuth()
      .then(fetchUser)
      .catch(() => {});
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
      setState({ user: null, loading: false, error: null });
    }
  };

  return (
    <UserContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user,
        refreshUser: fetchUser,
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
