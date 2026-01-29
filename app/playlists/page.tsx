'use client'

import { NavigationTabs } from '@/components/navigation-tabs'
import { PlaylistList } from '@/components/playlists'

export default function PlaylistsPage() {
    return (
        <div className='min-h-screen bg-background text-foreground'>
            <NavigationTabs />

            <main className='container mx-auto px-4 pt-32 pb-12 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
                        My Playlists
                    </h1>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Track your progress through YouTube playlists
                    </p>
                </div>

                {/* Playlist List */}
                <PlaylistList />
            </main>
        </div>
    )
}
