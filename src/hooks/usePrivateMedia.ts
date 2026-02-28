import { startTransition, useEffect, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';

const blobCache = new Map<string, { objectUrl: string; refCount: number }>();

export function usePrivateMedia(url: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!url) return;

    const cached = blobCache.get(url);
    if (cached) {
      cached.refCount++;
      startTransition(() => {
        setObjectUrl(cached.objectUrl);
        setLoading(false);
        setError(null);
      });
      return () => {
        cached.refCount--;
      };
    }

    const controller = new AbortController();
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    let localUrl: string | null = null;

    apiFetch(url, { signal: controller.signal })
      .then((res) => res.blob())
      .then((blob) => {
        localUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(localUrl);
          return;
        }
        blobCache.set(url, { objectUrl: localUrl, refCount: 1 });
        setObjectUrl(localUrl);
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      const entry = blobCache.get(url);
      if (entry) {
        entry.refCount--;
      } else if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [url]);

  return { objectUrl, loading, error };
}
