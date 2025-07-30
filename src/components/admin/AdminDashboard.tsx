import React, { useState, useEffect } from "react";
import { CourseCreationForm } from "./CourseCreationForm";
import { AttendanceMarking } from "./AttendanceMarking";
import apiClient from "@services/api/client";
import { adminApi } from "@services/api/admin.service";
import { useWebSocket } from "@hooks/useWebSocket";
import {
  Calendar,
  Users,
  Plus,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@utils/cn";

interface SessionWithDetails {
  id: string;
  courseId: string;
  courseName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName: string;
  currentParticipants: number;
  maxParticipants: number;
  status: string;
  attendanceMarked?: boolean;
}

interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  totalBookings: number;
  averageAttendance: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "create" | "attendance" | "overview"
  >("overview");
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<SessionWithDetails | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    totalBookings: 0,
    averageAttendance: 0,
  });
  const [loading, setLoading] = useState(true);

  const { isConnected } = useWebSocket({
    onSessionUpdate: () => {
      loadSessions();
    },
    onCapacityUpdate: () => {
      loadSessions();
    },
  });

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await apiClient.get("/courses/sessions", {
        params: {
          includeDetails: true,
          limit: 50,
        },
      });

      // Sort sessions by date, upcoming first
      const sortedSessions = response.data.sort(
        (a: any, b: any) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

      setSessions(sortedSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [sessionsStats, bookingsStats] = await Promise.all([
        adminApi.getSessionStats(),
        adminApi.getBookingStats(),
      ]);

      setStats({
        totalSessions: sessionsStats.total || 0,
        upcomingSessions: sessionsStats.upcoming || 0,
        completedSessions: sessionsStats.completed || 0,
        totalBookings: bookingsStats.total || 0,
        averageAttendance: bookingsStats.averageAttendance || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSessionCreated = () => {
    loadSessions();
    loadStats();
  };

  const handleAttendanceUpdated = () => {
    loadSessions();
    loadStats();
  };

  const upcomingSessions = sessions.filter(
    (s) => new Date(s.startDate) >= new Date() && s.status !== "CANCELLED",
  );

  const pastSessions = sessions.filter(
    (s) => new Date(s.startDate) < new Date() && s.status !== "CANCELLED",
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage courses and track attendance
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === "overview"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={cn(
                "pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === "create"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              Create Session
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={cn(
                "pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === "attendance"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalSessions}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.upcomingSessions}
                    </p>
                  </div>
                  <ClipboardCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalBookings}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.averageAttendance}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Sessions
                </h2>
              </div>
              <div className="divide-y">
                {upcomingSessions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No upcoming sessions
                  </div>
                ) : (
                  upcomingSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab("attendance");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {session.courseName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>
                              {new Date(session.startDate).toLocaleDateString(
                                "en-GB",
                              )}
                            </span>
                            <span>
                              {session.startTime} - {session.endTime}
                            </span>
                            <span>{session.locationName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {session.currentParticipants}/
                              {session.maxParticipants}
                            </p>
                            <p className="text-xs text-gray-500">Booked</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Create New Session
              </h2>
              <CourseCreationForm onSuccess={handleSessionCreated} />
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div>
            {selectedSession ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  ← Back to session list
                </button>

                <AttendanceMarking
                  sessionId={selectedSession.id}
                  sessionDate={new Date(selectedSession.startDate)}
                  courseName={selectedSession.courseName}
                  onUpdate={handleAttendanceUpdated}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select a Session
                </h2>

                {/* Past Sessions (need attendance) */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="font-medium text-gray-900">
                      Past Sessions Requiring Attendance
                    </h3>
                  </div>
                  <div className="divide-y">
                    {pastSessions.filter((s) => !s.attendanceMarked).length ===
                    0 ? (
                      <div className="p-6 text-center text-gray-500">
                        All attendance marked
                      </div>
                    ) : (
                      pastSessions
                        .filter((s) => !s.attendanceMarked)
                        .map((session) => (
                          <div
                            key={session.id}
                            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {session.courseName}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span>
                                    {new Date(
                                      session.startDate,
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                  <span>
                                    {session.startTime} - {session.endTime}
                                  </span>
                                  <span className="flex items-center gap-1 text-yellow-600">
                                    <AlertCircle className="w-4 h-4" />
                                    Attendance required
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* All Sessions */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="font-medium text-gray-900">All Sessions</h3>
                  </div>
                  <div className="divide-y">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {session.courseName}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>
                                {new Date(session.startDate).toLocaleDateString(
                                  "en-GB",
                                )}
                              </span>
                              <span>
                                {session.startTime} - {session.endTime}
                              </span>
                              <span>
                                {session.currentParticipants}/
                                {session.maxParticipants} booked
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">Real-time updates paused</p>
        </div>
      )}
    </div>
  );
};
