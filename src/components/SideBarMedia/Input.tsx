import React, { useRef, useEffect } from 'react';
import styles from './Input.module.scss';

interface InputProps {
  placeholder: string;
  isRequired?: boolean;
  value: string;
  onChange: (val: string) => void;
  notes?: string;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  isRequired = false,
  value,
  onChange,
  notes,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };
  const [autofocusActive, setAutofocusActive] = React.useState(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleAnimationStart = (e: AnimationEvent) => {
      if (e.animationName === 'autofill') setAutofocusActive(true);
    };
    const handleAnimationCancel = () => setAutofocusActive(false);

    input.addEventListener('animationstart', handleAnimationStart);
    input.addEventListener('transitioncancel', handleAnimationCancel);
    return () => {
      input.removeEventListener('animationstart', handleAnimationStart);
      input.removeEventListener(
        'transitioncancel',
        handleAnimationCancel as EventListener,
      );
    };
  }, []);

  return (
    <div className={styles.inputWrapper}>
      <div className={styles.input} onClick={handleContainerClick}>
        <label className={styles.placeholder} htmlFor={placeholder}>
          {placeholder}
        </label>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type='text'
            // id={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete='off'
            autoCapitalize='none'
            spellCheck={false}
            inputMode='text'
            aria-autocomplete='none'
            role='textbox'
          />
          <label
            className={`${styles.placeholderStatus} ${
              value.length > 0 || autofocusActive ? styles.hidden : ''
            }`}
            htmlFor={placeholder}
          >
            {isRequired ? 'required' : 'optional'}
          </label>
        </div>
      </div>
      {notes && <span className={styles.notes}>{notes}</span>}
    </div>
  );
};

export default Input;
