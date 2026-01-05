'use client';

import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  loadingText?: string;
  successText?: string;
  defaultText?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function SubmitButton({
  onClick,
  isLoading,
  disabled = false,
  loadingText = "Adding...",
  successText = "Add to Watchlist",
  defaultText = "Add to Watchlist",
  className,
  size = 'default',
  variant = 'default',
}: SubmitButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn("w-full h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]", className)}
      size={size}
      variant={variant}
    >
      <div className="animate-in fade-in-0 duration-200 flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>{defaultText}</span>
          </>
        )}
      </div>
    </Button>
  );
}