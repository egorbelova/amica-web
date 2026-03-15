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
    <div className={styles.separator} data-date-separator={dateKey}>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        className={styles.label}
      >
        {label}
      </span>
    </div>
  );
};

export default memo(DateSeparator);
