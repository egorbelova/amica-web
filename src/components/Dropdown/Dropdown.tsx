import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.scss';
import { Icon, type IconName } from '../Icons/AutoIcons';
import Button from '../ui/button/Button';

export type DropdownItem<T> = {
  label: string;
  value: T;
  icon?: IconName;
};

type DropdownProps<T> = {
  items: DropdownItem<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  buttonStyles?: string;
  dropdownStyles?: string;
};

export function Dropdown<T extends string | number>({
  items,
  value,
  onChange,
  buttonStyles,
  placeholder = 'Select...',
  dropdownStyles,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const menuRef = useRef<HTMLUListElement>(null);
  const menuInnerRef = useRef<HTMLDivElement>(null);

  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const isPointerDown = useRef(false);
  const isScrolling = useRef(false);

  const [indicatorPos, setIndicatorPos] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const updateIndicatorByPointer = (clientY: number) => {
    const menu = menuInnerRef.current;
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

  const isPointerInsideMenu = (clientX: number, clientY: number) => {
    const menu = menuRef.current;
    if (!menu) return false;

    const rect = menu.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const rafRef = useRef<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // if (!isPointerDown.current) return;

    if (isScrolling.current && isPointerDown.current) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!isPointerInsideMenu(e.clientX, e.clientY)) {
        resetIndicator();
        return;
      }
      updateIndicatorByPointer(e.clientY);
      rafRef.current = null;
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // e.preventDefault();
    e.stopPropagation();
    isPointerDown.current = true;
    isScrolling.current = false;
    updateIndicatorByPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // e.preventDefault();
    e.stopPropagation();

    if (!isPointerDown.current || isScrolling.current) return;
    isPointerDown.current = false;

    if (!isPointerInsideMenu(e.clientX, e.clientY)) {
      resetIndicator();
      return;
    }

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
    const menu = menuRef.current;

    if (!el || !menu) return;

    const targetScrollTop = el.offsetTop;

    const maxScroll = menu.scrollHeight - menu.clientHeight;

    menu.scrollTo({
      top: Math.min(targetScrollTop, maxScroll),
      behavior: 'instant',
    });

    requestAnimationFrame(() => {
      setIndicatorPos({
        top: el.offsetTop,
        height: el.offsetHeight,
      });
    });
  }, [open, value, items]);

  const resetIndicator = () => {
    setIndicatorPos(null);
    // const index = items.findIndex((item) => item.value === value);
    // const el = itemRefs.current[index];
    // if (el) {
    //   setIndicatorPos({
    //     top: el.offsetTop,
    //     height: el.offsetHeight,
    //   });
    // }
  };

  useEffect(() => {
    if (open && btnRef.current && menuRef.current) {
      const btnRect = btnRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;

      let left = btnRect.left + window.scrollX;

      if (left + menuWidth > viewportWidth) {
        left = Math.max(window.scrollX, viewportWidth - menuWidth - 8);
      }

      const top = btnRect.top + window.scrollY;

      setPosition({ top, left });
    }
  }, [open, items.length]);

  const selected = items.find((item) => item.value === value);

  return (
    <div className={`${styles.dropdown} ${dropdownStyles}`} ref={containerRef}>
      <Button
        ref={btnRef}
        onClick={() => setOpen((prev) => !prev)}
        className={`${styles.toggle} ${buttonStyles}`}
        type='button'
      >
        {selected ? (
          <>
            {selected.icon && (
              <Icon name={selected.icon} className={styles.icon} />
            )}
            {selected.label}
          </>
        ) : (
          placeholder
        )}
      </Button>

      {open &&
        createPortal(
          <>
            <div className={styles.backdrop} onClick={() => setOpen(false)} />
            <ul
              ref={menuRef}
              className={`${styles.menu} ${open ? styles.open : ''}`}
              style={{
                top: position.top,
                left: position.left,
              }}
              onScroll={() => {
                // e.stopPropagation();
                isScrolling.current = true;
                resetIndicator();
              }}
            >
              <div
                className={styles.menuInner}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={resetIndicator}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                ref={menuInnerRef}
              >
                {indicatorPos && (
                  <span
                    className={styles.indicator}
                    style={{
                      top: indicatorPos.top,
                      height: indicatorPos.height,
                    }}
                  />
                )}
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
                      <Icon className={styles.icon} name={item.icon} />
                    )}
                    {item.label}
                  </li>
                ))}
              </div>
            </ul>
          </>,
          document.body,
        )}
    </div>
  );
}
