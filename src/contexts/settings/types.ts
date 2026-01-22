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
export interface SettingsContextValue {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setActiveWallpaper: (wallpaper: WallpaperSetting) => void;
  addUserWallpaper: (wallpaper: WallpaperSetting) => void;
}
