import React, { useEffect, useState } from 'react';
import styles from './Snackbar.module.scss';
import { Icon } from '../Icons/AutoIcons';

const Snackbar = ({ message, open, onExited }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout;

    if (open) {
      setShow(true);
    } else {
      setShow(false);
      timeout = setTimeout(() => {
        if (onExited) onExited();
      }, 300);
    }

    return () => clearTimeout(timeout);
  }, [open, onExited]);

  return (
    <div className={`${styles.snackbar} ${show ? styles.show : styles.hide}`}>
      <Icon name='Unread' className={styles.icon} />
      {message}
    </div>
  );
};

export default Snackbar;
