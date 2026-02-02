'use client'

import { Button } from '@/components/ui/button'
import type { PlaylistImportPreview } from '@/types/playlist'
import type { ContentMode } from '@/types/series'
import { SubmitButton } from './submit-button'

interface FormActionButtonsProps {
    mode: ContentMode
    isSubmitting: boolean
    isSubmittingSeries: boolean
    isImportingPlaylist: boolean
    isLoadingPreview: boolean
    playlistPreview: PlaylistImportPreview | null
    onReset: () => void
    onSeriesSubmit: () => void
    onPlaylistPreview: () => void
    onPlaylistImport: () => void
}

/**
 * Action buttons for the video form (Reset + Submit/Add Series/Import Playlist)
 */
export function FormActionButtons({
    mode,
    isSubmitting,
    isSubmittingSeries,
    isImportingPlaylist,
    isLoadingPreview,
    playlistPreview,
    onReset,
    onSeriesSubmit,
    onPlaylistPreview,
    onPlaylistImport,
}: FormActionButtonsProps) {
    const isAnyLoading =
        isSubmitting || isSubmittingSeries || isImportingPlaylist

    return (
        <div className='flex gap-2'>
            <Button
                type='button'
                variant='secondary'
                className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                onClick={onReset}
                disabled={isAnyLoading}
            >
                Reset
            </Button>

            {mode === 'video' && (
                <SubmitButton
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isSubmittingSeries}
                    className='flex-1'
                />
            )}

            {mode === 'series' && (
                <Button
                    type='button'
                    onClick={onSeriesSubmit}
                    disabled={isSubmitting || isSubmittingSeries}
                    className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                >
                    {isSubmittingSeries ? 'Adding...' : 'Add Series'}
                </Button>
            )}

            {mode === 'playlist' && playlistPreview && (
                <Button
                    type='button'
                    onClick={onPlaylistImport}
                    disabled={isImportingPlaylist}
                    className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                >
                    {isImportingPlaylist
                        ? 'Importing...'
                        : `Import ${playlistPreview.itemCount} Videos`}
                </Button>
            )}

            {mode === 'playlist' && !playlistPreview && (
                <Button
                    type='button'
                    onClick={onPlaylistPreview}
                    disabled={isLoadingPreview}
                    className='flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                >
                    {isLoadingPreview ? 'Loading...' : 'Preview Playlist'}
                </Button>
            )}
        </div>
    )
}
