import { startTransition, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';

const blobCache = new Map<string, { objectUrl: string; refCount: number }>();
const pendingFetches = new Map<string, Promise<{ objectUrl: string }>>();

function fetchPrivateMedia(url: string): Promise<{ objectUrl: string }> {
  const existing = pendingFetches.get(url);
  if (existing) return existing;

  const promise = apiFetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      blobCache.set(url, { objectUrl, refCount: 0 });
      pendingFetches.delete(url);
      return { objectUrl };
    })
    .catch((err) => {
      pendingFetches.delete(url);
      throw err;
    });

  pendingFetches.set(url, promise);
  return promise;
}

export function usePrivateMedia(url: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const didIncrementRef = useRef(false);

  useEffect(() => {
    if (!url) return;

    const cached = blobCache.get(url);
    if (cached) {
      cached.refCount++;
      didIncrementRef.current = true;
      startTransition(() => {
        setObjectUrl(cached.objectUrl);
        setLoading(false);
        setError(null);
      });
      return () => {
        cached.refCount--;
        didIncrementRef.current = false;
      };
    }

    let cancelled = false;
    didIncrementRef.current = false;

    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    fetchPrivateMedia(url)
      .then(({ objectUrl: resultUrl }) => {
        if (cancelled) return;
        didIncrementRef.current = true;
        const entry = blobCache.get(url);
        if (entry) entry.refCount++;
        startTransition(() => {
          setObjectUrl(resultUrl);
          setLoading(false);
        });
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !cancelled) {
          setError(err);
        }
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (didIncrementRef.current) {
        const entry = blobCache.get(url);
        if (entry) {
          entry.refCount--;
          if (entry.refCount <= 0) {
            URL.revokeObjectURL(entry.objectUrl);
            blobCache.delete(url);
          }
        }
      }
    };
  }, [url]);

  return { objectUrl, loading, error };
}
