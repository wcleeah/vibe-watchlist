'use client'

import { cn } from '@/lib/utils'

export interface TabConfig {
    id: string
    label: string
    icon?: React.ReactNode
    count?: number
}

interface TabSwitcherProps {
    tabs: TabConfig[]
    activeTab: string
    onTabChange: (tab: string) => void
    className?: string
}

export function TabSwitcher({
    tabs,
    activeTab,
    onTabChange,
    className,
}: TabSwitcherProps) {
    return (
        <div className={cn('flex gap-2', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type='button'
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    )}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && (
                        <span
                            className={cn(
                                'ml-1 px-1.5 py-0.5 rounded text-xs font-medium',
                                activeTab === tab.id
                                    ? 'bg-primary-foreground/20'
                                    : 'bg-secondary-foreground/10',
                            )}
                        >
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}
