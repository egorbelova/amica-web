import { apiFetch } from '@/utils/apiFetch';
import { useEffect, useState } from 'react';

export default function VideoLayout({ full }) {
  const [fullUrl, setFullUrl] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(full, {
      signal: controller.signal,
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        console.log('Loaded full video', url);
        setFullUrl(url);
      })
      .catch((err) => console.warn('Failed to load protected video', err));

    return () => controller.abort();
  }, [full]);

  return (
    <video
      src={fullUrl}
      muted
      autoPlay
      loop
      playsInline
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover',
      }}
      //   className={styles.media}
    />
  );
}
