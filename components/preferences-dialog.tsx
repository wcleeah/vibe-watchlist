'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, Palette, Monitor, Moon, Sun, RotateCcw, Youtube, Tv, Gamepad2 } from 'lucide-react';
import { usePreferences, type ThemeMode, type AccentColor, type VideoPlatform } from '@/lib/preferences-context';

const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
];

const accentColors: { value: AccentColor; label: string; class: string }[] = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
];

const platformOptions: { value: VideoPlatform | null; label: string; icon: React.ReactNode }[] = [
  { value: null, label: 'None (ask each time)', icon: null },
  { value: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
  { value: 'netflix', label: 'Netflix', icon: <Tv className="w-4 h-4" /> },
  { value: 'nebula', label: 'Nebula', icon: <Tv className="w-4 h-4" /> },
  { value: 'twitch', label: 'Twitch', icon: <Gamepad2 className="w-4 h-4" /> },
];

export function PreferencesDialog() {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme: ThemeMode) => {
    updatePreferences({ theme });
  };

  const handleAccentChange = (accentColor: AccentColor) => {
    updatePreferences({ accentColor });
  };

  const handlePlatformChange = (defaultPlatform: VideoPlatform | null) => {
    updatePreferences({ defaultPlatform });
  };

  const toggleCompactView = () => {
    updatePreferences({ compactView: !preferences.compactView });
  };

  const toggleAutoPreview = () => {
    updatePreferences({ autoPreview: !preferences.autoPreview });
  };

  const toggleShowThumbnails = () => {
    updatePreferences({ showThumbnails: !preferences.showThumbnails });
  };

  const handleReset = () => {
    resetPreferences();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 p-0"
      >
        <Settings className="w-4 h-4" />
        <span className="sr-only">Preferences</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferences
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          <div className="space-y-4">
            {/* Theme Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Palette className="w-3 h-3" />
                Theme
              </Label>
              <div className="grid grid-cols-3 gap-1">
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={preferences.theme === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange(option.value)}
                    className="flex items-center gap-1 h-7 text-xs px-2"
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Accent Color</Label>
              <div className="grid grid-cols-5 gap-1">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleAccentChange(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      preferences.accentColor === color.value
                        ? 'border-gray-900 dark:border-gray-100 scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.class.replace('bg-', '') }}
                    title={color.label}
                  >
                    <span className="sr-only">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Platform */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Default Platform</Label>
              <div className="grid grid-cols-2 gap-1">
                {platformOptions.map((option) => (
                  <Button
                    key={option.value || 'null'}
                    variant={preferences.defaultPlatform === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePlatformChange(option.value)}
                    className="flex items-center gap-1 h-7 text-xs px-2 justify-start"
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* UI Preferences */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Interface</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-view" className="text-xs">Compact view</Label>
                  <Button
                    variant={preferences.compactView ? "default" : "outline"}
                    size="sm"
                    onClick={toggleCompactView}
                    className="h-6 px-2 text-xs"
                  >
                    {preferences.compactView ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-preview" className="text-xs">Auto-preview</Label>
                  <Button
                    variant={preferences.autoPreview ? "default" : "outline"}
                    size="sm"
                    onClick={toggleAutoPreview}
                    className="h-6 px-2 text-xs"
                  >
                    {preferences.autoPreview ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-thumbnails" className="text-xs">Show thumbnails</Label>
                  <Button
                    variant={preferences.showThumbnails ? "default" : "outline"}
                    size="sm"
                    onClick={toggleShowThumbnails}
                    className="h-6 px-2 text-xs"
                  >
                    {preferences.showThumbnails ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleReset}
                size="sm"
                className="w-full flex items-center gap-1 h-7 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}