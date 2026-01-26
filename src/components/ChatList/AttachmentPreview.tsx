import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import styles from './ChatListItem.module.scss';
import { useSettings } from '@/contexts/settings/Settings';

function AttachmentPreview({ file }) {
  const { objectUrl } = usePrivateMedia(
    file.thumbnail_small_url || file.file_url,
  );
  const { autoplayVideos } = useSettings();

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
          src={file.file_url ? file.file_url + '#t=0.001' : ''}
          loop
          muted
          playsInline
          autoPlay={autoplayVideos}
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
