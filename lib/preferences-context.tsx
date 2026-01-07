'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface UserPreferences {
    theme: ThemeMode
}

const defaultPreferences: UserPreferences = {
    theme: 'light',
}

const PreferencesContext = createContext<{
    preferences: UserPreferences
    updatePreferences: (updates: Partial<UserPreferences>) => void
    resetPreferences: () => void
} | null>(null)

export function usePreferences() {
    const context = useContext(PreferencesContext)
    if (!context) {
        throw new Error(
            'usePreferences must be used within a PreferencesProvider',
        )
    }
    return context
}

interface PreferencesProviderProps {
    children: React.ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
    const [preferences, setPreferences] =
        useState<UserPreferences>(defaultPreferences)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('vibe-watchlist-preferences')
            if (stored) {
                const parsed = JSON.parse(stored)
                setPreferences({ ...defaultPreferences, ...parsed })
            }
        } catch (error) {
            console.error('Failed to load preferences:', error)
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(
                    'vibe-watchlist-preferences',
                    JSON.stringify(preferences),
                )
            } catch (error) {
                console.error('Failed to save preferences:', error)
            }
        }
    }, [preferences, isLoaded])

    const updatePreferences = (updates: Partial<UserPreferences>) => {
        setPreferences((prev) => ({ ...prev, ...updates }))
    }

    const resetPreferences = () => {
        setPreferences(defaultPreferences)
    }

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement

        if (preferences.theme === 'dark') {
            root.classList.add('dark')
        } else if (preferences.theme === 'light') {
            root.classList.remove('dark')
        } else {
            // system preference
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    root.classList.add('dark')
                } else {
                    root.classList.remove('dark')
                }
            }

            // Set initial value
            if (mediaQuery.matches) {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }

            mediaQuery.addEventListener('change', handleChange)
            return () => mediaQuery.removeEventListener('change', handleChange)
        }
    }, [preferences.theme])

    if (!isLoaded) {
        return null // or a loading spinner
    }

    return (
        <PreferencesContext.Provider
            value={{ preferences, updatePreferences, resetPreferences }}
        >
            {children}
        </PreferencesContext.Provider>
    )
}
