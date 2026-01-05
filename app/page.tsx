'use client';

import { NavigationTabs } from '@/components/navigation-tabs';
import { SplitScreenAddForm } from '@/components/split-screen-add-form';

export default function Home() {
  const handleVideoAdded = () => {
    // Could add toast notification or redirect to list
    console.log('Video added successfully');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <NavigationTabs />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <SplitScreenAddForm onVideoAdded={handleVideoAdded} />
      </main>
    </div>
  );
}