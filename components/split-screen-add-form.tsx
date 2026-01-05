'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, X } from 'lucide-react';

interface SplitScreenAddFormProps {
  onVideoAdded?: () => void;
}

export function SplitScreenAddForm({ onVideoAdded }: SplitScreenAddFormProps) {
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddVideo = async () => {
    if (!url.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          alert(errorData.error || 'Video already exists');
        } else {
          alert('Failed to add video');
        }
      } else {
        setUrl('');
        onVideoAdded?.();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Add New Video</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Paste a video URL from YouTube, Netflix, Nebula, or Twitch
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-12 text-base"
          />

          <Button
            onClick={handleAddVideo}
            disabled={!url.trim() || isAdding}
            className="w-full h-12"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add to Watchlist
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}