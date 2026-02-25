import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Settings,
  WallpaperSetting,
  SubTab,
  WallpaperType,
} from './types';
import {
  websocketManager,
  type WebSocketMessage,
} from '@/utils/websocket-manager';
import { apiUpload, apiFetch } from '@/utils/apiFetch';
import { SettingsContext } from './context';

const defaultWallpapers: WallpaperSetting[] = [
  {
    id: 'default-0',
    url: '../DefaultWallpapers/abdelhamid-azoui-Zhl3nrozkG0-unsplash.jpg.webp',
    type: 'photo',
  },
  {
    id: 'default-1',
    url: '../DefaultWallpapers/syuhei-inoue-fvgv3i4_uvI-unsplash.jpg.webp',
    type: 'photo',
  },
  {
    id: 'default-2',
    url: '../DefaultWallpapers/dave-hoefler-PEkfSAxeplg-unsplash.jpg.webp',
    type: 'photo',
  },
  {
    id: 'default-3',
    url: '../DefaultWallpapers/video/blue-sky-seen-directly-with-some-clouds_480p_infinity.webm',
    type: 'video',
  },
];

const defaultSettings: Settings = {
  language: navigator.language || 'en-US',
  theme: 'system',
  timeFormat: 'auto',
  wallpapers: defaultWallpapers,
  activeWallpaper: defaultWallpapers[0],
  activeWallpaperEditMode: 'natural',
  useBackgroundThroughoutTheApp: false,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const saved = localStorage.getItem('app-settings');
  let parsed: Partial<
    Settings & {
      autoplayVideos?: boolean;
      settingsFullWindow?: boolean;
      color?: string;
    }
  > = {};
  if (saved) {
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
  }

  const [isResizingPermitted, setIsResizingPermitted] = useState(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleKeyboardHeight = () => {
      const { height, offsetTop } = window.visualViewport;

      const keyboard = window.innerHeight - height - offsetTop;

      const safeHeight = keyboard > 0 ? keyboard : 0;

      setKeyboardHeight(safeHeight);

      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${safeHeight}px`,
      );
    };

    window.visualViewport.addEventListener('resize', handleKeyboardHeight);

    return () =>
      window.visualViewport.removeEventListener('resize', handleKeyboardHeight);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsResizingPermitted(true);
      } else {
        setIsResizingPermitted(false);
        setSettingsFullWindow(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [settingsFullWindow, setSettingsFullWindow] = useState<boolean>(
    parsed.settingsFullWindow ?? false,
  );

  const [autoplayVideos, setAutoplayVideos] = useState<boolean>(
    parsed.autoplayVideos ?? false,
  );

  const [settings, setSettings] = useState<Settings>(() => {
    const combinedWallpapers = [
      ...defaultWallpapers.filter(
        (df) =>
          !parsed.wallpapers?.some((w: WallpaperSetting) => w.id === df.id),
      ),
      ...(parsed.wallpapers || []),
    ];

    const activeWallpaper =
      parsed.activeWallpaper === null
        ? null
        : parsed.activeWallpaper && typeof parsed.activeWallpaper === 'object'
          ? (parsed.activeWallpaper as WallpaperSetting)
          : defaultWallpapers[0];

    return {
      ...defaultSettings,
      ...parsed,
      wallpapers: combinedWallpapers,
      activeWallpaper,
      activeWallpaperEditMode:
        parsed.activeWallpaperEditMode ??
        defaultSettings.activeWallpaperEditMode,
    };
  });

  const [color, setColor] = useState<string>(parsed.color ?? '#2c77d1');

  useEffect(() => {
    document.documentElement.style.setProperty('--mainColor', color);
  }, [color]);

  const [loading, setLoading] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState<SubTab>(null);
  // const { push } = usePageStack();

  useEffect(() => {
    const { ...rest } = settings;
    const toSave = {
      ...rest,
      autoplayVideos,
      color,
    };
    localStorage.setItem('app-settings', JSON.stringify(toSave));
  }, [settings, autoplayVideos, color]);

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings],
  );

  const setBlur = useCallback(
    (value: number) => {
      setSettings((prev: Settings) => {
        if (prev.activeWallpaper == null) return prev;
        return {
          ...prev,
          activeWallpaper: {
            ...prev.activeWallpaper,
            blur: value,
          },
        } as Settings;
      });
    },
    [setSettings],
  );

  const setActiveWallpaper = useCallback(
    (wallpaper: WallpaperSetting | null) => {
      setSettings((prev) => {
        if (wallpaper === null) {
          if (prev.activeWallpaper === null) return prev;
          websocketManager.sendMessage({
            type: 'set_active_wallpaper',
            data: { id: null },
          });
          return { ...prev, activeWallpaper: null };
        }

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

        const wallpapers = prev.wallpapers?.some(
          (w) => w.id === wallpaperData.id,
        )
          ? prev.wallpapers
          : [...(prev.wallpapers || []), wallpaperData];

        return {
          ...prev,
          wallpapers,
          activeWallpaper: wallpaperData,
        };
      });
    },
    [setSettings],
  );

  const removeWallpaper = useCallback((id: string) => {
    websocketManager.sendMessage({
      type: 'delete_user_wallpaper',
      data: { id },
    });
  }, []);

  const fetchWallpapers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/wallpapers/');
      const data = await res.json();
      const apiWallpapers = Array.isArray(data) ? data : data.wallpapers || [];
      const combinedWallpapers = [
        ...defaultWallpapers.filter(
          (df) => !apiWallpapers.some((w: WallpaperSetting) => w.id === df.id),
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
  }, [setSettings]);

  const addUserWallpaper = useCallback(async (wallpaper: File) => {
    try {
      const formData = new FormData();
      formData.append('file', wallpaper);

      await apiUpload('/api/wallpapers/', formData);
    } catch (error) {
      console.error('addUserWallpaper error:', error);
    }
  }, []);

  const handleWSMessage = useCallback(
    (data: WebSocketMessage) => {
      if (!data.type) return;

      if (data.type === 'active_wallpaper_updated') {
        if (data.data == null || data.data.id == null) {
          setActiveWallpaper(null);
        } else {
          const wallpaperData: WallpaperSetting = {
            id: data.data.id as string | number,
            type: data.data?.type as WallpaperType | undefined,
            url: data.data?.url as string | null,
          };
          setActiveWallpaper(wallpaperData);
        }
      }

      if (data.type === 'user_wallpaper_deleted') {
        const wallpaperId = data?.id;
        setSettings((prev) => ({
          ...prev,
          wallpapers: (prev.wallpapers || []).filter(
            (w) => w.id !== wallpaperId,
          ),
          activeWallpaper:
            prev.activeWallpaper?.id === wallpaperId
              ? null
              : prev.activeWallpaper,
        }));
      }

      if (data.type === 'user_wallpaper_added') {
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
    },
    [setActiveWallpaper, setSettings],
  );

  useEffect(() => {
    websocketManager.on('message', handleWSMessage);
    if (!websocketManager.isConnected()) {
      websocketManager.connect();
    }
    return () => websocketManager.off('message', handleWSMessage);
  }, [handleWSMessage]);

  const value = useMemo(
    () => ({
      settings,
      setSetting,
      setActiveWallpaper,
      addUserWallpaper,
      setBlur,
      removeWallpaper,
      fetchWallpapers,
      loading,
      activeProfileTab,
      setActiveProfileTab,
      autoplayVideos,
      setAutoplayVideos,
      settingsFullWindow,
      setSettingsFullWindow,
      isResizingPermitted,
      setIsResizingPermitted,
      setColor,
      color,
      keyboardHeight,
    }),
    [
      settings,
      loading,
      activeProfileTab,
      autoplayVideos,
      settingsFullWindow,
      isResizingPermitted,
      color,
      addUserWallpaper,
      fetchWallpapers,
      removeWallpaper,
      setActiveWallpaper,
      setBlur,
      setSetting,
      setColor,
      keyboardHeight,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
