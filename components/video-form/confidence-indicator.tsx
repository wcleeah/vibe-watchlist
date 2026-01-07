'use client'

import { AlertTriangle, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
    confidence: number // 0.0 to 1.0
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

export function ConfidenceIndicator({
    confidence,
    size = 'sm',
    showLabel = true,
    className,
}: ConfidenceIndicatorProps) {
    const getConfidenceLevel = (conf: number) => {
        if (conf >= 0.8)
            return {
                level: 'high',
                label: 'High confidence',
                color: 'text-green-600 bg-green-50 border-green-200',
            }
        if (conf >= 0.6)
            return {
                level: 'medium',
                label: 'Medium confidence',
                color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            }
        if (conf >= 0.3)
            return {
                level: 'low',
                label: 'Low confidence',
                color: 'text-red-600 bg-red-50 border-red-200',
            }
        return {
            level: 'very-low',
            label: 'Very low confidence',
            color: 'text-gray-600 bg-gray-50 border-gray-200',
        }
    }

    const getIcon = (conf: number) => {
        if (conf >= 0.8)
            return (
                <Star
                    className={cn(
                        'fill-current',
                        size === 'sm'
                            ? 'w-3 h-3'
                            : size === 'md'
                              ? 'w-4 h-4'
                              : 'w-5 h-5',
                    )}
                />
            )
        if (conf >= 0.6)
            return (
                <AlertTriangle
                    className={cn(
                        size === 'sm'
                            ? 'w-3 h-3'
                            : size === 'md'
                              ? 'w-4 h-4'
                              : 'w-5 h-5',
                    )}
                />
            )
        return (
            <X
                className={cn(
                    size === 'sm'
                        ? 'w-3 h-3'
                        : size === 'md'
                          ? 'w-4 h-4'
                          : 'w-5 h-5',
                )}
            />
        )
    }

    const { level, label, color } = getConfidenceLevel(confidence)

    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <span
                className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium',
                    color,
                    size === 'sm' && 'text-xs',
                    size === 'md' && 'text-sm',
                    size === 'lg' && 'text-base px-3 py-1',
                )}
            >
                {getIcon(confidence)}
                {showLabel && (
                    <>
                        <span className='hidden sm:inline'>{label}</span>
                        <span className='sm:hidden'>
                            {Math.round(confidence * 100)}%
                        </span>
                    </>
                )}
                {!showLabel && <span>{Math.round(confidence * 100)}%</span>}
            </span>
        </div>
    )
}

// Progress bar variant for showing confidence visually
interface ConfidenceProgressProps
    extends Omit<ConfidenceIndicatorProps, 'size'> {
    width?: string
    height?: string
}

const getProgressConfidenceLevel = (conf: number) => {
    if (conf >= 0.8)
        return {
            level: 'high',
            label: 'High confidence',
            color: 'bg-green-500',
        }
    if (conf >= 0.6)
        return {
            level: 'medium',
            label: 'Medium confidence',
            color: 'bg-yellow-500',
        }
    if (conf >= 0.3)
        return { level: 'low', label: 'Low confidence', color: 'bg-red-500' }
    return {
        level: 'very-low',
        label: 'Very low confidence',
        color: 'bg-gray-400',
    }
}

export function ConfidenceProgress({
    confidence,
    showLabel = false,
    className,
    width = '100px',
    height = '8px',
}: ConfidenceProgressProps) {
    const { color: progressColor, label } =
        getProgressConfidenceLevel(confidence)

    return (
        <div className={cn('inline-flex flex-col gap-1', className)}>
            <div
                className='bg-gray-200 rounded-full overflow-hidden'
                style={{ width, height }}
                title={`${label} (${Math.round(confidence * 100)}%)`}
            >
                <div
                    className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        progressColor,
                    )}
                    style={{ width: `${confidence * 100}%` }}
                />
            </div>
            {showLabel && (
                <div className='text-xs text-gray-600 text-center'>
                    {Math.round(confidence * 100)}% confidence
                </div>
            )}
        </div>
    )
}
