'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { VideoIcon, ListVideo, BarChart3, CheckCircle, Settings, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function NavigationTabs() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { href: '/', label: 'Add Video', icon: VideoIcon },
    { href: '/list', label: 'My List', icon: ListVideo },
    { href: '/watched', label: 'Watched', icon: CheckCircle },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-background">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setIsOpen(true)}
              className="sm:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop navigation */}
            <div className="hidden sm:flex space-x-4">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors",
                    pathname === href
                      ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Theme toggle aligned to the right */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile slide-out drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
            onClick={closeMenu}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out sm:hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                    pathname === href
                      ? "text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
