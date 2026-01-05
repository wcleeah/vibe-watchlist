'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/lib/preferences-context';

export function ThemeToggle() {
  const { preferences, updatePreferences } = usePreferences();

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(preferences.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updatePreferences({ theme: themes[nextIndex] });
  };

  const getThemeIcon = () => {
    switch (preferences.theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (preferences.theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system mode';
      case 'system':
        return 'Switch to light mode';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-9 h-9 p-0"
      aria-label={getThemeLabel()}
    >
      {getThemeIcon()}
    </Button>
  );
}