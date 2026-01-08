'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logEvent } from '@/lib/analytics/events'
import type { PlatformSuggestion } from '@/lib/services/ai-service'
import { PlatformIcon } from './platform-badge'
import { PlatformCreator } from './platform-creator'

interface PlatformSuggestionsProps {
    suggestions: PlatformSuggestion[]
    onAccept: (suggestion: PlatformSuggestion) => Promise<void>
    onReject: () => void
    onPlatformCreated?: (platform: string) => void
    className?: string
}

export function PlatformSuggestions({
    suggestions,
    onAccept,
    onReject,
    onPlatformCreated,
    className,
}: PlatformSuggestionsProps) {
    const [actionExecuted, setActionExecuted] = useState(false)
    if (suggestions.length === 0) return null

    const suggestion = suggestions[0] // For now, show only the first/best suggestion
    if (actionExecuted) {
        return
    }

    return (
        <Card
            className={`border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 ${className}`}
        >
            <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                    Platform Detected
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0'>
                        <PlatformIcon
                            platform={suggestion.platform}
                            size='sm'
                        />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                            <span className='font-medium text-sm'>
                                {suggestion.platform}
                            </span>
                            <Badge
                                variant={
                                    suggestion.confidence > 0.8
                                        ? 'default'
                                        : suggestion.confidence > 0.6
                                          ? 'secondary'
                                          : 'outline'
                                }
                                className='text-xs'
                            >
                                {Math.round(suggestion.confidence * 100)}%
                                confidence
                            </Badge>
                        </div>
                        <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                            This URL matches the pattern for{' '}
                            {suggestion.platform}. Would you like to add this
                            platform?
                        </p>
                        {suggestion.patterns.length > 0 && (
                            <div className='text-xs text-gray-500 dark:text-gray-500'>
                                <span className='font-medium'>Pattern: </span>
                                <code className='bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs'>
                                    {suggestion.patterns[0]}
                                </code>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <div className='flex gap-2'>
                        <Button
                            size='sm'
                            onClick={async () => {
                                await onAccept(suggestion)
                                setActionExecuted(true)

                                // Log platform suggestion acceptance
                                logEvent('platform_suggestion_accepted', {
                                    suggestionType: 'platform',
                                    platform: suggestion.platform,
                                    confidence: suggestion.confidence,
                                })
                            }}
                            className='flex-1 h-8 text-xs'
                            type='button'
                        >
                            <Check className='w-3 h-3 mr-1' />
                            Add Platform
                        </Button>
                        <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                                onReject()
                                setActionExecuted(true)
                            }}
                            className='h-8 text-xs'
                            type='button'
                        >
                            <X className='w-3 h-3 mr-1' />
                            Dismiss
                        </Button>
                    </div>
                    <div className='flex justify-center'>
                        <PlatformCreator
                            onPlatformCreated={(str) => {
                                setActionExecuted(true)
                                if (onPlatformCreated) {
                                    onPlatformCreated(str)
                                }
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
