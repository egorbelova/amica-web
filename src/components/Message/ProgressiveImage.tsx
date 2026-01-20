import { useEffect, useState } from 'react';
import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import styles from './SmartMediaLayout.module.scss';
import { Icon } from '../Icons/AutoIcons';

interface ProgressiveImageProps {
  small: string;
  full: string;
  dominant_color?: string;
  onClick?: () => void;
}

export default function ProgressiveImage({
  small,
  full,
  onClick = () => {},
  dominant_color,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  const {
    objectUrl: smallUrl,
    loading: smallLoading,
    error: smallError,
  } = usePrivateMedia(small);
  const {
    objectUrl: fullUrl,
    loading: fullLoading,
    error: fullError,
  } = usePrivateMedia(full);

  const isValid = !smallError && !fullError;

  useEffect(() => {
    if (!fullUrl || !isValid) return;

    const img = new Image();
    img.src = fullUrl;
    img.onload = () => setLoaded(true);
    // убираем img.onerror для object URL
  }, [fullUrl, isValid]);

  return (
    <div style={{ background: dominant_color }} className={styles.wrapper}>
      {/* маленькое изображение как placeholder */}
      {isValid && smallUrl && !loaded && (
        <img
          src={smallUrl}
          className='mes_img progressive-image placeholder blurred'
          alt='Attachment placeholder'
          decoding='async'
        />
      )}

      {/* большое изображение */}
      {isValid && fullUrl && (
        <img
          src={fullUrl}
          className={`mes_img progressive-image ${loaded ? 'loaded' : ''}`}
          onClick={onClick}
          alt='Attachment'
          decoding='async'
        />
      )}

      {(smallLoading || fullLoading || !loaded) && (
        <div className={styles.loading}>
          <div className={styles['loading__background']} />
          <Icon name='Spinner' className={styles.spinner} />
        </div>
      )}
    </div>
  );
}
