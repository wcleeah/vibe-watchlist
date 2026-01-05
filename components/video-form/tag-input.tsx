'use client';

import { useState, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Tag as TagIcon } from 'lucide-react';
import { TagList } from '@/components/ui/tag';
import { Tag } from '@/types/tag';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  onTagAdd: (tagName: string) => Promise<void>;
  onTagRemove: (tagId: number) => void;
  selectedTags: Tag[];
  suggestions: Tag[];
  showSuggestions: boolean;
  onSelectSuggestion: (tag: Tag) => void;
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({
    value,
    onChange,
    onTagAdd,
    onTagRemove,
    selectedTags,
    suggestions,
    showSuggestions,
    onSelectSuggestion,
    isLoading = false,
    error,
    placeholder = "Add tags",
    className,
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (value.trim()) {
          await onTagAdd(value.trim());
        }
      } else if (e.key === 'Escape') {
        setIsFocused(false);
      }
    };

    const handleSuggestionClick = (tag: Tag) => {
      onSelectSuggestion(tag);
      setIsFocused(false);
    };

    return (
      <div className="space-y-2">
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div id="selected-tags" aria-label={`Selected tags: ${selectedTags.map(tag => tag.name).join(', ')}`}>
            <TagList
              tags={selectedTags}
              onRemove={onTagRemove}
              size="sm"
            />
          </div>
        )}

        <div className="relative">
          <Input
            ref={ref}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay to allow suggestion clicks
              setTimeout(() => setIsFocused(false), 150);
            }}
             className={cn("w-full h-12 text-base", className)}
            disabled={isLoading}
            aria-label="Tag input"
            aria-describedby={error ? "tag-input-error" : selectedTags.length > 0 ? "selected-tags" : undefined}
            aria-expanded={showSuggestions && suggestions.length > 0 && isFocused}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
               <Button
                 type="button"
                 size="sm"
                 onClick={() => onTagAdd(value.trim())}
                 disabled={!value.trim()}
                 className="h-12 w-20 text-sm font-bold"
               >
                Add
              </Button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && isFocused && (
            <div
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
              role="listbox"
              aria-label="Tag suggestions"
            >
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleSuggestionClick(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                  role="option"
                  aria-selected={false}
                >
                  <TagIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            id="tag-input-error"
            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800"
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

TagInput.displayName = 'TagInput';