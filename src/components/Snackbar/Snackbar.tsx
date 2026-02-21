import { useEffect, useRef } from 'react';
import styles from './Snackbar.module.scss';
import { Icon } from '../Icons/AutoIcons';

const Snackbar = ({
  message,
  open,
  onExited,
}: {
  message: string;
  open: boolean;
  onExited: () => void;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;

    const handleEnd = (e: AnimationEvent) => {
      if (e.target !== el) return;
      if (e.animationName !== 'snackbar-exit') return;
      onExited?.();
    };

    el.addEventListener('animationend', handleEnd);

    return () => {
      el.removeEventListener('animationend', handleEnd);
    };
  }, [open, onExited]);

  return (
    <div
      ref={ref}
      className={`${styles.snackbar} ${open ? styles.show : styles.hide}`}
    >
      <Icon name='Unread' className={styles.icon} />
      {message}
    </div>
  );
};

export default Snackbar;
