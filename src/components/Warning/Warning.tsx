import type { ReactNode } from 'react';
import styles from './Warning.module.scss';

const AlertIcon = () => (
  <svg
    className={styles.icon}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden
  >
    <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
    <line x1='12' y1='9' x2='12' y2='13' />
    <line x1='12' y1='17' x2='12.01' y2='17' />
  </svg>
);

const Warning = ({
  title,
  body,
  dismissLabel,
  confirmLabel,
  onConfirm,
  onDismissAction,
  onDismiss,
}: {
  title: string;
  body?: ReactNode;
  dismissLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onDismissAction?: () => void;
  onDismiss: () => void;
}) => {
  const hasConfirm = Boolean(confirmLabel && onConfirm);

  return (
    <div
      className={styles.backdrop}
      role='alertdialog'
      aria-modal='true'
      aria-labelledby='warning-title'
    >
      <div className={styles.panel}>
        <div className={styles.inner}>
          <div className={styles.titleRow}>
            <AlertIcon />
            <h2 id='warning-title' className={styles.title}>
              {title}
            </h2>
          </div>
          {body ? <div className={styles.body}>{body}</div> : null}
          <div
            className={hasConfirm ? styles.actionsRow : styles.actionsSingle}
          >
            {hasConfirm ? (
              <>
                <button
                  type='button'
                  className={styles.dismiss}
                  onClick={() => {
                    onDismissAction?.();
                    onDismiss();
                  }}
                >
                  {dismissLabel ?? 'Cancel'}
                </button>
                <button
                  type='button'
                  className={styles.confirm}
                  onClick={() => {
                    onConfirm?.();
                    onDismiss();
                  }}
                >
                  {confirmLabel}
                </button>
              </>
            ) : (
              <button
                type='button'
                className={styles.dismiss}
                onClick={() => {
                  onDismissAction?.();
                  onDismiss();
                }}
              >
                {dismissLabel ?? 'OK'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warning;
