import React from "react";
import { Download } from "lucide-react";
import { useToast } from "@contexts/ToastContext";

export const ExportButtons: React.FC = () => {
  const { showToast } = useToast();

  const handleExportReport = async (format: "pdf" | "csv" | "excel") => {
    try {
      showToast(`Exporting report as ${format.toUpperCase()}...`, "info");
      // API call to generate and download report
      setTimeout(() => {
        showToast("Report exported successfully", "success");
      }, 1500);
    } catch (error) {
      showToast("Failed to export report", "error");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExportReport("pdf")}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>
      <button
        onClick={() => handleExportReport("excel")}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Excel
      </button>
    </div>
  );
};