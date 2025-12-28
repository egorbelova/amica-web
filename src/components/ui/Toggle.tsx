import React from 'react';
import styles from './Toggle.module.scss';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}) => {
  return (
    <label className={styles.toggleContainer}>
      {label && <span className={styles.label}>{label}</span>}
      <div
        className={`${styles.toggle} ${checked ? styles.checked : ''} ${
          disabled ? styles.disabled : ''
        }`}
      >
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.input}
        />
        <span className={styles.slider} />
      </div>
    </label>
  );
};

export default Toggle;
