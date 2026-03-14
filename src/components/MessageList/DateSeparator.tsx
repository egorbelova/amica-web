import React, { memo } from 'react';
import styles from './DateSeparator.module.scss';

export type DateKey = string; // YYYY-MM-DD, re-exported for MessageList

interface DateSeparatorProps {
  dateKey: DateKey;
  label: string;
  onClick: () => void;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({
  dateKey,
  label,
  onClick,
}) => {
  return (
    <button
      type='button'
      className={styles.separator}
      data-date-separator={dateKey}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      <span className={styles.label}>{label}</span>
    </button>
  );
};

export default memo(DateSeparator);
