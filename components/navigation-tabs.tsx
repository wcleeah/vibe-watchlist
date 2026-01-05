'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { VideoIcon, ListVideo, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function NavigationTabs() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

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

          {/* Dark mode toggle aligned to the right */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}