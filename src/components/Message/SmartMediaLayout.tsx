import React, { useMemo, useState, useEffect } from 'react';
import styles from './SmartMediaLayout.module.scss';
import { generateLayout } from './SmartMediaLayout';
import ProgressiveImage from './ProgressiveImage';
import { useMediaModal } from '../../contexts/MediaModalContext';
import VideoLayout from './VideoLayout';
import AudioLayout from './AudioLayout';

interface File {
  id: number;
  file_url: string;
  category?: string;
  thumbnail_small_url?: string;
  thumbnail_medium_url?: string;
  file_type?: string;
  original_name?: string;
  height?: number;
  width?: number;
  dominant_color?: string;
}

interface Props {
  files: File[];
  onClick?: (file: File) => void;
}

const SmartMediaLayout: React.FC<Props> = ({ files, onClick }) => {
  const mediaFiles = useMemo(
    () => files.filter((f) => f.category !== 'audio'),
    [files],
  );

  const audioFiles = useMemo(
    () => files.filter((f) => f.category === 'audio'),
    [files],
  );

  const layout = useMemo(() => generateLayout(mediaFiles), [mediaFiles]);

  if (!files.length) return null;

  const MAX_W = 420;
  const MAX_H = 560;

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
      <div className={styles['container-media']}>
        {layout.length === 1 && (
          <div className={styles.wrapperGlow}>
            {layout[0].file.category === 'video' && (
              <VideoLayout
                full={layout[0].file.file_url}
                //@ts-ignore
                has_audio={layout[0].file.has_audio}
              />
            )}
            {layout[0].file.category === 'image' && (
              <ProgressiveImage
                small={layout[0].file.thumbnail_small_url}
                full={layout[0].file.thumbnail_medium_url}
                dominant_color={layout[0].file.dominant_color}
              />
            )}
          </div>
        )}
        {/* MEDIA GRID */}
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
                    //@ts-ignore
                    has_audio={item.file.has_audio}
                  />
                )}

                {item.file.category === 'image' && (
                  <ProgressiveImage
                    small={item.file.thumbnail_small_url}
                    full={item.file.thumbnail_medium_url}
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
              full={file.file_url}
              //@ts-ignore
              waveform={file.waveform}
              //@ts-ignore
              duration={file.duration}
              //@ts-ignore
              cover_url={file.cover_url}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SmartMediaLayout;
