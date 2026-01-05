'use client';

interface CenteredLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function CenteredLayout({ children, className }: CenteredLayoutProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export function SplitLayout({ left, right, className }: SplitLayoutProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-screen ${className}`}>
      {/* Left side */}
      <div className="lg:col-span-2 order-2 lg:order-1 flex items-center">
        <div className="w-full">
          {left}
        </div>
      </div>

      {/* Right side */}
      <div className="lg:col-span-3 order-1 lg:order-2 flex items-center justify-center">
        <div className="w-full">
          {right}
        </div>
      </div>
    </div>
  );
}