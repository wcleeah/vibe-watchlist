'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { VideoIcon, ListVideo } from 'lucide-react';
import { PreferencesDialog } from '@/components/preferences-dialog';

export function NavigationTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 mb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex space-x-8">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors",
                pathname === "/"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <VideoIcon className="w-4 h-4" />
              Add Video
            </Link>
            <Link
              href="/list"
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors",
                pathname === "/list"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <ListVideo className="w-4 h-4" />
              My List
            </Link>
          </div>

          {/* Preferences dialog aligned to the right */}
          <PreferencesDialog />
        </div>
      </div>
    </nav>
  );
}