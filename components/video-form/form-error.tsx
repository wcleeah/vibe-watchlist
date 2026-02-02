interface FormErrorProps {
    error: string | null
}

/**
 * Simple error message display for forms
 */
export function FormError({ error }: FormErrorProps) {
    if (!error) {
        return null
    }

    return <p className='text-sm text-destructive text-center'>{error}</p>
}
