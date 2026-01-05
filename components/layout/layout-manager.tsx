'use client';

import { useState, useEffect } from 'react';
import { CenteredLayout, SplitLayout } from './page-layouts';

interface LayoutManagerProps {
  hasContent: boolean;
  header: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
  className?: string;
}

export function LayoutManager({ hasContent, header, form, preview, className }: LayoutManagerProps) {
  const [showSplit, setShowSplit] = useState(false);

  useEffect(() => {
    // Debounce the layout transition to prevent jarring changes
    const timeoutId = setTimeout(() => {
      setShowSplit(hasContent);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [hasContent]);

  if (!showSplit) {
    // Single centered layout
    return (
      <CenteredLayout className={className}>
        {header}
        {form}
      </CenteredLayout>
    );
  }

  // Split layout
  return (
    <div className={`min-h-screen ${className}`}>
      {/* Header */}
      <div className="text-center py-8">
        {header}
      </div>

      <SplitLayout
        left={form}
        right={preview}
      />
    </div>
  );
}