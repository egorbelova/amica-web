import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import MediaModal from '../components/Message/MediaModal';
import type { File } from '../types';

interface MediaModalContextType {
  openMediaModal: (file: File, rect?: DOMRect) => void;
  closeMediaModal: () => void;
}

const MediaModalContext = createContext<MediaModalContextType | null>(null);

export const MediaModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modalData, setModalData] = useState<{
    file: File;
    rect?: DOMRect;
  } | null>(null);

  const openMediaModal = (file: File, rect?: DOMRect) => {
    setModalData({ file, rect });
  };

  const closeMediaModal = () => {
    setModalData(null);
  };

  return (
    <MediaModalContext.Provider value={{ openMediaModal, closeMediaModal }}>
      {children}
      {modalData && (
        <MediaModal
          file={modalData.file}
          containerRect={modalData.rect}
          onClose={closeMediaModal}
        />
      )}
    </MediaModalContext.Provider>
  );
};

export const useMediaModal = () => {
  const context = useContext(MediaModalContext);
  if (!context)
    throw new Error('useMediaModal must be used within MediaModalProvider');
  return context;
};
