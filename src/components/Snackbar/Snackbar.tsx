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
    if (!el) return;
    if (open) return;

    const handleEnd = (ev: Event) => {
      if (ev.target !== el) return;
      const e = ev as TransitionEvent | AnimationEvent;
      if ('propertyName' in e && e.propertyName !== 'opacity') return;
      onExited?.();
    };

    el.addEventListener('transitionend', handleEnd as EventListener, {
      once: true,
    });
    el.addEventListener('animationend', handleEnd as EventListener, {
      once: true,
    });

    return () => {
      el.removeEventListener('transitionend', handleEnd as EventListener);
      el.removeEventListener('animationend', handleEnd as EventListener);
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
