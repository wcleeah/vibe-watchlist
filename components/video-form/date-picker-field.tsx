'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
    id: string
    label: string
    value: string | undefined
    onChange: (date: string | undefined) => void
    placeholder?: string
    required?: boolean
    disabled?: boolean
    className?: string
    minDate?: string
    maxDate?: string
}

export function DatePickerField({
    id,
    label,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    className,
    minDate,
    maxDate,
}: DatePickerFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue || undefined)
    }

    // Format date for display
    const formatDisplayDate = (dateStr: string | undefined): string => {
        if (!dateStr) return ''
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        } catch {
            return dateStr
        }
    }

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={id}>
                {label}
                {required && <span className='text-red-500 ml-1'>*</span>}
            </Label>
            <div className='relative'>
                <input
                    type='date'
                    id={id}
                    value={value || ''}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    min={minDate}
                    max={maxDate}
                    placeholder={placeholder}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm',
                        'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
                        'placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300',
                    )}
                />
            </div>
            {value && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {formatDisplayDate(value)}
                </p>
            )}
        </div>
    )
}
