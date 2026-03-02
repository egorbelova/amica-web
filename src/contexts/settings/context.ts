import { createContext, useContext } from 'react';
import type {
  SettingsContextValue,
  SettingsStateValue,
  SettingsActionsValue,
} from './types';

export const SettingsStateContext = createContext<SettingsStateValue | null>(
  null,
);
export const SettingsActionsContext =
  createContext<SettingsActionsValue | null>(null);

export interface BlurContextValue {
  blur: number;
  setBlur: (value: number) => void;
}

export const BlurContext = createContext<BlurContextValue | null>(null);

export function useSettingsState(): SettingsStateValue {
  const ctx = useContext(SettingsStateContext);
  if (!ctx)
    throw new Error('useSettingsState must be used within SettingsProvider');
  return ctx;
}

export function useSettingsActions(): SettingsActionsValue {
  const ctx = useContext(SettingsActionsContext);
  if (!ctx)
    throw new Error('useSettingsActions must be used within SettingsProvider');
  return ctx;
}

export function useBlur(): BlurContextValue {
  const ctx = useContext(BlurContext);
  if (!ctx)
    throw new Error('useBlur must be used within SettingsProvider');
  return ctx;
}

export function useSettings(): SettingsContextValue {
  const state = useSettingsState();
  const actions = useSettingsActions();
  return { ...state, ...actions };
}
