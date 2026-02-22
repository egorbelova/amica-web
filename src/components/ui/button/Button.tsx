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
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [width, setWidth] = useState(0);

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
