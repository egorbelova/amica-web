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

/** Result of `loginWithPassword` (throws on network/unhandled errors). */
export type LoginPasswordOutcome =
  | 'session'
  | 'deferred'
  | 'needs_totp'
  | 'invalid_totp'
  | 'invalid_backup_code'
  | 'email_not_verified';

export type SecondFactorSubmission =
  | { kind: 'totp'; code: string }
  | { kind: 'backup'; code: string };

export interface UserContextType extends UserState {
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  loginWithPassword: (
    username: string,
    password: string,
    secondFactor?: SecondFactorSubmission,
  ) => Promise<LoginPasswordOutcome>;
  signupWithCredentials: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{
    needsEmailVerification: boolean;
    email?: string;
    emailVerificationOtpId?: string;
  }>;
  /** `totp_required` → pending second factor; `invalid_*` when verifying. */
  loginWithGoogle: (
    idToken: string,
    secondFactor?: SecondFactorSubmission,
  ) => Promise<
    'success' | 'totp_required' | 'invalid_totp' | 'invalid_backup_code'
  >;
  /** WebAuthn proves possession; TOTP is not required after passkey auth. */
  loginWithPasskey: (passkeyData: unknown) => Promise<'success'>;
  /** After Google returned totp_required, submit the 6-digit code or a backup code. */
  pendingTotpSecondFactor: { kind: 'google'; accessToken: string } | null;
  /** Returns true if the submitted factor was wrong (keep modal open). */
  submitTotpSecondFactor: (
    kind: 'totp' | 'backup',
    value: string,
  ) => Promise<boolean>;
  dismissPendingTotpSecondFactor: () => void;
  /** Password login: server asked for authenticator code. */
  passwordLoginNeedsTotp: boolean;
  dismissPasswordLoginTotp: () => void;
  logout: () => Promise<void>;
  /** Clear global auth error (e.g. device-login poll failure) without logging out. */
  dismissAuthError: () => void;
  /** New device: wait for WS challenge status; trusted device label when known. */
  pendingDeviceLogin: {
    challengeId: string;
    trustedDeviceLabel?: string;
    delivery?: 'trusted_device' | 'email';
  } | null;
  dismissPendingDeviceLogin: () => void;
  /** e.g. passkey register/finish returned needs_device_confirmation */
  applyDeviceChallenge: (r: {
    challenge_id: string;
    trusted_device?: string;
    delivery?: 'trusted_device' | 'email';
  }) => void;
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
