import React from "react";
import { useNavigate } from "react-router-dom";
import { CourseCreationForm } from "@components/admin/CourseCreationForm";
import { ArrowLeft } from "lucide-react";

const CreateSessionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to calendar or sessions list after successful creation
    navigate("/admin/calendar");
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Session
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Schedule a new first aid training session
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <CourseCreationForm onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 max-w-2xl">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Quick Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Maximum capacity is 12 participants per session</li>
            <li>• Sessions are limited to single-day courses (max 6 hours)</li>
            <li>• Only Location A and Location B are available</li>
            <li>• Recurring sessions will skip dates with conflicts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionPage;
