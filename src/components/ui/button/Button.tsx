import {
  forwardRef,
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
    const mirrorRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dimensions, setDimensions] = useState({ width: 40, height: 40 });

    useLayoutEffect(() => {
      const mirror = mirrorRef.current;
      if (!mirror) return;

      const updateSize = () => {
        setDimensions({
          width: mirror.offsetWidth,
          height: mirror.offsetHeight,
        });
      };

      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(mirror);
      return () => resizeObserver.disconnect();
    }, [children]);

    const setRefs = (el: HTMLButtonElement | null) => {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    };

    const classes = [
      styles.button,
      styles[variant],
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const mirrorClasses = [
      styles.button,
      styles.mirror,
      styles[variant],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={setRefs}
        type={type}
        disabled={disabled}
        className={classes}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
        {...props}
      >
        <div
          ref={mirrorRef}
          className={mirrorClasses}
          aria-hidden="true"
        >
          <span className={styles.content}>{children}</span>
        </div>
        <span className={styles.content}>{children}</span>
      </button>
    );
  },
);
export default Button;
