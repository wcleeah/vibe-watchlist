'use client';

import { UrlInput } from './video-form/url-input';
import { ParsedUrl } from '@/lib/utils/url-parser.js';

interface UrlInputSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
  isValid?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function UrlInputSection({
  value,
  onChange,
  isValid,
  error,
  disabled = false,
}: UrlInputSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Add New Video</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste a video URL to start the extraction
        </p>
      </div>

      {/* URL Input */}
      <UrlInput
        value={value}
        onChange={onChange}
        placeholder="https://youtube.com/watch?v=..."
        isValid={isValid}
        error={error}
        disabled={disabled}
      />
    </div>
  );
}