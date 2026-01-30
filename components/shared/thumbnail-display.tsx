'use client'

import { FileText } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

interface ThumbnailDisplayProps {
    src: string | null
    alt: string
    className?: string
    fallback?: React.ReactNode
}

export function ThumbnailDisplay({
    src,
    alt,
    className,
    fallback,
}: ThumbnailDisplayProps) {
    if (!src) {
        return (
            <div
                className={cn(
                    'w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center',
                    className,
                )}
            >
                {fallback || <FileText className='w-6 h-6 text-gray-400' />}
            </div>
        )
    }

    return (
        <div className={cn('relative w-full h-full', className)}>
            <Image
                src={src}
                alt={alt}
                fill
                loading='lazy'
                className='object-contain rounded'
            />
        </div>
    )
}
