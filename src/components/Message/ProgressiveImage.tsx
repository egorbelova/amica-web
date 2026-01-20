import { apiFetch } from '@/utils/apiFetch';
import { useEffect, useRef, useState } from 'react';
import styles from './SmartMediaLayout.module.scss';
import { Icon } from '../Icons/AutoIcons';

export default function ProgressiveImage({
  small,
  full,
  onClick = () => {},
  dominant_color,
}) {
  const imgRef = useRef(null);
  const [smallUrl, setSmallUrl] = useState(small);
  const [fullUrl, setFullUrl] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(full, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setFullUrl(url);
      })
      .catch((err) => {
        console.warn('Failed to load protected image', err);
        setIsValid(false);
      });

    return () => controller.abort();
  }, [full]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !fullUrl) return;

    img.onload = () => img.classList.add('loaded');
    img.src = fullUrl;
  }, [fullUrl]);

  return (
    <div
      style={{
        background: dominant_color,
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {isValid && (
        <img
          ref={imgRef}
          src={smallUrl}
          className='mes_img progressive-image'
          onClick={onClick}
          alt='Attachment'
          decoding='async'
        />
      )}
      {(!isValid || !fullUrl) && (
        <div className={styles.loading}>
          <div className={styles['loading__background']} />
          <Icon name='Spinner' className={styles.spinner} />
          {/* <Icon name='Cross' className={styles.cross} /> */}
        </div>
      )}
    </div>
  );
}
