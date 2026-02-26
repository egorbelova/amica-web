import {
  forwardRef,
  startTransition,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      type = 'button',
      className = '',
      variant = 'primary',
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const BLUR_DURATION_MS = 150;

    const buttonRef = useRef<HTMLButtonElement>(null);
    const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const prevChildrenRef = useRef<React.ReactNode>(undefined);
    const [width, setWidth] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);
    const [isBlurring, setIsBlurring] = useState(false);

    useLayoutEffect(() => {
      if (
        prevChildrenRef.current !== undefined &&
        prevChildrenRef.current !== children
      ) {
        prevChildrenRef.current = children;
        startTransition(() => setIsBlurring(true));
        const id = setTimeout(() => setIsBlurring(false), BLUR_DURATION_MS);
        return () => clearTimeout(id);
      }
      prevChildrenRef.current = children;
    }, [children]);

    useLayoutEffect(() => {
      const button = buttonRef.current;
      if (!button) return;

      const updateWidth = () => {
        const contentSpan = button.querySelector<HTMLSpanElement>(
          `.${styles.content}`,
        );
        if (contentSpan) {
          const style = getComputedStyle(button);
          const padding =
            parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          setWidth(contentSpan.scrollWidth + padding);
        }
      };

      updateWidth();

      const resizeObserver = new ResizeObserver(updateWidth);
      const contentSpan = button.querySelector<HTMLSpanElement>(
        `.${styles.content}`,
      );
      if (contentSpan) resizeObserver.observe(contentSpan);

      return () => resizeObserver.disconnect();
    }, [children]);

    const setRefs = (el: HTMLButtonElement | null) => {
      buttonRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref)
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    };

    const classes = [
      styles.button,
      styles[variant],
      disabled ? styles.disabled : '',
      isPulsing ? styles.active : '',
      isBlurring ? styles.blurring : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={setRefs}
        type={type}
        disabled={disabled}
        className={classes}
        onPointerDown={() => {
          if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
          }
          setIsPulsing(true);
        }}
        onPointerUp={() => {
          releaseTimeoutRef.current = setTimeout(() => {
            setIsPulsing(false);
            releaseTimeoutRef.current = null;
          }, 70);
        }}
        onPointerLeave={() => {
          if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
          }
          setIsPulsing(false);
        }}
        style={{
          width: width ? `${width}px` : 'auto',
        }}
        {...props}
      >
        <span className={styles.content}>{children}</span>
      </button>
    );
  },
);

export default Button;
