import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import styles from './ChatListItem.module.scss';

function AttachmentPreview({ file }) {
  const { objectUrl } = usePrivateMedia(
    file.thumbnail_small_url || file.file_url,
  );

  if (!objectUrl) return null;

  switch (file.category) {
    case 'image':
      return (
        <img
          className={styles['chat-list-item__attachment']}
          src={objectUrl}
          alt={file.original_name || 'Attachment'}
        />
      );

    case 'video':
      return (
        <video
          className={styles['chat-list-item__attachment']}
          src={file.file_url}
          loop
          muted
          playsInline
          autoPlay
        />
      );

    default:
      return (
        <a
          href={file.file_url}
          target='_blank'
          rel='noopener noreferrer'
          className={styles['chat-list-item__attachment']}
        >
          {file.original_name || 'Attachment'}
        </a>
      );
  }
}

export default AttachmentPreview;
