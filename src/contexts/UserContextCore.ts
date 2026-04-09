import { createContext, useContext } from 'react';
import type { User } from '@/types';
import type { WallpaperSetting } from './settings/types';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** Set when general_info returns active_wallpaper; sync to settings in UI. */
  activeWallpaperFromServer?: WallpaperSetting | null;
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
  loginWithPassword: (
    username: string,
    password: string,
    backupCode?: string,
  ) => Promise<void>;
  signupWithCredentials: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{
    needsEmailVerification: boolean;
    email?: string;
    emailVerificationOtpId?: string;
  }>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPasskey: (passkeyData: unknown) => Promise<void>;
  logout: () => Promise<void>;
  /** Clear global auth error (e.g. device-login poll failure) without logging out. */
  dismissAuthError: () => void;
  /** New device: poll until trusted device confirms; optional parsed UA label for UI. */
  pendingDeviceLogin: { challengeId: string; requestDevice?: string } | null;
  dismissPendingDeviceLogin: () => void;
  /** e.g. passkey register/finish returned needs_device_confirmation */
  applyDeviceChallenge: (r: { challenge_id: string; request_device?: string }) => void;
  /** Shown once after first full session when server issues backup codes */
  pendingBackupCodes: string[] | null;
  dismissPendingBackupCodes: () => void;
  /** Apply 200 JSON from login / verify-email-otp / passkey (access+user or device gates). */
  ingestSuccessfulAuthPayload: (
    data: Record<string, unknown>,
    fallbackMessage?: string,
  ) => 'session' | 'deferred';
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}
