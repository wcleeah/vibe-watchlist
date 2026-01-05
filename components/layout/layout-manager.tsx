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
    // Immediate layout transition for better UX
    setShowSplit(hasContent);
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
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="text-center py-8">
        {header}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <SplitLayout
          left={form}
          right={preview}
        />
      </div>
    </div>
  );
}