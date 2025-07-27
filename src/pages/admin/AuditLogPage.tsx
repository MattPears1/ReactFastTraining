import React from 'react';
import { FileText, Shield } from 'lucide-react';

const AuditLogPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Audit Log
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track all system activities and changes
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Audit Logging Coming Soon
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This feature will track all administrative actions, changes, and system access for security and compliance.
          </p>
        </div>
      </div>

      {/* Sample Audit Entry */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Sample Audit Entry Format
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-gray-500 dark:text-gray-400 w-32">2025-01-27 14:32</span>
            <span className="text-gray-900 dark:text-white">Admin created new session for Emergency First Aid at Work</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-500 dark:text-gray-400 w-32">2025-01-27 14:15</span>
            <span className="text-gray-900 dark:text-white">Admin marked attendance for session #123</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-500 dark:text-gray-400 w-32">2025-01-27 13:45</span>
            <span className="text-gray-900 dark:text-white">Admin cancelled session due to trainer unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;