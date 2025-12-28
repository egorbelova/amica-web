export interface Settings {
  language: string;
  theme: 'system' | 'light' | 'dark';
  timeFormat: 'auto' | '12h' | '24h';
}

export interface SettingsContextValue {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}
