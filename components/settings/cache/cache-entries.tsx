'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CacheEntry {
  id: string;
  url: string;
  confidenceScore: number | null;
  createdAt: string;
  expiresAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CacheEntriesProps {
  onRefresh: () => void;
}

export function CacheEntries({ onRefresh }: CacheEntriesProps) {
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEntries = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cache?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data.entries);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch cache entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handlePageChange = (page: number) => {
    fetchEntries(page);
  };

  const handleDeleteEntry = async (cacheId: string) => {
    if (!confirm('Are you sure you want to delete this cache entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cache/${cacheId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cache entry deleted successfully');
        fetchEntries(currentPage); // Refresh current page
        onRefresh(); // Refresh stats
      } else {
        throw new Error('Failed to delete cache entry');
      }
    } catch (error) {
      console.error('Error deleting cache entry:', error);
      toast.error('Failed to delete cache entry');
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (entry: CacheEntry) => {
    const expired = isExpired(entry.expiresAt);
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        expired
          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200'
          : 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200'
      }`}>
        {expired ? (
          <>
            <XCircle className="w-3 h-3" />
            Expired
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3" />
            Active
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cache Entries ({pagination?.total || 0})
          </h3>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No cache entries found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                            {entry.url}
                          </p>
                        </div>
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {entry.confidenceScore ? `${Math.round(entry.confidenceScore * 100)}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleDeleteEntry(entry.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
