import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Info,
  CheckCircle,
  Download,
  RefreshCw,
  Mail,
} from "lucide-react";
import { api } from "@/services/api.service";
import { Button } from "@/components/ui/Button";

interface RequirementWithBooking {
  requirement: {
    id: string;
    category: string;
    requirementType: string;
    details: string;
    priority: "critical" | "high" | "standard";
    instructorNotified: boolean;
  };
  booking: {
    id: string;
    bookingReference: string;
  };
  attendee: {
    name: string;
    email: string;
  };
}

interface SessionRequirements {
  critical: RequirementWithBooking[];
  high: RequirementWithBooking[];
  standard: RequirementWithBooking[];
}

interface RequirementsDashboardProps {
  sessionId: string;
}

export const RequirementsDashboard: React.FC<RequirementsDashboardProps> = ({
  sessionId,
}) => {
  const [requirements, setRequirements] = useState<SessionRequirements | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    loadRequirements();
  }, [sessionId]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/admin/sessions/${sessionId}/requirements`,
      );
      setRequirements(response.data);
    } catch (error) {
      console.error("Failed to load requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  const notifyInstructor = async () => {
    setNotifying(true);
    try {
      await api.post(`/api/admin/sessions/${sessionId}/notify-requirements`);
      // Refresh to update notification status
      await loadRequirements();
    } catch (error) {
      console.error("Failed to notify instructor:", error);
    } finally {
      setNotifying(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get(
        `/api/admin/sessions/${sessionId}/requirements-report`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `requirements-${sessionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!requirements) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No requirements data available</p>
      </div>
    );
  }

  const totalCount =
    requirements.critical.length +
    requirements.high.length +
    requirements.standard.length;

  if (totalCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <p className="text-green-800 font-medium">No Special Requirements</p>
        <p className="text-green-700 text-sm mt-1">
          No attendees have reported special requirements for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Special Requirements Summary
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={loadRequirements}
              variant="secondary"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={exportReport} variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">
              {requirements.critical.length}
            </div>
            <p className="text-sm text-red-700">Critical</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">
              {requirements.high.length}
            </div>
            <p className="text-sm text-yellow-700">High Priority</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {requirements.standard.length}
            </div>
            <p className="text-sm text-blue-700">Standard</p>
          </div>
        </div>

        {/* Critical Requirements */}
        {requirements.critical.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">
                Critical Requirements
              </h4>
              {requirements.critical.some(
                (r) => !r.requirement.instructorNotified,
              ) && (
                <Button
                  onClick={notifyInstructor}
                  variant="danger"
                  size="sm"
                  disabled={notifying}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {notifying ? "Notifying..." : "Notify Instructor"}
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {requirements.critical.map((req) => (
                <RequirementCard
                  key={req.requirement.id}
                  requirement={req}
                  priority="critical"
                />
              ))}
            </div>
          </div>
        )}

        {/* High Priority Requirements */}
        {requirements.high.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">High Priority</h4>
            </div>
            <div className="space-y-3">
              {requirements.high.map((req) => (
                <RequirementCard
                  key={req.requirement.id}
                  requirement={req}
                  priority="high"
                />
              ))}
            </div>
          </div>
        )}

        {/* Standard Requirements */}
        {requirements.standard.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Standard Requirements</h4>
            <div className="space-y-3">
              {requirements.standard.map((req) => (
                <RequirementCard
                  key={req.requirement.id}
                  requirement={req}
                  priority="standard"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Items Checklist */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          Preparation Checklist
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-1" />
            <label htmlFor="check-1">
              Ensure venue accessibility for wheelchair users
            </label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-2" />
            <label htmlFor="check-2">
              Prepare dietary-appropriate refreshments
            </label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-3" />
            <label htmlFor="check-3">
              Have emergency protocols ready for medical needs
            </label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-4" />
            <label htmlFor="check-4">
              Brief any assistants on special requirements
            </label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-5" />
            <label htmlFor="check-5">
              Check hearing loop and accessibility equipment
            </label>
          </li>
        </ul>
      </div>
    </div>
  );
};

const RequirementCard: React.FC<{
  requirement: RequirementWithBooking;
  priority: "critical" | "high" | "standard";
}> = ({ requirement, priority }) => {
  const priorityColors = {
    critical: "border-red-300 bg-red-50",
    high: "border-yellow-300 bg-yellow-50",
    standard: "border-gray-300 bg-gray-50",
  };

  const categoryIcons = {
    accessibility: "♿",
    dietary: "🍽️",
    medical: "🏥",
    other: "📋",
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[priority]}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium flex items-center gap-2">
            <span className="text-xl">
              {categoryIcons[requirement.requirement.category] || "📋"}
            </span>
            {requirement.attendee.name}
          </p>
          <p className="text-sm text-gray-600">
            Booking: {requirement.booking.bookingReference}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {requirement.requirement.instructorNotified && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Notified
            </span>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              priority === "critical"
                ? "bg-red-100 text-red-800"
                : priority === "high"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm">
          <strong className="capitalize">
            {requirement.requirement.category}:
          </strong>{" "}
          {requirement.requirement.requirementType.replace(/_/g, " ")}
        </p>
        {requirement.requirement.details && (
          <p className="text-sm text-gray-700 italic bg-white bg-opacity-50 p-2 rounded">
            "{requirement.requirement.details}"
          </p>
        )}
      </div>
    </div>
  );
};
