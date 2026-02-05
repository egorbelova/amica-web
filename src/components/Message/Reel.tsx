import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Reel.module.scss';
import { JWTVideo } from './JWTVideo';
import { apiFetch } from '@/utils/apiFetch';
import AudioLayout from './AudioLayout';
import type { File } from '@/types';

export interface MediaItem {
  id: string;
  value?: string;
  files: File[];
}

interface ReelProps {
  items: MediaItem[];
  onClose: () => void;
}

const DotsIndicator: React.FC<{
  count: number;
  active: number;
  onSelect: (index: number) => void;
  maxVisible?: number;
}> = ({ count, active, onSelect, maxVisible = 5 }) => {
  if (count <= 1) return null;

  const size = 8;
  const gap = 10;

  const half = Math.floor(maxVisible / 2);

  let start = Math.max(0, active - half);
  let end = start + maxVisible;

  if (end > count) {
    end = count;
    start = Math.max(0, end - maxVisible);
  }

  const visibleIndexes = Array.from(
    { length: end - start },
    (_, i) => start + i,
  );

  const width =
    visibleIndexes.length * size + (visibleIndexes.length - 1) * gap;

  return (
    <svg width={width} height={size} className={styles.dots}>
      {visibleIndexes.map((index, i) => {
        const isActive = index === active;

        return (
          <circle
            key={index}
            cx={i * (size + gap) + size / 2}
            cy={size / 2}
            r={isActive ? size / 2 : size / 3}
            fill={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
            style={{
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(index);
            }}
          />
        );
      })}
    </svg>
  );
};

const Reel: React.FC<ReelProps> = ({ items, onClose }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const currentItem = items[currentItemIndex];
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const wheelLockRef = React.useRef(false);

  const lastTap = useRef<number>(0);
  const handleClick = () => {
    const now = Date.now();
    const DOUBLE_CLICK_DELAY = 250;

    if (now - lastTap.current < DOUBLE_CLICK_DELAY) {
      onClose();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0) {
          // setPlaying((prev) => !prev);
          lastTap.current = 0;
        }
      }, DOUBLE_CLICK_DELAY);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (wheelLockRef.current) return;

    const { deltaX, deltaY } = e;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const THRESHOLD = 10;

    if (absX < THRESHOLD && absY < THRESHOLD) return;

    wheelLockRef.current = true;

    if (absX > absY) {
      if (deltaX > 0) {
        nextFile(e as any);
      } else {
        prevFile(e as any);
      }
    } else {
      if (deltaY > 0) {
        nextItem(e as any);
      } else {
        prevItem(e as any);
      }
    }

    setTimeout(() => {
      wheelLockRef.current = false;
    }, 500);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MIN_SWIPE_DISTANCE = 50;

  const onTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    const point = 'touches' in e ? e.touches[0] : (e as React.PointerEvent);

    setTouchEnd(null);
    setTouchStart({ x: point.clientX, y: point.clientY });
  };

  const onTouchMove = (e: React.TouchEvent | React.PointerEvent) => {
    const point = 'touches' in e ? e.touches[0] : (e as React.PointerEvent);

    setTouchEnd({ x: point.clientX, y: point.clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > MIN_SWIPE_DISTANCE) {
      if (deltaX > 0) {
        nextFile(new MouseEvent('click') as any);
      } else {
        prevFile(new MouseEvent('click') as any);
      }
    }

    if (absY > absX && absY > MIN_SWIPE_DISTANCE) {
      if (deltaY > 0) {
        nextItem(new MouseEvent('click') as any);
      } else {
        prevItem(new MouseEvent('click') as any);
      }
    }
  };

  const [blobUrlsMap, setBlobUrlsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let isCancelled = false;

    const fetchBlobs = async (item: MediaItem) => {
      const urls: string[] = [];
      for (const file of item.files) {
        try {
          const res = await apiFetch(file.thumbnail_medium_url);
          const blob = await res.blob();
          urls.push(URL.createObjectURL(blob));
        } catch (err) {
          console.error(err);
        }
      }
      if (!isCancelled) {
        setBlobUrlsMap((prev) => ({ ...prev, [item.id]: urls }));
      }
    };

    fetchBlobs(currentItem);

    return () => {
      isCancelled = true;
      Object.values(blobUrlsMap)
        .flat()
        .forEach((url) => URL.revokeObjectURL(url));
    };
  }, [currentItem]);

  const prevFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFileIndex((prev) =>
      prev === 0 ? currentItem.files.length - 1 : prev - 1,
    );
  };

  const nextFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFileIndex((prev) =>
      prev === currentItem.files.length - 1 ? 0 : prev + 1,
    );
  };

  const prevItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentItemIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setCurrentFileIndex(0);
  };

  const nextItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentItemIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    setCurrentFileIndex(0);
  };

  const renderMedia = (file: File, blobUrl: string) => {
    if (!blobUrl) return null;
    if (file.category === 'image') {
      return <img key={file.id} src={blobUrl} className={styles.media} />;
    }
    if (file.category === 'video') {
      return (
        <JWTVideo
          key={file.id}
          url={file.file_url}
          className={styles.media}
          muted={false}
        />
      );
    }

    if (file.category === 'audio') {
      return (
        <div>
          {/* <div className={styles.filename}>{file.original_name}</div> */}
          <AudioLayout
            key={file.id}
            full={file.file_url}
            waveform={file.waveform}
            duration={file.duration}
            id={file.id}
            cover_url={file.cover_url}
          />
        </div>
      );
    }
    return null;
  };

  const content = (
    <div
      className={styles['reel-wrapper']}
      onClick={(e) => {
        handleClick();
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={onTouchStart}
      onPointerMove={onTouchMove}
      onPointerUp={onTouchEnd}
      onPointerCancel={onTouchEnd}
      onWheel={onWheel}
    >
      <div
        className={styles['items-container']}
        style={{
          height: `${items.length * 100}%`,
          transform: `translateY(-${(100 / items.length) * currentItemIndex}%)`,
          transition: 'transform 0.5s ease',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={styles.reel}
            style={{
              height: `${100 / items.length}%`,
            }}
          >
            <div className={styles['files-wrapper']}>
              <div
                className={styles['files-container']}
                style={{
                  width: `${item.files.length * 100}%`,
                  transform:
                    idx === currentItemIndex
                      ? `translateX(-${(100 / item.files.length) * currentFileIndex}%)`
                      : 'translateX(0%)',
                  transition: 'transform 0.5s ease',
                }}
              >
                {item.files.map((file, i) => (
                  <div
                    key={file.id}
                    className={styles.file}
                    style={{
                      width: `${100 / item.files.length}%`,
                    }}
                  >
                    {idx === currentItemIndex
                      ? renderMedia(file, blobUrlsMap[item.id]?.[i])
                      : null}
                  </div>
                ))}
              </div>
              <div className={styles['value']}>{item.value}</div>
            </div>

            {idx === currentItemIndex && item.files.length > 1 && (
              <>
                <button
                  className={`${styles.left} ${styles['reel-control']}`}
                  onClick={prevFile}
                >
                  ←
                </button>
                <button
                  className={`${styles.right} ${styles['reel-control']}`}
                  onClick={nextFile}
                >
                  →
                </button>
              </>
            )}
            {idx === currentItemIndex && item.files.length > 1 && (
              <DotsIndicator
                count={item.files.length}
                active={currentFileIndex}
                onSelect={(i) => setCurrentFileIndex(i)}
              />
            )}
          </div>
        ))}
      </div>

      {windowWidth >= 576 && (
        <div className={styles['controls']}>
          <button className={styles['control']} onClick={prevItem}>
            ↑
          </button>
          <button className={styles['control']} onClick={nextItem}>
            ↓
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default Reel;
