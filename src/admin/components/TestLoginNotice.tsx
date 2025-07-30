import React from "react";
import { AlertCircle } from "lucide-react";

export const TestLoginNotice: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md flex items-center gap-2 z-50">
      <AlertCircle className="h-5 w-5" />
      <span className="text-sm font-medium">TEST MODE: Login bypassed</span>
    </div>
  );
};