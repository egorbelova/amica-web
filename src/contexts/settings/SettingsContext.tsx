import { createContext } from 'react';
import type { Settings, SettingsContextValue } from './types';

export const SettingsContext = createContext<SettingsContextValue | null>(null);
