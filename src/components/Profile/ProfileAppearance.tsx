import { act, useEffect, useState } from 'react';
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
    setBlur,
    addUserWallpaper,
    removeWallpaper,
    fetchWallpapers,
    loading,
    autoplayVideos,
    setAutoplayVideos,
  } = useSettings();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const is24Hour = settings.timeFormat === '24h';

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const handleSelectWallpaper = (wall: WallpaperSetting) => {
    setActiveWallpaper({
      id: wall.id,
      url: wall.url,
      type: wall.type,
      blur: settings.activeWallpaper?.blur || 0,
    });
  };

  const handleBlurChange = (value: number) => {
    if (!settings.activeWallpaper) return;
    setBlur(value);
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
      <div className={styles.optionRow}>
        <div>Autoplay Videos</div>
        <Toggle
          checked={autoplayVideos}
          onChange={(checked) => setAutoplayVideos(checked)}
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
          <div className={styles.wallpapersContainer}>
            {settings.activeWallpaper && (
              <div className={styles.blurSlider}>
                <Slider
                  label='Blur'
                  value={settings.activeWallpaper.blur || 0}
                  min={0}
                  max={50}
                  step={1}
                  onChange={handleBlurChange}
                />
              </div>
            )}
            <div className={styles.wallpaperList}>
              {[...settings.wallpapers].reverse().map((wall) => (
                <div
                  key={wall.id}
                  className={`${styles.wallpaperItem}  ${
                    settings.activeWallpaper?.id === wall.id
                      ? styles.selected
                      : ''
                  }`}
                >
                  {wall.type === 'video' ? (
                    <video
                      src={wall.url}
                      className={`${styles.wallpaperThumbnail}`}
                      onClick={() => handleSelectWallpaper(wall)}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={wall.url}
                      alt={`Wallpaper ${wall.id}`}
                      className={`${styles.wallpaperThumbnail}`}
                      onClick={() => handleSelectWallpaper(wall)}
                    />
                  )}
                  <div
                    className={styles.removeWallpaper}
                    onClick={removeWallpaper.bind(null, wall.id)}
                  >
                    <Icon name='Cross' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
