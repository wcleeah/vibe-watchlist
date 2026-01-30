'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ActionVariant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'ghost'
    | 'info'
    | 'success'
export type ActionSize = 'sm' | 'md'

export interface ActionButtonProps {
    label: string
    onClick?: () => void | Promise<void>
    href?: string
    variant?: ActionVariant
    size?: ActionSize
    icon?: React.ReactNode
    loading?: boolean
    disabled?: boolean
    className?: string
}

const variantMap: Record<
    ActionVariant,
    'default' | 'outline' | 'destructive' | 'ghost'
> = {
    primary: 'default',
    secondary: 'outline',
    danger: 'destructive',
    ghost: 'ghost',
    info: 'outline',
    success: 'outline',
}

// Custom color classes for info and success variants
const variantColorClasses: Partial<Record<ActionVariant, string>> = {
    info: 'border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 transition-transform hover:scale-[1.02] active:scale-[0.98]',
    success:
        'border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950',
}

export function ActionButton({
    label,
    onClick,
    href,
    variant = 'secondary',
    size = 'sm',
    icon,
    loading = false,
    disabled = false,
    className,
}: ActionButtonProps) {
    const buttonVariant = variantMap[variant]
    const sizeClass = size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm'
    const colorClass = variantColorClasses[variant] || ''

    const content = loading ? (
        <Loader2 className='w-4 h-4 animate-spin' />
    ) : (
        <>
            {icon && <span className='mr-1'>{icon}</span>}
            {label}
        </>
    )

    if (href) {
        return (
            <Button
                variant={buttonVariant}
                size='sm'
                className={cn(
                    'w-full font-medium',
                    sizeClass,
                    colorClass,
                    className,
                )}
                disabled={disabled || loading}
                asChild
            >
                <Link href={href} target='_blank' rel='noopener noreferrer'>
                    {content}
                </Link>
            </Button>
        )
    }

    return (
        <Button
            variant={buttonVariant}
            size='sm'
            className={cn(
                'w-full font-medium',
                sizeClass,
                colorClass,
                className,
            )}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {content}
        </Button>
    )
}
