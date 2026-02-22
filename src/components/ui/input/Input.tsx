import styles from './Input.module.scss';

interface InputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
const Input = ({ placeholder, value, onChange, className }: InputProps) => {
  return (
    <div className={`${styles.input} ${className}`}>
      <label className={styles.placeholder} htmlFor={placeholder}>
        {placeholder}
      </label>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default Input;
