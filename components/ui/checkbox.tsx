import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    className?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, ...props }, ref) => (
        <div className='relative inline-flex'>
            <input
                type='checkbox'
                ref={ref}
                className={cn(
                    'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'appearance-none',
                    className,
                )}
                {...props}
            />
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                <Check
                    className={cn(
                        'h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity',
                    )}
                />
            </div>
            <div className='absolute inset-0 bg-gray-900 dark:bg-gray-50 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity' />
        </div>
    ),
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
