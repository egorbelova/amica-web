import { useState, useEffect, useRef } from 'react';
import styles from './DropZone.module.scss';

export default function DropZone({
  onFiles,
}: {
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      setDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) setDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setDragging(false);

      const files = Array.from(e.dataTransfer?.files || []) as File[];
      if (files.length > 0 && onFiles) {
        onFiles(files);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFiles]);

  return dragging ? (
    <div className={styles.overlay}>Drop files here to upload</div>
  ) : null;
}
