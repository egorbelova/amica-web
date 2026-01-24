import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type {
  Settings,
  SettingsContextValue,
  WallpaperSetting,
  SubTab,
} from './types';
import { websocketManager } from '@/utils';
import { apiUpload, apiFetch } from '@/utils/apiFetch';

const defaultWallpapers: WallpaperSetting[] = [
  {
    id: 'default-0',
    url: '../DefaultWallpapers/abdelhamid-azoui-Zhl3nrozkG0-unsplash.jpg',
    type: 'photo',
    blur: 0,
  },
  {
    id: 'default-1',
    url: '../DefaultWallpapers/syuhei-inoue-fvgv3i4_uvI-unsplash.jpg',
    type: 'photo',
    blur: 2,
  },
  {
    id: 'default-2',
    url: '../DefaultWallpapers/dave-hoefler-PEkfSAxeplg-unsplash.jpg',
    type: 'photo',
    blur: 5,
  },
  {
    id: 'default-3',
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
    const saved = localStorage.getItem('app-settings');
    let parsed: Partial<Settings> = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = {};
      }
    }

    const combinedWallpapers = [
      ...defaultWallpapers.filter(
        (df) => !parsed.wallpapers?.some((w: any) => w.id === df.id),
      ),
      ...(parsed.wallpapers || []),
    ];

    const activeWallpaper = defaultWallpapers[0];

    return {
      ...defaultSettings,
      ...parsed,
      wallpapers: combinedWallpapers,
      activeWallpaper,
    };
  });

  const [loading, setLoading] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState<SubTab>('account');

  useEffect(() => {
    const { activeWallpaper, ...rest } = settings;
    localStorage.setItem('app-settings', JSON.stringify(rest));
  }, [settings]);

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const setBlur = (value: number) => {
    setSettings((prev) => ({
      ...prev,
      activeWallpaper: {
        ...prev.activeWallpaper,
        blur: value,
      },
    }));
  };

  const setActiveWallpaper = (wallpaper: WallpaperSetting) => {
    setSettings((prev) => {
      let wallpaperData: WallpaperSetting;

      if (!('url' in wallpaper) || !wallpaper.url) {
        const defaultWall = defaultWallpapers.find(
          (w) => w.id === wallpaper.id,
        );
        if (!defaultWall) return prev;
        wallpaperData = { ...defaultWall };
      } else {
        wallpaperData = { ...wallpaper };
      }

      if (prev.activeWallpaper?.id === wallpaperData.id) {
        return prev;
      }

      websocketManager.sendMessage({
        type: 'set_active_wallpaper',
        data: { id: wallpaperData.id },
      });

      const wallpapers = prev.wallpapers?.some((w) => w.id === wallpaperData.id)
        ? prev.wallpapers
        : [...(prev.wallpapers || []), wallpaperData];

      return {
        ...prev,
        wallpapers,
        activeWallpaper: wallpaperData,
      };
    });
  };

  const removeWallpaper = (id: string) => {
    websocketManager.sendMessage({
      type: 'delete_user_wallpaper',
      data: { id },
    });
  };

  const fetchWallpapers = async () => {
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
      setSettings((prev) => ({ ...prev, wallpapers: defaultWallpapers }));
    } finally {
      setLoading(false);
    }
  };

  const addUserWallpaper = async (wallpaper: WallpaperSetting) => {
    try {
      const formData = new FormData();
      Object.entries(wallpaper).forEach(([key, value]) => {
        if (!value) return;
        // @ts-ignore
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      await apiUpload('/api/wallpapers/', formData);
    } catch (error) {
      console.error('addUserWallpaper error:', error);
    }
  };

  const handleWSMessage = useCallback((data: any) => {
    if (!data.type) return;

    if (data.type === 'active_wallpaper_updated') {
      const wallpaperData: WallpaperSetting = {
        ...data.data,
        url: data.data.url,
      };
      setActiveWallpaper(wallpaperData);
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
      console.log(data);
      const wallpaperData: WallpaperSetting = {
        id: data.data.id,
        type: data.data.type,
        url: data.data.url,
        blur: 0,
      };
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
        setBlur,
        //@ts-ignore
        removeWallpaper,
        fetchWallpapers,
        loading,
        activeProfileTab,
        setActiveProfileTab,
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
