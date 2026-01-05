'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NavigationTabs } from '@/components/navigation-tabs';

interface Tag {
  id: number;
  name: string;
  color: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6b7280');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Add new tag
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      if (response.ok) {
        setNewTagName('');
        setNewTagColor('#6b7280');
        fetchTags();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  // Start editing
  const handleEditStart = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  // Save edit
  const handleEditSave = async () => {
    if (!editName.trim() || !editingId) return;

    try {
      const response = await fetch(`/api/tags/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      if (response.ok) {
        setEditingId(null);
        fetchTags();
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditingId(null);
  };

  // Delete tag
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationTabs />
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Tags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, edit, and delete tags for organizing your videos
          </p>
        </div>

        {/* Add New Tag */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Tag</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Label htmlFor="tagName" className="mb-2">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
            </div>
            <div>
              <Label htmlFor="tagColor" className="mb-2">Color</Label>
              <Input
                id="tagColor"
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-16 h-10"
              />
            </div>
            <Button onClick={handleAddTag} disabled={!newTagName.trim()} className="h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Tags List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Existing Tags ({tags.length})</h2>
          </div>

          {tags.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tags created yet. Add your first tag above!
            </div>
          ) : (
            <div className="divide-y">
              {tags.map((tag) => (
                <div key={tag.id} className="p-4 flex items-center justify-between">
                  {editingId === tag.id ? (
                    // Edit mode
                    <div className="flex items-center gap-4 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Button size="sm" onClick={handleEditSave}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEditCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium">#{tag.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditStart(tag)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(tag.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}