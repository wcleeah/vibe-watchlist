'use client'

import { AlertCircle, Check, ChevronDown, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MetadataSuggestion } from '@/lib/types/ai-metadata'
import { cn } from '@/lib/utils'

export interface MetadataOption {
    title: string
    thumbnailUrl?: string
    platform: string
    confidence: number
    reasoning?: string
    source: 'ai' | 'basic' | 'manual'
}

interface MetadataSelectorProps {
    suggestions: MetadataSuggestion[]
    selectedIndex?: number
    onSelect: (index: number) => void
    onManualEdit?: () => void
    error?: string
    className?: string
    disabled?: boolean
}

export function MetadataSelector({
    suggestions,
    selectedIndex,
    onSelect,
    onManualEdit,
    error,
    className,
    disabled = false,
}: MetadataSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8)
            return 'text-green-600 bg-green-50 border-green-200'
        if (confidence >= 0.6)
            return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const getConfidenceIcon = (confidence: number) => {
        if (confidence >= 0.8) return <Star className='w-3 h-3' />
        if (confidence >= 0.6) return <AlertCircle className='w-3 h-3' />
        return <AlertCircle className='w-3 h-3' />
    }

    const selectedSuggestion =
        selectedIndex !== undefined ? suggestions[selectedIndex] : null

    if (error) {
        return (
            <div
                className={cn(
                    'p-3 border rounded-lg bg-red-50 border-red-200',
                    className,
                )}
            >
                <div className='flex items-center gap-2'>
                    <AlertCircle className='w-4 h-4 text-red-500' />
                    <span className='text-sm text-red-700'>{error}</span>
                </div>
                {onManualEdit && (
                    <Button
                        variant='outline'
                        size='sm'
                        className='mt-2'
                        onClick={onManualEdit}
                    >
                        Enter manually
                    </Button>
                )}
            </div>
        )
    }

    if (suggestions.length === 0) {
        return (
            <div
                className={cn(
                    'p-3 border rounded-lg bg-yellow-50 border-yellow-200',
                    className,
                )}
            >
                <div className='flex items-center gap-2'>
                    <AlertCircle className='w-4 h-4 text-yellow-500' />
                    <span className='text-sm text-yellow-700'>
                        No video content detected
                    </span>
                </div>
                {onManualEdit && (
                    <Button
                        variant='outline'
                        size='sm'
                        className='mt-2'
                        onClick={onManualEdit}
                    >
                        Enter manually
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div ref={dropdownRef} className={cn('relative', className)}>
            {/* Selected option display */}
            <button
                type='button'
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'w-full p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors',
                    'flex items-center justify-between',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isOpen && 'ring-2 ring-blue-500 border-blue-500',
                )}
            >
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                    {selectedSuggestion?.thumbnailUrl && (
                        <img
                            src={selectedSuggestion.thumbnailUrl}
                            alt='Thumbnail'
                            className='w-12 h-12 rounded object-cover flex-shrink-0'
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    )}
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                            <h4
                                className='font-medium text-sm truncate'
                                title={selectedSuggestion?.title}
                            >
                                {selectedSuggestion?.title || 'Select metadata'}
                            </h4>
                            {selectedSuggestion && (
                                <span
                                    className={cn(
                                        'px-2 py-0.5 text-xs rounded-full border flex items-center gap-1',
                                        getConfidenceColor(
                                            selectedSuggestion.confidence,
                                        ),
                                    )}
                                >
                                    {getConfidenceIcon(
                                        selectedSuggestion.confidence,
                                    )}
                                    {Math.round(
                                        selectedSuggestion.confidence * 100,
                                    )}
                                    %
                                </span>
                            )}
                        </div>
                        {selectedSuggestion && (
                            <div className='text-xs text-gray-500 flex items-center gap-2 min-w-0'>
                                <span className='capitalize flex-shrink-0'>
                                    {selectedSuggestion.platform}
                                </span>
                                {selectedSuggestion.reasoning && (
                                    <span
                                        className='truncate min-w-0'
                                        title={selectedSuggestion.reasoning}
                                    >
                                        • {selectedSuggestion.reasoning}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                        isOpen && 'transform rotate-180',
                    )}
                />
            </button>

            {/* Dropdown options */}
            {isOpen && (
                <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto'>
                    {suggestions.map((suggestion, index) => (
                        <button
                            type='button'
                            key={index}
                            onClick={() => {
                                onSelect(index)
                                setIsOpen(false)
                            }}
                            className={cn(
                                'w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                                selectedIndex === index &&
                                    'bg-blue-50 border-blue-200',
                            )}
                        >
                            <div className='flex items-center gap-3'>
                                {suggestion.thumbnailUrl && (
                                    <img
                                        src={suggestion.thumbnailUrl}
                                        alt='Thumbnail'
                                        className='w-10 h-10 rounded object-cover flex-shrink-0'
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none'
                                        }}
                                    />
                                )}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <h5
                                            className='font-medium text-sm truncate'
                                            title={suggestion.title}
                                        >
                                            {suggestion.title}
                                        </h5>
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 text-xs rounded-full border flex items-center gap-1',
                                                getConfidenceColor(
                                                    suggestion.confidence,
                                                ),
                                            )}
                                        >
                                            {getConfidenceIcon(
                                                suggestion.confidence,
                                            )}
                                            {Math.round(
                                                suggestion.confidence * 100,
                                            )}
                                            %
                                        </span>
                                        {selectedIndex === index && (
                                            <Check className='w-3 h-3 text-blue-600' />
                                        )}
                                    </div>
                                    <div className='text-xs text-gray-500 flex items-center gap-2 min-w-0'>
                                        <span className='capitalize flex-shrink-0'>
                                            {suggestion.platform}
                                        </span>
                                        {suggestion.reasoning && (
                                            <span
                                                className='truncate min-w-0'
                                                title={suggestion.reasoning}
                                            >
                                                • {suggestion.reasoning}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Manual edit option */}
                    {onManualEdit && (
                        <div className='border-t border-gray-100 p-2'>
                            <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='w-full text-left justify-start'
                                onClick={() => {
                                    onManualEdit()
                                    setIsOpen(false)
                                }}
                            >
                                ✏️ Enter manually
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
