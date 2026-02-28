import { createContext, useContext } from 'react';
import type {
  SettingsContextValue,
  SettingsStateValue,
  SettingsActionsValue,
} from './types';

export const SettingsStateContext =
  createContext<SettingsStateValue | null>(null);
export const SettingsActionsContext =
  createContext<SettingsActionsValue | null>(null);

/** Подписка только на состояние — ре-рендер при изменении любых настроек. */
export function useSettingsState(): SettingsStateValue {
  const ctx = useContext(SettingsStateContext);
  if (!ctx) throw new Error('useSettingsState must be used within SettingsProvider');
  return ctx;
}

/** Только экшены (стабильная ссылка) — не даёт ре-рендера при изменении настроек. */
export function useSettingsActions(): SettingsActionsValue {
  const ctx = useContext(SettingsActionsContext);
  if (!ctx) throw new Error('useSettingsActions must be used within SettingsProvider');
  return ctx;
}

/** Полный доступ (состояние + экшены). Для обратной совместимости. */
export function useSettings(): SettingsContextValue {
  const state = useSettingsState();
  const actions = useSettingsActions();
  return { ...state, ...actions };
}
