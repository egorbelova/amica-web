import { useEffect, useRef, useState } from 'react';

interface JWTVideoProps {
  url: string;
  token: string;
  className?: string;
  has_audio?: boolean | null;
  muted?: boolean;
}

export function JWTVideo({
  url,
  token,
  className,
  has_audio,
  muted = false,
}: JWTVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let mediaSource: MediaSource | null = null;
    let sourceBuffer: SourceBuffer | null = null;
    let objectUrl: string | null = null;

    const chunkSize = 1024 * 512;
    let position = 0;
    let totalLength = -1;
    let fetchedLength = 0;
    let ended = false;
    let endOfStreamCalled = false;
    const appendQueue: ArrayBuffer[] = [];

    let mimeType = 'video/mp4; codecs="avc1.42E01E"';
    let actualHasAudio: boolean;

    if (has_audio == null) {
      actualHasAudio = true;
    } else {
      actualHasAudio = has_audio;
      mimeType = actualHasAudio
        ? 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        : 'video/mp4; codecs="avc1.42E01E"';
    }

    const fetchChunk = async (): Promise<ArrayBuffer | null> => {
      if (totalLength > 0 && fetchedLength >= totalLength) {
        ended = true;
        return null;
      }

      const rangeEnd = position + chunkSize - 1;
      const range =
        totalLength > 0
          ? `bytes=${position}-${Math.min(rangeEnd, totalLength - 1)}`
          : `bytes=${position}-${position + chunkSize - 1}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Range: range,
        },
      });

      if (!res.ok) {
        if (res.status === 416) {
          ended = true;
          return null;
        }
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength === 0) {
        ended = true;
        return null;
      }

      position += buf.byteLength;
      fetchedLength += buf.byteLength;

      if (totalLength > 0 && fetchedLength >= totalLength) {
        ended = true;
      }

      const contentRange = res.headers.get('Content-Range');
      if (contentRange && totalLength < 0) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) totalLength = parseInt(match[1], 10);
      }

      return buf;
    };

    const appendNext = () => {
      if (destroyed || !sourceBuffer || sourceBuffer.updating) return;

      if (appendQueue.length > 0) {
        try {
          sourceBuffer.appendBuffer(appendQueue.shift()!);
        } catch (err) {
          console.error('appendBuffer error:', err);
          setError('Failed to append buffer');
        }
        return;
      }

      if (ended && mediaSource?.readyState === 'open' && !endOfStreamCalled) {
        setTimeout(() => {
          if (
            destroyed ||
            !mediaSource ||
            mediaSource.readyState !== 'open' ||
            sourceBuffer.updating ||
            appendQueue.length > 0
          )
            return;

          const buffered = sourceBuffer.buffered;
          if (buffered.length === 0) return;

          const lastEnd = buffered.end(buffered.length - 1);

          if (lastEnd > 8) {
            try {
              mediaSource.endOfStream();
              endOfStreamCalled = true;
            } catch (err) {
              console.warn('endOfStream failed:', err);
            }
          } else {
            setTimeout(appendNext, 300);
          }
        }, 200);
      }
    };

    const loadMore = async () => {
      if (destroyed || ended) return;

      try {
        const chunk = await fetchChunk();
        if (chunk) {
          appendQueue.push(chunk);
          appendNext();
        }

        if (!ended) {
          setTimeout(loadMore, 40);
        }
      } catch (err) {
        console.error('Chunk fetch error:', err);
        setError('Network or authorization error');
      }
    };

    const init = async () => {
      try {
        const headRes = await fetch(url, {
          method: 'HEAD',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (headRes.ok) {
          const len = headRes.headers.get('Content-Length');
          if (len) totalLength = parseInt(len, 10);
        }
      } catch {}

      mediaSource = new MediaSource();
      objectUrl = URL.createObjectURL(mediaSource);
      video.src = objectUrl;

      const onSourceOpen = () => {
        if (destroyed || !mediaSource) return;

        try {
          if (!MediaSource.isTypeSupported(mimeType)) {
            setError('Unsupported MIME type');
            return;
          }

          sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBuffer.mode = 'segments';

          const setDurationOnce = () => {
            if (sourceBuffer.buffered.length > 0 && mediaSource.duration < 1) {
              const est = sourceBuffer.buffered.end(0) + 4;
              mediaSource.duration = est;
            }
          };

          sourceBuffer.addEventListener('updateend', () => {
            setDurationOnce();
            appendNext();

            const b = sourceBuffer.buffered;
          });

          sourceBuffer.addEventListener('error', (e) => {
            console.error('SourceBuffer error:', e);
            setError('Buffer error');
          });

          loadMore();
        } catch (err) {
          console.error('addSourceBuffer failed:', err);
          setError('Cannot create source buffer');
        }
      };

      mediaSource.addEventListener('sourceopen', onSourceOpen);
    };

    init().catch((err) => {
      console.error('Initialization failed:', err);
      setError('Failed to initialize player');
    });

    video.addEventListener('waiting', () =>
      console.log('→ waiting at', video.currentTime.toFixed(2)),
    );
    video.addEventListener('stalled', () =>
      console.log('→ stalled at', video.currentTime.toFixed(2)),
    );
    video.addEventListener('error', (e) => console.error('Video error:', e));

    return () => {
      destroyed = true;
      video.src = '';
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (mediaSource?.readyState === 'open') {
        try {
          mediaSource.endOfStream();
        } catch {}
      }
    };
  }, [url, token]);

  if (error) {
    return (
      <div style={{ color: 'red', padding: '1rem', textAlign: 'center' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      //   controls
      autoPlay
      muted={muted}
      loop={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        background: '#000',
      }}
      className={className}
    />
  );
}
