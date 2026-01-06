'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Tag {
  id: number;
  name: string;
  color: string;
}

export function TagsManager() {
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tag Management ({tags.length})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Create, edit, and delete tags for organizing your videos
        </p>
      </div>

      {/* Add New Tag */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
          Add New Tag
        </h4>
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
          <Button onClick={handleAddTag} disabled={!newTagName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </div>

      {/* Tags List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {tags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tags created yet. Add your first tag above!
          </div>
        ) : (
          tags.map((tag) => (
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
          ))
        )}
      </div>
    </div>
  );
}