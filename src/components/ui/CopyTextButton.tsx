import { useState, useCallback } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard';

type Props = {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
  disabled?: boolean;
};

export function CopyTextButton({
  text,
  label,
  copiedLabel,
  className,
  disabled,
}: Props) {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(async () => {
    if (!text || disabled) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [text, disabled]);

  return (
    <button
      type='button'
      className={className}
      onClick={() => void onClick()}
      disabled={disabled || !text}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
