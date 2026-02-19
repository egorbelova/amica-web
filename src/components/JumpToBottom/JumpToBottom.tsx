import styles from './JumpToBottom.module.scss';
import { useJump } from '@/hooks/useJump';
import { Icon } from '../Icons/AutoIcons';

export default function JumpToBottom() {
  const { isVisible, jumpToBottom } = useJump();

  return (
    <div
      className={`${styles['jump-to-bottom']} ${
        isVisible ? styles.visible : styles.hidden
      }`}
      onClick={jumpToBottom}
    >
      <Icon name='Arrow' className={styles.icon} />
    </div>
  );
}
