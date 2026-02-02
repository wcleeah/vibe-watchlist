'use client'

import { Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePlatforms } from '@/hooks/use-platforms'

interface PlatformCreatorProps {
    onPlatformCreated?: (platform: string) => void
}

export function PlatformCreator({ onPlatformCreated }: PlatformCreatorProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Use the centralized platforms hook (skip fetch since we only need addPlatform)
    const { addPlatform } = usePlatforms({ fetchOnMount: false })

    const [formData, setFormData] = useState({
        platformId: '',
        name: '',
        displayName: '',
        patterns: [] as string[],
        currentPattern: '',
        color: '#6b7280',
        icon: 'Video',
    })

    const addPattern = () => {
        if (
            formData.currentPattern.trim() &&
            !formData.patterns.includes(formData.currentPattern.trim())
        ) {
            setFormData((prev) => ({
                ...prev,
                patterns: [...prev.patterns, prev.currentPattern.trim()],
                currentPattern: '',
            }))
        }
    }

    const removePattern = (pattern: string) => {
        setFormData((prev) => ({
            ...prev,
            patterns: prev.patterns.filter((p) => p !== pattern),
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (
            !formData.platformId.trim() ||
            !formData.name.trim() ||
            !formData.displayName.trim() ||
            formData.patterns.length === 0
        ) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const newPlatform = await addPlatform({
                platformId: formData.platformId.trim(),
                name: formData.name.trim(),
                displayName: formData.displayName.trim(),
                patterns: formData.patterns,
                color: formData.color,
                icon: formData.icon,
            })

            if (newPlatform) {
                toast.success(
                    `Platform "${formData.displayName}" created successfully!`,
                )
                onPlatformCreated?.(newPlatform.platformId)
                setIsExpanded(false)
                // Reset form
                setFormData({
                    platformId: '',
                    name: '',
                    displayName: '',
                    patterns: [],
                    currentPattern: '',
                    color: '#6b7280',
                    icon: 'Video',
                })
            } else {
                toast.error('Failed to create platform')
            }
        } catch (error) {
            console.error('Platform creation error:', error)
            toast.error('Failed to create platform')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isExpanded) {
        return (
            <Button
                size='sm'
                variant='ghost'
                onClick={() => setIsExpanded(true)}
                className='h-8 text-xs'
            >
                <Plus className='w-3 h-3 mr-1' />
                Create Custom Platform
            </Button>
        )
    }

    return (
        <Card className='border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20'>
            <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-orange-900 dark:text-orange-100 flex items-center justify-between'>
                    Create Custom Platform
                    <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setIsExpanded(false)}
                        className='h-6 w-6 p-0'
                    >
                        <X className='w-4 h-4' />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <Label htmlFor='platformId'>Platform ID *</Label>
                        <Input
                            id='platformId'
                            value={formData.platformId}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    platformId: e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, ''),
                                }))
                            }
                            placeholder='e.g., vimeo'
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Label htmlFor='name'>Internal Name *</Label>
                        <Input
                            id='name'
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder='e.g., vimeo'
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor='displayName'>Display Name *</Label>
                    <Input
                        id='displayName'
                        value={formData.displayName}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                displayName: e.target.value,
                            }))
                        }
                        placeholder='e.g., Vimeo'
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <Label>URL Patterns *</Label>
                    <div className='flex gap-2 mb-2'>
                        <Input
                            value={formData.currentPattern}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    currentPattern: e.target.value,
                                }))
                            }
                            placeholder='e.g., vimeo.com'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addPattern()
                                }
                            }}
                            disabled={isSubmitting}
                        />
                        <Button
                            type='button'
                            size='sm'
                            onClick={addPattern}
                            disabled={
                                !formData.currentPattern.trim() || isSubmitting
                            }
                        >
                            <Plus className='w-4 h-4' />
                        </Button>
                    </div>
                    {formData.patterns.length > 0 && (
                        <div className='flex flex-wrap gap-1'>
                            {formData.patterns.map((pattern) => (
                                <Badge
                                    key={pattern}
                                    variant='secondary'
                                    className='text-xs'
                                >
                                    {pattern}
                                    <button
                                        type='button'
                                        onClick={() => removePattern(pattern)}
                                        className='ml-1 hover:text-red-500'
                                        disabled={isSubmitting}
                                    >
                                        <X className='w-3 h-3' />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <Label htmlFor='color'>Color</Label>
                        <Input
                            id='color'
                            type='color'
                            value={formData.color}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    color: e.target.value,
                                }))
                            }
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Label htmlFor='icon'>Icon</Label>
                        <Input
                            id='icon'
                            value={formData.icon}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    icon: e.target.value,
                                }))
                            }
                            placeholder='Video'
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className='flex gap-2 pt-4'>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsExpanded(false)}
                        disabled={isSubmitting}
                        className='flex-1'
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={
                            isSubmitting ||
                            !formData.platformId.trim() ||
                            !formData.name.trim() ||
                            !formData.displayName.trim() ||
                            formData.patterns.length === 0
                        }
                        className='flex-1'
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                                Creating...
                            </>
                        ) : (
                            'Create Platform'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
