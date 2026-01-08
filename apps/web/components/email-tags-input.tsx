import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

import { X } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

import { mergeEmails, splitEmails } from '~/lib/utils/email-input';

type EmailTagsInputProps = {
  value: string[];
  inputValue: string;
  onChange: (value: string[]) => void;
  onInputChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
  onSubmit?: (emails: string[]) => void;
};

export function EmailTagsInput({
  value,
  inputValue,
  onChange,
  onInputChange,
  placeholder,
  disabled,
  id,
  ariaLabel,
  className,
  onSubmit,
}: EmailTagsInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commitInput = () => {
    const tokens = splitEmails(inputValue);
    if (tokens.length === 0) return;
    onChange(mergeEmails(value, tokens));
    onInputChange('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const nextEmails = inputValue.trim()
        ? mergeEmails(value, splitEmails(inputValue))
        : value;
      if (nextEmails.length === 0) return;
      if (inputValue.trim()) {
        onChange(nextEmails);
        onInputChange('');
      }
      onSubmit?.(nextEmails);
      return;
    }

    if (
      event.key === ',' ||
      event.key === ' ' ||
      event.key === 'Spacebar' ||
      event.key === 'Space'
    ) {
      event.preventDefault();
      commitInput();
      return;
    }

    if (event.key === 'Backspace' && inputValue === '' && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    commitInput();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const pasted = event.clipboardData.getData('text');
    if (!pasted) return;
    if (/[,\s]/.test(pasted)) {
      event.preventDefault();
      const combined = inputValue ? `${inputValue} ${pasted}` : pasted;
      const tokens = splitEmails(combined);
      if (tokens.length === 0) return;
      onChange(mergeEmails(value, tokens));
      onInputChange('');
    }
  };

  return (
    <div
      className={cn(
        'border-input focus-within:ring-ring flex min-h-9 flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors focus-within:ring-1 focus-within:outline-none',
        disabled && 'opacity-50',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((email) => (
        <Badge key={email} variant="secondary" className="flex items-center gap-1">
          <span>{email}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== email))}
            disabled={disabled}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${email}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="email"
        autoComplete="email"
        placeholder={placeholder}
        className="min-w-[140px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </div>
  );
}
