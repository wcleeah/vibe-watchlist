'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
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
                className={cn('w-full font-medium', sizeClass, className)}
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
            className={cn('w-full font-medium', sizeClass, className)}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {content}
        </Button>
    )
}
