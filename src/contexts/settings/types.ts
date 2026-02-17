export type WallpaperType = 'photo' | 'video';

export type WallpaperSetting = {
  id: number | string | null;
  url: string | null;
  type?: WallpaperType;
  blur?: number;
};

export type Settings = {
  language: string;
  theme: 'light' | 'dark' | 'system';
  timeFormat: '12h' | '24h' | 'auto';
  wallpapers: WallpaperSetting[];
  activeWallpaper?: WallpaperSetting | null;
  useBackgroundThroughoutTheApp: boolean;
};

export type SubTab =
  | 'account'
  | 'language'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'active_sessions';

export interface SettingsContextValue {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setActiveWallpaper: (wallpaper: WallpaperSetting) => void;
  addUserWallpaper: (file: File) => void;
  activeProfileTab: SubTab;
  setActiveProfileTab: (tab: SubTab) => void;
  autoplayVideos: boolean;
  setAutoplayVideos: (value: boolean) => void;
  setBlur: (value: number) => void;
  removeWallpaper: (id: string) => void;
  fetchWallpapers: () => Promise<void>;
  loading: boolean;
  settingsFullWindow: boolean;
  setSettingsFullWindow: (value: boolean) => void;
  isResizingPermitted: boolean;
  setIsResizingPermitted: (value: boolean) => void;
}
