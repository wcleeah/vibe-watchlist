import { redirect } from 'next/navigation'

/**
 * Watched page now redirects to the main list with the watched tab selected.
 * All watched video functionality has been consolidated into /list?tab=watched
 */
export default function WatchedPage() {
    redirect('/list?tab=watched')
}
