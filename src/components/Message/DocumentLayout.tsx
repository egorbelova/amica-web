import { Icon } from '../Icons/AutoIcons';
import styles from './SmartMediaLayout.module.scss';
import type { File } from '@/types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(1)} ${sizes[i]}`;
}

const DocumentLayout = ({ file }: { file: File }) => {
  return (
    <div className={styles.documentLayoutContent}>
      <Icon name='File' className={styles.documentLayoutContentIcon} />
      <div className={styles.documentLayoutContentHeader}>
        <span className={styles.documentLayoutContentTitle}>
          <span className={styles.documentLayoutContentTitleFilename}>
            {file.original_name.replace(new RegExp(`${file.extension}$`), '') ||
              ''}
          </span>
          <span className={styles.documentLayoutContentTitleExtension}>
            {file.extension}
          </span>
        </span>
        <span className={styles.documentLayoutContentSize}>
          {formatFileSize(file.file_size || 0)}
        </span>
      </div>
    </div>
  );
};

export default DocumentLayout;
