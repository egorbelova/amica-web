import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';

export function usePrivateMedia(url) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    let localUrl: string | null = null;

    apiFetch(url, { signal: controller.signal })
      .then((res) => res.blob())
      .then((blob) => {
        localUrl = URL.createObjectURL(blob);
        setObjectUrl(localUrl);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [url]);

  return { objectUrl, loading, error };
}
