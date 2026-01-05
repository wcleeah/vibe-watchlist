'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isValid?: boolean;
  error?: string | null;
  className?: string;
  disabled?: boolean;
}

export const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  ({
    value,
    onChange,
    placeholder = "https://youtube.com/watch?v=...",
    isValid,
    error,
    className,
    disabled = false,
    ...props
  }, ref) => {
    const hasValue = value.trim().length > 0;
    const showValidation = hasValue && isValid !== undefined;

    return (
      <div className="space-y-2">
        <Input
          ref={ref}
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-16 text-base",
            showValidation && isValid && "border-green-500 focus:border-green-500",
            showValidation && !isValid && "border-orange-500 focus:border-orange-500",
            className
          )}
          disabled={disabled}
          aria-label="Video URL input"
          aria-describedby={error ? "url-input-error" : undefined}
          aria-invalid={showValidation ? !isValid : undefined}
          {...props}
        />
        {error && (
          <div
            id="url-input-error"
            className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

UrlInput.displayName = 'UrlInput';