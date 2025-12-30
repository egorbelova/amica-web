import { apiFetch } from '@/utils/apiFetch';
import { useEffect, useRef, useState } from 'react';

export default function ProgressiveImage({
  small,
  full,
  onClick = () => {},
  dominant_color,
}) {
  const imgRef = useRef(null);
  const [smallUrl, setSmallUrl] = useState(small);
  const [fullUrl, setFullUrl] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(full, {
      signal: controller.signal,
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        console.log('Loaded full image', url);
        setFullUrl(url);
      })
      .catch((err) => console.warn('Failed to load protected image', err));

    return () => controller.abort();
  }, [full]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !fullUrl) return;

    img.onload = () => img.classList.add('loaded');
    img.src = fullUrl;
  }, [fullUrl]);

  return (
    <div style={{ background: dominant_color, width: '100%', height: '100%' }}>
      <img
        ref={imgRef}
        src={smallUrl}
        className='mes_img progressive-image'
        onClick={onClick}
        alt='Attachment'
        decoding='async'
      />
    </div>
  );
}
