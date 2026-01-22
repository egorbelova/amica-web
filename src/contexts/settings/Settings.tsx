import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { Settings, SettingsContextValue, WallpaperSetting } from './types';
import { websocketManager } from '@/utils';
import { apiUpload, apiFetch } from '@/utils/apiFetch';

const defaultWallpapers: WallpaperSetting[] = [
  {
    id: 0,
    url: '../DefaultWallpapers/abdelhamid-azoui-Zhl3nrozkG0-unsplash.jpg',
    type: 'photo',
    blur: 0,
  },
  {
    id: 1,
    url: '../DefaultWallpapers/syuhei-inoue-fvgv3i4_uvI-unsplash.jpg',
    type: 'photo',
    blur: 2,
  },
  {
    id: 2,
    url: '../DefaultWallpapers/dave-hoefler-PEkfSAxeplg-unsplash.jpg',
    type: 'photo',
    blur: 5,
  },
  {
    id: 3,
    url: '../DefaultWallpapers/video/blue-sky-seen-directly-with-some-clouds_480p_infinity.webm',
    type: 'video',
    blur: 0,
  },
];

const defaultSettings: Settings = {
  language: navigator.language || 'en-US',
  theme: 'system',
  timeFormat: 'auto',
  wallpapers: defaultWallpapers,
  activeWallpaper: defaultWallpapers[0],
  useBackgroundThroughoutTheApp: false,
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // const saved = localStorage.getItem('app-settings');
    // if (saved) {
    //   try {
    //     const parsed = JSON.parse(saved);

    //     const combinedWallpapers = [
    //       ...defaultWallpapers.filter(
    //         (df) => !parsed.wallpapers?.some((w: any) => w.id === df.id)
    //       ),
    //       ...(parsed.wallpapers || []),
    //     ];

    //     return {
    //       ...defaultSettings,
    //       ...parsed,
    //       wallpapers: combinedWallpapers,
    //       activeWallpaper: parsed.activeWallpaper || defaultWallpapers[0],
    //     };
    //   } catch {
    //     return defaultSettings;
    //   }
    // }
    return defaultSettings;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setActiveWallpaper = (wallpaper: WallpaperSetting) => {
    setSettings((prev) => {
      const exists =
        prev.wallpapers?.some((w) => w.id === wallpaper.id) ?? false;

      if (prev.activeWallpaper?.id !== wallpaper.id) {
        websocketManager.sendMessage({
          type: 'set_active_wallpaper',
          data: { id: wallpaper.id },
        });
      }

      return {
        ...prev,
        wallpapers: exists
          ? prev.wallpapers
          : [...(prev.wallpapers || []), wallpaper],
        activeWallpaper: wallpaper,
      };
    });
  };

  const removeWallpaper = (id: number) => {
    websocketManager.sendMessage({
      type: 'delete_user_wallpaper',
      data: { id },
    });
  };

  async function fetchWallpapers() {
    try {
      const res = await apiFetch('/api/wallpapers/');
      const data = await res.json();
      const apiWallpapers = Array.isArray(data) ? data : data.wallpapers || [];
      const combinedWallpapers = [
        ...defaultWallpapers.filter(
          (df) => !apiWallpapers.some((w) => w.id === df.id),
        ),
        ...apiWallpapers,
      ];
      setSettings((prev) => ({
        ...prev,
        wallpapers: combinedWallpapers,
      }));
    } catch (err) {
      console.error('Failed to fetch wallpapers', err);
      setSettings((prev) => ({ ...prev, wallpapers: [] }));
    } finally {
      setLoading(false);
    }
  }

  const addUserWallpaper = async (wallpaper: WallpaperSetting) => {
    try {
      const formData = new FormData();
      Object.entries(wallpaper).forEach(([key, value]) => {
        if (!value) return;
        //@ts-ignore
        formData.append(key, value instanceof File ? value : String(value));
      });

      await apiUpload('/api/wallpapers/', formData);
    } catch (error) {
      console.error('addUserWallpaper error:', error);
    }
  };

  const handleWSMessage = useCallback((data: any) => {
    if (!data.type) return;
    // console.log('data', data);

    if (data.type === 'active_wallpaper_updated') {
      const wallpaperData = { ...data.data, url: data.data.url };
      setSettings((prev) => ({
        ...prev,
        wallpapers: prev.wallpapers?.some((w) => w.id === wallpaperData.id)
          ? prev.wallpapers
          : [...(prev.wallpapers || []), wallpaperData],
        activeWallpaper: wallpaperData,
      }));
    }

    if (data.type === 'user_wallpaper_deleted') {
      const wallpaperId = data.id;
      setSettings((prev) => ({
        ...prev,
        wallpapers: (prev.wallpapers || []).filter((w) => w.id !== wallpaperId),
        activeWallpaper:
          prev.activeWallpaper?.id === wallpaperId
            ? defaultSettings.activeWallpaper
            : prev.activeWallpaper,
      }));
    }
    if (data.type === 'user_wallpaper_added') {
      const wallpaperData = { ...data.data, url: data.data.url };
      setSettings((prev) => ({
        ...prev,
        wallpapers: prev.wallpapers?.some((w) => w.id === wallpaperData.id)
          ? prev.wallpapers
          : [...(prev.wallpapers || []), wallpaperData],
      }));
    }
  }, []);

  useEffect(() => {
    websocketManager.on('message', handleWSMessage);
    if (!websocketManager.isConnected()) {
      websocketManager.connect();
    }
    return () => websocketManager.off('message', handleWSMessage);
  }, [handleWSMessage]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSetting,
        setActiveWallpaper,
        addUserWallpaper,
        //@ts-ignore
        removeWallpaper,
        fetchWallpapers,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
