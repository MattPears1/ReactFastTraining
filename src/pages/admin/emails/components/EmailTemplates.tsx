import React from "react";
import { Edit2, Trash2, Copy, MoreVertical } from "lucide-react";
import { EmailTemplate, EmailFilters } from "../types";
import { cn } from "@utils/cn";

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  filters: EmailFilters;
  onEdit: (template: EmailTemplate) => void;
  onDuplicate: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
}

export const EmailTemplates: React.FC<EmailTemplatesProps> = ({
  templates,
  filters,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  // Filter templates based on search and filters
  const filteredTemplates = templates.filter((template) => {
    if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !template.subject.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && template.category !== filters.category) {
      return false;
    }
    if (filters.status && template.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "booking":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "reminder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "marketing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Modified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {template.subject}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    getCategoryColor(template.category)
                  )}>
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(template.lastModified).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {template.timesUsed}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    template.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  )}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(template)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicate(template)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(template)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};