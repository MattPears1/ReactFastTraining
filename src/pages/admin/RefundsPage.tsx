import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';

const RefundsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Refunds & Cancellations
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Process refunds and manage cancellation requests
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Refund Management Coming Soon
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This feature will allow you to process refunds and manage cancellation requests.
          </p>
        </div>
      </div>

      {/* Refund Policy */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Refund Policy
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              • Full refund if cancelled 7+ days before course<br />
              • 50% refund if cancelled 3-6 days before course<br />
              • No refund if cancelled less than 3 days before course<br />
              • Medical emergencies considered on case-by-case basis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundsPage;