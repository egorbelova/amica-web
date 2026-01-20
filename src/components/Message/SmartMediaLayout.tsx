import React, { useMemo, useState, useEffect } from 'react';
import styles from './SmartMediaLayout.module.scss';
import { generateLayout } from './SmartMediaLayout';
import ProgressiveImage from './ProgressiveImage';
import { useMediaModal } from '../../contexts/MediaModalContext';
import VideoLayout from './VideoLayout';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { openMediaModal } = useMediaModal();

  const MAX_W = 420;
  const MAX_H = 560;
  const MIN_W = 200;
  const MIN_H = 200;

  const singleFile = files.length === 1 ? files[0] : null;
  const layout = useMemo(() => generateLayout(files), [files]);

  const containerWidth = Math.min(
    layout.reduce((max, item) => Math.max(max, item.left + item.width), 0),
    MAX_W
  );

  const containerHeight = Math.min(
    layout.reduce((max, item) => Math.max(max, item.top + item.height), 0),
    MAX_H
  );

  const handleItemClick = (file: File, rect: DOMRect) => {
    setSelectedFile(file);
    setIsModalOpen(true);
    onClick?.(file);
  };

  const closeModal = () => setIsModalOpen(false);

  const getItemRect = (fileId: number) => {
    const element = document.querySelector(
      `[data-file-id="${fileId}"]`
    ) as HTMLElement;
    return element?.getBoundingClientRect();
  };

  useEffect(() => {
    if (selectedFile) {
      const rect = getItemRect(selectedFile.id);
    }
  }, [selectedFile]);

  if (!files.length) return null;

  return (
    <>
      <div
        className={styles.wrapper}
        style={{ width: containerWidth, height: containerHeight }}
      >
        {layout.map((item) => {
          const itemRef = React.useRef<HTMLDivElement>(null);

          return (
            <div
              ref={itemRef}
              key={item.file.id}
              data-file-id={item.file.id}
              className={styles.item}
              style={{
                top: item.top,
                left: item.left,
                width: item.width,
                height: item.height,
              }}
              onClick={() => {
                const rect = itemRef.current?.getBoundingClientRect();
                openMediaModal(item.file, rect);
                handleItemClick(item.file, rect!);
              }}
            >
              {(() => {
                switch (item.file.category) {
                  case 'video':
                    return <VideoLayout full={item.file.file_url} />;
                  case 'image':
                    return (
                      <ProgressiveImage
                        small={item.file.thumbnail_small_url}
                        full={item.file.thumbnail_medium_url}
                        dominant_color={item.file.dominant_color}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default SmartMediaLayout;
