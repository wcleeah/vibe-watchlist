'use client'

import { ArrowRightCircle, Globe, Pencil } from 'lucide-react'
import { useState } from 'react'

import { type ActionConfig, MediaCard } from '@/components/shared'
import { formatHKTDate, toHKT } from '@/lib/utils/hkt-date'

import type { ComingSoonWithTags } from '@/types/coming-soon'

interface ComingSoonCardProps {
    item: ComingSoonWithTags
    onEdit?: (item: ComingSoonWithTags) => void
    onDelete?: (id: number) => Promise<void>
    onTransform?: (item: ComingSoonWithTags) => void
    onRefreshMetadata?: (item: ComingSoonWithTags) => void
}

/**
 * ComingSoonCard component - displays a coming soon item with actions
 * Uses shared MediaCard for consistent styling across the app
 */
export function ComingSoonCard({
    item,
    onEdit,
    onDelete,
    onTransform,
    onRefreshMetadata,
}: ComingSoonCardProps) {
    const [loadingDelete, setLoadingDelete] = useState(false)

    // Determine status
    const isTransformed = !!item.transformedAt
    const isReleased =
        item.isReleased ?? toHKT(item.releaseDate).getTime() <= Date.now()

    // Format release date for display (include time if not midnight HKT)
    const releaseDateDisplay = (() => {
        const dateOnly = formatHKTDate(item.releaseDate, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: undefined,
            minute: undefined,
        })

        // Check if the time component is non-midnight in HKT
        const d = new Date(
            typeof item.releaseDate === 'string'
                ? item.releaseDate
                : item.releaseDate,
        )
        const hktTime = d.toLocaleString('en-US', {
            timeZone: 'Asia/Hong_Kong',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })

        if (hktTime !== '00:00') {
            return `${dateOnly} ${hktTime} HKT`
        }
        return dateOnly
    })()

    // Build metadata badges
    const metadata = [
        ...(item.id
            ? [{ key: 'ID', value: item.id, color: 'cyan' as const }]
            : []),
        {
            key: 'PLATFORM',
            value: item.platform,
            color: 'green' as const,
        },
        {
            key: 'RELEASE',
            value: releaseDateDisplay,
            color: isReleased ? ('yellow' as const) : ('purple' as const),
        },
    ]

    // Build primary actions
    const primaryActions: ActionConfig[] = [
        {
            id: 'preview',
            label: 'preview()',
            href: item.url,
            variant: 'primary',
        },
    ]

    if (onTransform && isReleased && !isTransformed) {
        primaryActions.push({
            id: 'transform',
            label: 'transform()',
            onClick: () => onTransform(item),
            variant: 'secondary',
            icon: <ArrowRightCircle className='w-3 h-3' />,
        })
    }

    // Build secondary actions
    const secondaryActions: ActionConfig[] = []

    if (onEdit) {
        secondaryActions.push({
            id: 'edit',
            label: 'edit()',
            onClick: () => onEdit(item),
            variant: 'ghost',
            icon: <Pencil className='w-3 h-3' />,
        })
    }

    if (onRefreshMetadata) {
        secondaryActions.push({
            id: 'refresh-metadata',
            label: 'refreshMetadata()',
            onClick: () => onRefreshMetadata(item),
            variant: 'ghost',
            icon: <Globe className='w-3 h-3' />,
        })
    }

    // Delete action
    const deleteAction: ActionConfig | undefined = onDelete
        ? {
              id: 'delete',
              label: 'delete()',
              onClick: async () => {
                  if (!item.id) return
                  setLoadingDelete(true)
                  try {
                      await onDelete(item.id)
                  } finally {
                      setLoadingDelete(false)
                  }
              },
              variant: 'danger',
              loading: loadingDelete,
          }
        : undefined

    // Determine status badge
    const statusBadge = isTransformed
        ? { text: 'Transformed', variant: 'neutral' as const }
        : isReleased
          ? { text: 'Released', variant: 'success' as const }
          : { text: 'Upcoming', variant: 'info' as const }

    // Highlight released (not yet transformed) items with a ring
    const highlightClass =
        isReleased && !isTransformed
            ? 'ring-2 ring-green-400/60 dark:ring-green-500/40'
            : ''

    return (
        <MediaCard
            item={item}
            title={item.title || 'Untitled'}
            thumbnailUrl={item.thumbnailUrl || null}
            url={item.url}
            tags={item.tags}
            metadata={metadata}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            deleteAction={deleteAction}
            statusBadge={statusBadge}
            className={highlightClass}
        />
    )
}
