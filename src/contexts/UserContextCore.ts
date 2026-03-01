import { createContext, useContext } from 'react';
import type { User } from '@/types';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse {
  access: string;
  user: User;
  refresh?: string;
}

export interface UserContextType extends UserState {
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  signupWithCredentials: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPasskey: (passkeyData: unknown) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
};

export async function postJson<T>(url: string, body: unknown): Promise<T> {
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
