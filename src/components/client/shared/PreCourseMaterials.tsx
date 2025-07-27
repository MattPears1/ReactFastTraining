import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { clientPortalService } from '@/services/client';
import { useDownload } from '@/hooks/client/useDownload';
import { useToast } from '@/contexts/ToastContext';
import type { PreCourseMaterial } from '@/types/client';

interface PreCourseMaterialsProps {
  bookingId: string;
  className?: string;
  onMaterialViewed?: (materialId: string) => void;
}

export const PreCourseMaterials: React.FC<PreCourseMaterialsProps> = ({ 
  bookingId, 
  className = '',
  onMaterialViewed 
}) => {
  const [materials, setMaterials] = useState<PreCourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { download, downloading } = useDownload();
  const { showToast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, [bookingId]);

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientPortalService.getPreCourseMaterials(bookingId);
      setMaterials(data);
    } catch (err) {
      setError('Failed to load course materials');
      console.error('Materials load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: PreCourseMaterial) => {
    await download(
      `/api/client/materials/${material.id}/download`,
      `${material.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
      {
        onSuccess: async () => {
          // Mark as viewed
          try {
            await clientPortalService.markMaterialAsViewed(material.id);
            setMaterials(prev => prev.map(m => 
              m.id === material.id ? { ...m, viewed: true } : m
            ));
            onMaterialViewed?.(material.id);
          } catch (err) {
            console.error('Failed to mark material as viewed:', err);
          }
        },
        onError: () => {
          showToast('error', 'Failed to download material. Please try again.');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button
          onClick={loadMaterials}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (materials.length === 0) {
    return null;
  }

  const requiredCount = materials.filter(m => m.isRequired).length;
  const viewedRequiredCount = materials.filter(m => m.isRequired && m.viewed).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Pre-Course Materials
      </h3>

      {requiredCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg" role="status">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Required Materials: {viewedRequiredCount} of {requiredCount} viewed
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Please review all required materials before attending the course.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3" role="list">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            role="listitem"
          >
            <div className="flex items-start gap-3 flex-1">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {material.title}
                  </h4>
                  {material.isRequired && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                      Required
                    </span>
                  )}
                  {material.viewed && (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" aria-label="Viewed" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {material.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(material)}
              disabled={downloading}
              className="ml-4 p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Download ${material.title}`}
            >
              <Download className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};