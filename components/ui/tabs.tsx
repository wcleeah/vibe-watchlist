'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function Tabs({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot='tabs'
            className={cn('flex flex-col gap-6', className)}
            {...props}
        />
    )
}

function TabsList({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot='tabs-list'
            className={cn(
                'inline-flex h-10 items-center justify-start gap-1 border-b border-gray-200 dark:border-gray-800',
                className,
            )}
            {...props}
        />
    )
}

function TabsTrigger({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot='tabs-trigger'
            className={cn(
                'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                'border-transparent hover:border-gray-300 dark:hover:border-gray-700',
                'data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    )
}

function TabsContent({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot='tabs-content'
            className={cn(
                'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className,
            )}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
