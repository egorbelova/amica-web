import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from './SmartMediaLayout.module.scss';
import { generateLayout } from './SmartMediaLayout';
import ProgressiveImage from './ProgressiveImage';
import VideoLayout from './VideoLayout';
import AudioLayout from './AudioLayout';
import { useChat } from '@/contexts/ChatContextCore';
import Reel from './Reel';
import type { File } from '@/types';

interface Props {
  files: File[];
  onClick?: (file: File) => void;
}

const SmartMediaLayout: React.FC<Props> = ({ files }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const mediaFiles = useMemo(
    () => files.filter((f) => f.category !== 'audio'),
    [files],
  );

  const audioFiles = useMemo(
    () => files.filter((f) => f.category === 'audio'),
    [files],
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [reelVisible, setReelVisible] = useState(false);
  const { messages } = useChat();

  const lastTap = useRef<number>(0);
  const handleClick = () => {
    const now = Date.now();
    const DOUBLE_CLICK_DELAY = 250;

    if (now - lastTap.current < DOUBLE_CLICK_DELAY) {
      setReelVisible((prev) => !prev);
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

  const items = messages.filter(
    (message) => Array.isArray(message.files) && message.files.length > 0,
  );

  const MAX_W = Math.min(windowWidth - 60, 432);
  const MAX_H = 560;

  const layout = useMemo(
    () => generateLayout(mediaFiles, MAX_W),
    [mediaFiles, MAX_W],
  );

  if (!files.length) return null;

  const containerWidth = Math.min(
    layout.reduce((max, item) => Math.max(max, item.left + item.width), 0),
    MAX_W,
  );

  const containerHeight = Math.min(
    layout.reduce((max, item) => Math.max(max, item.top + item.height), 0),
    MAX_H,
  );

  return (
    <>
      <div className={styles['container-media']} onClick={handleClick}>
        {reelVisible && (
          <Reel items={items} onClose={() => setReelVisible(false)} />
        )}
        {layout.length === 1 && (
          <div className={styles.wrapperGlow}>
            {/* {layout[0].file.category === 'video' && (
              // <video
              //   src={layout[0].file.file_url + '#t=0.001'}
              //   muted
              //   loop
              //   playsInline
              //   style={{
              //     height: '100%',
              //     width: '100%',
              //     objectFit: 'cover',
              //   }}
              // />
              <JWTVideo
                url={layout[0].file.file_url}
                muted={true}
                autoPlay={false}
                playing={false}
              />
            )} */}
            {layout[0].file.category === 'image' && (
              <ProgressiveImage
                small={layout[0].file.thumbnail_small_url || null}
                full={layout[0].file.thumbnail_small_url || ''}
                dominant_color={layout[0].file.dominant_color}
              />
            )}
          </div>
        )}

        {!!mediaFiles.length && (
          <div
            className={styles.wrapper}
            style={{ width: containerWidth, height: containerHeight }}
          >
            {layout.map((item) => (
              <div
                key={item.file.id}
                data-file-id={item.file.id}
                className={styles.item}
                style={{
                  top: item.top,
                  left: item.left,
                  width: item.width,
                  height: item.height,
                }}
              >
                {item.file.category === 'video' && (
                  <VideoLayout
                    full={item.file.file_url}
                    has_audio={item.file.has_audio || false}
                  />
                )}

                {item.file.category === 'image' && (
                  <ProgressiveImage
                    small={item.file.thumbnail_small_url || null}
                    full={item.file.thumbnail_medium_url || ''}
                    dominant_color={item.file.dominant_color}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!!audioFiles.length && (
        <div className={styles.audioList}>
          {audioFiles.map((file) => (
            <AudioLayout
              key={file.id}
              id={file.id}
              waveform={file.waveform || null}
              duration={file.duration || null}
              cover_url={file.cover_url || null}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SmartMediaLayout;
