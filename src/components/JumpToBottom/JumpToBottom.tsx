import styles from './JumpToBottom.module.scss';
import { useJump } from '@/hooks/useJump';
import { Icon } from '../Icons/AutoIcons';
import Button from '../ui/button/Button';

const arrowIcon = <Icon name='Arrow' className={styles.icon} />;

export default function JumpToBottom() {
  const { isVisible, jumpToBottom } = useJump();

  return (
    <Button
      key={'jump-to-bottom-button'}
      className={`${styles['jump-to-bottom']} ${
        isVisible ? styles.visible : styles.hidden
      }`}
      onClick={jumpToBottom}
    >
      {arrowIcon}
    </Button>
  );
}
