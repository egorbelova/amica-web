import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Account tab header: Edit opens username edit; Save submits (like SideBarMedia). */
export type ProfileAccountHeaderRegistration = {
  usernameEditing: boolean;
  onPrimaryAction: () => void;
  primaryDisabled: boolean;
  /** Leave username edit without saving (same as read mode). */
  discardUsernameEdit: () => void;
};

type Ctx = {
  reg: ProfileAccountHeaderRegistration | null;
  setRegistration: (r: ProfileAccountHeaderRegistration | null) => void;
};

const ProfileAccountSaveContext = createContext<Ctx | null>(null);

export function ProfileAccountSaveProvider({ children }: { children: ReactNode }) {
  const [reg, setRegistration] =
    useState<ProfileAccountHeaderRegistration | null>(null);
  const value = useMemo(
    () => ({ reg, setRegistration }),
    [reg],
  );
  return (
    <ProfileAccountSaveContext.Provider value={value}>
      {children}
    </ProfileAccountSaveContext.Provider>
  );
}

export function useProfileAccountSaveRegistrationSetter() {
  const ctx = useContext(ProfileAccountSaveContext);
  return ctx?.setRegistration ?? null;
}

export function useProfileAccountSaveRegistration() {
  const ctx = useContext(ProfileAccountSaveContext);
  return ctx?.reg ?? null;
}
