import { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import styles from './Profile.module.scss';
import { useSettings } from '@/contexts/settings/Settings';
import Toggle from '@/components/ui/toggle/Toggle';
import Slider from '../ui/slider/Slider';
import type { WallpaperSetting } from '@/contexts/settings/types';
import { Icon } from '../Icons/AutoIcons';

export default function ProfileAppearance() {
  const { t } = useTranslation();
  const {
    settings,
    setSetting,
    setActiveWallpaper,
    addUserWallpaper,
    //@ts-ignore
    removeWallpaper,
    //@ts-ignore
    fetchWallpapers,
    //@ts-ignore
    loading,
  } = useSettings();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const is24Hour = settings.timeFormat === '24h';

  const [blur, setBlur] = useState<number>(settings.activeWallpaper?.blur || 0);

  useEffect(() => {
    fetchWallpapers();
  }, []);

  useEffect(() => {
    setBlur(settings.activeWallpaper?.blur || 0);
  }, [settings.activeWallpaper]);

  const handleSelectWallpaper = (wall: WallpaperSetting) => {
    setActiveWallpaper({
      id: wall.id,
      //@ts-ignore
      url: wall.file_url,
      type: 'photo',
      blur: blur ?? 0,
    });
  };

  const handleBlurChange = (value: number) => {
    setBlur(value);

    if (!settings.activeWallpaper) return;

    setActiveWallpaper({
      ...settings.activeWallpaper,
      blur: value,
    });
  };

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.appearance')}</h3>

      <div className={styles.optionRow}>
        <div>{t('language.time.timeFormat')}</div>
        <Toggle
          checked={is24Hour}
          onChange={(checked) =>
            setSetting('timeFormat', checked ? '24h' : '12h')
          }
        />
      </div>
      {windowWidth <= 768 && (
        <div className={styles.optionRow}>
          <div>Use Wallpaper Throughout The App</div>
          <Toggle
            checked={settings.useBackgroundThroughoutTheApp}
            onChange={setSetting.bind(null, 'useBackgroundThroughoutTheApp')}
          />
        </div>
      )}

      <div className={styles.optionRow}>
        {loading ? (
          <div>Loading wallpapers...</div>
        ) : (
          <div className={styles.wallpaperList}>
            {settings.wallpapers.map((wall) => (
              <div
                key={wall.id}
                className={`${styles.wallpaperItem}  ${
                  settings.activeWallpaper?.id === wall.id
                    ? styles.selected
                    : ''
                }`}
              >
                <img
                  //@ts-ignore
                  src={wall.file_url}
                  alt={`Wallpaper ${wall.id}`}
                  className={`${styles.wallpaperThumbnail}`}
                  onClick={() => handleSelectWallpaper(wall)}
                />
                <div
                  className={styles.removeWallpaper}
                  onClick={removeWallpaper.bind(null, wall.id)}
                >
                  <Icon name='Cross' />
                </div>
              </div>
            ))}

            {settings.activeWallpaper && (
              <Slider
                label='Blur'
                value={settings.activeWallpaper.blur || 0}
                min={0}
                max={50}
                step={1}
                onChange={handleBlurChange}
              />
            )}
            <input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                addUserWallpaper({
                  //@ts-ignore
                  file,
                  blur: 0,
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
