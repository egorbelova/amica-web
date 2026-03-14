import React, { memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './DatePickerModal.module.scss';

import type { DateKey } from './DateSeparator';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: DateKey[];
  initialDateKey?: DateKey | null;
  onSelectDate: (dateKey: DateKey) => void;
}

const formatDateLabel = (dateKey: DateKey): string => {
  const d = new Date(dateKey + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === today.toISOString().slice(0, 10)) return 'Today';
  if (dateKey === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  availableDates,
  initialDateKey,
  onSelectDate,
}) => {
  const sortedDates = useMemo(
    () => [...availableDates].sort((a, b) => a.localeCompare(b)),
    [availableDates],
  );

  const handleSelect = useCallback(
    (dateKey: DateKey) => {
      onSelectDate(dateKey);
      onClose();
    },
    [onSelectDate, onClose],
  );

  if (!isOpen) return null;

  const content = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose date"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Jump to date</h3>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.list}>
          {sortedDates.length === 0 ? (
            <p className={styles.empty}>No messages</p>
          ) : (
            sortedDates.map((dateKey) => (
              <button
                key={dateKey}
                type="button"
                className={`${styles.dateItem} ${initialDateKey === dateKey ? styles.dateItemActive : ''}`}
                onClick={() => handleSelect(dateKey)}
                data-date-key={dateKey}
              >
                {formatDateLabel(dateKey)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default memo(DatePickerModal);
