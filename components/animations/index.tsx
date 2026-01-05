'use client';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function FadeIn({
  children,
  duration = 300,
  delay = 0,
  direction = 'up',
  className
}: FadeInProps) {
  const directionClass = {
    up: 'slide-in-from-bottom-4',
    down: 'slide-in-from-top-4',
    left: 'slide-in-from-right-4',
    right: 'slide-in-from-left-4',
  }[direction];

  return (
    <div
      className={`animate-in fade-in-0 ${directionClass} duration-${duration} ${delay > 0 ? `delay-${delay}` : ''} ${className || ''}`}
      style={{ animationDelay: delay > 0 ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ children, staggerDelay = 100, className }: StaggerContainerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 ${sizeClass} ${className || ''}`} />
  );
}