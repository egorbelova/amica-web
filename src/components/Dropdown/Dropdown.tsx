import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  const [indicatorPos, setIndicatorPos] = useState({ top: 0, height: 0 });

  const updateIndicatorByPointer = (clientY: number) => {
    const menu = menuRef.current;
    if (!menu) return null;

    const rect = menu.getBoundingClientRect();
    const pointerY = clientY - rect.top;

    let closestIndex = 0;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, index) => {
      if (!el) return;

      const center = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(pointerY - center);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const el = itemRefs.current[closestIndex];
    if (el) {
      setIndicatorPos({
        top: el.offsetTop,
        height: el.offsetHeight,
      });
    }

    return closestIndex;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    updateIndicatorByPointer(e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    updateIndicatorByPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLUListElement>) => {
    const index = updateIndicatorByPointer(e.clientY);
    if (index !== null) {
      const selectedItem = items[index];
      if (selectedItem) {
        onChange(selectedItem.value);
        setOpen(false);
      }
    }
  };

  useLayoutEffect(() => {
    if (!open) return;

    const index = items.findIndex((item) => item.value === value);
    const el = itemRefs.current[index];

    if (el) {
      setIndicatorPos({
        top: el.offsetTop,
        height: el.offsetHeight,
      });
    }
  }, [open, value, items.length]);

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
    if (open && btnRef.current && menuRef.current) {
      const btnRect = btnRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;

      let left = btnRect.left + window.scrollX;

      if (left + menuWidth > viewportWidth) {
        left = Math.max(window.scrollX, viewportWidth - menuWidth - 8);
      }

      const top = btnRect.bottom + window.scrollY;

      setPosition({ top, left });
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
          <>
            <div
              className={styles.backdrop}
              onClick={() => setOpen(false)}
            ></div>
            <ul
              ref={menuRef}
              className={`${styles.menu} ${open ? styles.open : ''}`}
              style={{
                top: position.top,
                left: position.left,
              }}
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                const index = items.findIndex((item) => item.value === value);
                const el = itemRefs.current[index];
                if (el) {
                  setIndicatorPos({
                    top: el.offsetTop,
                    height: el.offsetHeight,
                  });
                }
              }}
            >
              <span
                className={styles.indicator}
                style={{
                  top: indicatorPos.top,
                  height: indicatorPos.height,
                }}
              />
              {items.map((item, index) => (
                <li
                  key={String(item.value)}
                  className={styles.item}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   onChange(item.value);
                  //   setOpen(false);
                  // }}
                >
                  {item.icon && (
                    <span className={styles.icon}>{item.icon}</span>
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </>,
          document.body,
        )}
    </div>
  );
}
