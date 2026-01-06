'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PlatformConfig {
  id?: string;
  platformId: string;
  name: string;
  displayName: string;
  patterns: string[];
  extractor: string;
  color: string;
  icon: string;
  enabled: boolean;
  isPreset?: boolean;
  confidenceScore: number;
}

interface PlatformFormProps {
  platform?: PlatformConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PlatformForm({ platform, isOpen, onClose, onSave }: PlatformFormProps) {
  const [formData, setFormData] = useState<PlatformConfig>({
    platformId: '',
    name: '',
    displayName: '',
    patterns: [''],
    extractor: 'fallback',
    color: '#6b7280',
    icon: 'Video',
    enabled: true,
    confidenceScore: 0.5,
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (platform) {
      setFormData({
        ...platform,
        patterns: platform.patterns.length > 0 ? platform.patterns : [''],
      });
    } else {
      // Reset form for new platform
      setFormData({
        platformId: '',
        name: '',
        displayName: '',
        patterns: [''],
        extractor: 'fallback',
        color: '#6b7280',
        icon: 'Video',
        enabled: true,
        confidenceScore: 0.5,
      });
    }
    setErrors({});
  }, [platform, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.platformId.trim()) {
      newErrors.platformId = 'Platform ID is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.platformId)) {
      newErrors.platformId = 'Platform ID must contain only lowercase letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    const validPatterns = formData.patterns.filter(p => p.trim());
    if (validPatterns.length === 0) {
      newErrors.patterns = 'At least one pattern is required';
    }

    if (formData.confidenceScore < 0 || formData.confidenceScore > 1) {
      newErrors.confidenceScore = 'Confidence score must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        ...formData,
        patterns: formData.patterns.filter(p => p.trim()), // Remove empty patterns
      };

      const url = platform ? `/api/platforms/${platform.platformId}` : '/api/platforms';
      const method = platform ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success(platform ? 'Platform updated successfully!' : 'Platform created successfully!');
        onSave();
        onClose();
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to save platform' });
      }
    } catch (error) {
      console.error('Error saving platform:', error);
      setErrors({ submit: 'Failed to save platform' });
    } finally {
      setSaving(false);
    }
  };

  const addPattern = () => {
    setFormData(prev => ({
      ...prev,
      patterns: [...prev.patterns, ''],
    }));
  };

  const removePattern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index),
    }));
  };

  const updatePattern = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      patterns: prev.patterns.map((p, i) => i === index ? value : p),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 sm:m-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {platform ? 'Edit Platform' : 'Add New Platform'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platformId" className="text-sm font-medium">
                Platform ID *
              </Label>
              <Input
                id="platformId"
                value={formData.platformId}
                onChange={(e) => setFormData(prev => ({ ...prev, platformId: e.target.value }))}
                placeholder="youtube"
                disabled={!!platform} // Can't change ID when editing
                className={errors.platformId ? 'border-red-500' : ''}
              />
              {errors.platformId && (
                <p className="text-red-500 text-xs mt-1">{errors.platformId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Internal Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="YouTube"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="displayName" className="text-sm font-medium">
              Display Name *
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="YouTube"
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Patterns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">URL Patterns *</Label>
              <Button type="button" onClick={addPattern} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Pattern
              </Button>
            </div>
            <div className="space-y-2">
              {formData.patterns.map((pattern, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={pattern}
                    onChange={(e) => updatePattern(index, e.target.value)}
                    placeholder="*.youtube.com/watch*"
                    className={errors.patterns ? 'border-red-500' : ''}
                  />
                  {formData.patterns.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removePattern(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.patterns && (
              <p className="text-red-500 text-xs mt-1">{errors.patterns}</p>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="extractor" className="text-sm font-medium">
                Extractor
              </Label>
              <select
                id="extractor"
                value={formData.extractor}
                onChange={(e) => setFormData(prev => ({ ...prev, extractor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 text-sm"
              >
                <option value="official">Official API</option>
                <option value="ai">AI Analysis</option>
                <option value="fallback">Basic HTML</option>
              </select>
            </div>

            <div>
              <Label htmlFor="color" className="text-sm font-medium">
                Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confidenceScore" className="text-sm font-medium">
                Confidence Score
              </Label>
              <Input
                id="confidenceScore"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.confidenceScore}
                onChange={(e) => setFormData(prev => ({ ...prev, confidenceScore: parseFloat(e.target.value) }))}
                className={errors.confidenceScore ? 'border-red-500' : ''}
              />
              {errors.confidenceScore && (
                <p className="text-red-500 text-xs mt-1">{errors.confidenceScore}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="icon" className="text-sm font-medium">
              Icon Name
            </Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="Video"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lucide React icon name (e.g., Video, Youtube, Tv)
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : (platform ? 'Update Platform' : 'Create Platform')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}