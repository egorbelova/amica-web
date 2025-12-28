import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.scss';

type DropdownItem<T> = {
  label: string;
  value: T;
  icon?: React.ReactNode;
};

type DropdownProps<T> = {
  items: DropdownItem<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
};

export function Dropdown<T extends string | number>({
  items,
  value,
  onChange,
  placeholder = 'Select...',
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const listHeight = Math.min(items.length * 36, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < listHeight;

      setPosition({
        top: openUp
          ? rect.top + window.scrollY - listHeight
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open, items.length]);

  const selected = items.find((item) => item.value === value);

  return (
    <div className={styles.dropdown} ref={containerRef}>
      <button
        ref={btnRef}
        onClick={() => setOpen((prev) => !prev)}
        className={styles.toggle}
        type='button'
      >
        {selected ? (
          <>
            {selected.icon && (
              <span className={styles.icon}>{selected.icon}</span>
            )}
            {selected.label}
          </>
        ) : (
          placeholder
        )}
        <span className={`${styles.arrow} ${open ? styles.open : ''}`}>▾</span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            className={`${styles.menu} ${open ? styles.open : ''}`}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {items.map((item) => (
              <li
                key={String(item.value)}
                className={`${styles.item} ${
                  item.value === value ? styles.active : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                {item.label}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
