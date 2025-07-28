import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Users,
  Clock,
  PoundSterling,
  Calendar,
  Download,
  BookOpen,
  TrendingUp,
  Award,
  AlertCircle,
  Star,
  FileText,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { SearchInput } from "../../../components/ui/SearchInput";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import { AdminEmptyState } from "../../components/ui/AdminEmptyState";
import { adminApi } from "../../utils/api";
import { CourseModal } from "./components/CourseModal";
import { useNotifications } from "../../contexts/NotificationContext";
import { format } from "date-fns";
import "../../styles/admin-design-system.css";

interface Course {
  id: number;
  name: string;
  description?: string;
  courseType: string;
  category: string;
  duration: string;
  durationHours: number;
  price: number;
  maxCapacity: number;
  minAttendees?: number;
  certificationValidityYears: number;
  learningOutcomes?: string[];
  prerequisites?: string;
  includedMaterials?: string[];
  targetAudience?: string;
  accreditationBody?: string;
  accreditationNumber?: string;
  isActive: boolean;
  isFeatured?: boolean;
  earlyBirdDiscountPercentage?: number;
  earlyBirdDaysBefore?: number;
  groupDiscountPercentage?: number;
  groupSizeMinimum?: number;
  cancellationPolicy?: string;
  slug?: string;
  averageRating?: number;
  totalReviews?: number;
  // Statistics from the view
  totalBookings?: number;
  uniqueStudents?: number;
  totalRevenue?: number;
  averageBookingValue?: number;
  totalSessions?: number;
  completedSessions?: number;
  upcomingSessions?: number;
  averageFillRate?: number;
  lastBookingDate?: string;
  firstSessionDate?: string;
  lastSessionDate?: string;
}

export const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // Fetch courses from API
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter courses locally
  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];

    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.courseType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.accreditationBody
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((course) =>
        statusFilter === "active" ? course.isActive : !course.isActive,
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (course) => course.category === categoryFilter,
      );
    }

    return filtered;
  }, [courses, searchTerm, statusFilter, categoryFilter]);

  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await adminApi.delete(`/api/admin/courses/${courseId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete course");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      addNotification({
        type: "success",
        title: "Course deleted successfully",
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: "error",
        title: "Failed to delete course",
        message: error.message,
      });
    },
  });

  const handleDelete = (course: Course) => {
    const confirmMessage =
      course.upcomingSessions && course.upcomingSessions > 0
        ? `This course has ${course.upcomingSessions} upcoming sessions. Are you sure you want to delete it?`
        : "Are you sure you want to delete this course?";

    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(course.id);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingCourse(null);
  };

  const handleModalSave = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    addNotification({
      type: "success",
      title: editingCourse
        ? "Course updated successfully"
        : "Course created successfully",
    });
    handleModalClose();
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.get("/api/admin/courses/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `courses_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification({
        type: "success",
        title: "Courses exported successfully",
      });
    } catch (error) {
      addNotification({ type: "error", title: "Export failed" });
    }
  };

  const getCategoryVariant = (
    category: string,
  ): "primary" | "secondary" | "neutral" => {
    switch (category) {
      case "workplace":
        return "primary";
      case "paediatric":
        return "secondary";
      case "requalification":
        return "neutral";
      default:
        return "neutral";
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load courses</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">
            Please try refreshing the page
          </p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Course Management</h1>
            <p className="admin-page-subtitle">
              Manage your training courses, pricing, and availability
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus className="admin-icon-sm" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Categories</option>
              <option value="workplace">Workplace</option>
              <option value="paediatric">Paediatric</option>
              <option value="specialist">Specialist</option>
              <option value="requalification">Requalification</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="admin-btn admin-btn-secondary"
            >
              <Download className="admin-icon-sm" />
              Export
            </button>
          </div>
        </div>
      </AdminCard>

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses?.map((course) => (
          <AdminCard key={course.id} className="admin-hover-lift relative">
            {course.isFeatured && (
              <div className="absolute -top-2 -right-2 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Featured
              </div>
            )}

            <div className="flex items-start justify-between admin-mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <AdminBadge variant={getCategoryVariant(course.category)}>
                    {course.category}
                  </AdminBadge>
                  {course.accreditationBody && (
                    <AdminBadge variant="secondary">
                      <Award className="w-3 h-3 mr-1" />
                      {course.accreditationBody}
                    </AdminBadge>
                  )}
                </div>
              </div>
              <AdminBadge variant={course.isActive ? "success" : "neutral"}>
                {course.isActive ? "Active" : "Inactive"}
              </AdminBadge>
            </div>

            {/* Course Type and Duration */}
            <div className="admin-mb-4">
              <p className="admin-text-small font-medium text-gray-700">
                {course.courseType}
              </p>
              <p className="admin-text-small admin-text-muted">
                {course.duration} • {course.durationHours} hours
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 admin-mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center admin-text-small admin-text-muted">
                  <PoundSterling className="admin-icon-sm mr-1.5 text-primary-500" />
                  Price
                </div>
                <p className="font-semibold text-lg">£{course.price}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center admin-text-small admin-text-muted">
                  <Users className="admin-icon-sm mr-1.5 text-primary-500" />
                  Students
                </div>
                <p className="font-semibold text-lg">
                  {course.uniqueStudents || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center admin-text-small admin-text-muted">
                  <TrendingUp className="admin-icon-sm mr-1.5 text-primary-500" />
                  Fill Rate
                </div>
                <p className="font-semibold text-lg">
                  {course.averageFillRate
                    ? `${Math.round(course.averageFillRate)}%`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center admin-text-small admin-text-muted">
                  <PoundSterling className="admin-icon-sm mr-1.5 text-primary-500" />
                  Revenue
                </div>
                <p className="font-semibold text-lg">
                  £{(course.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Rating and Reviews */}
            {course.totalReviews && course.totalReviews > 0 && (
              <div className="flex items-center admin-mb-4">
                <div className="flex items-center mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(course.averageRating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="admin-text-small admin-text-muted">
                  {course.averageRating?.toFixed(1)} ({course.totalReviews}{" "}
                  reviews)
                </span>
              </div>
            )}

            {/* Session Information */}
            <div className="border-t border-gray-200 pt-3 admin-mb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="admin-text-small admin-text-muted">Total</p>
                  <p className="font-semibold">{course.totalSessions || 0}</p>
                </div>
                <div>
                  <p className="admin-text-small admin-text-muted">Completed</p>
                  <p className="font-semibold text-green-600">
                    {course.completedSessions || 0}
                  </p>
                </div>
                <div>
                  <p className="admin-text-small admin-text-muted">Upcoming</p>
                  <p className="font-semibold text-blue-600">
                    {course.upcomingSessions || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Discounts */}
            {(course.earlyBirdDiscountPercentage ||
              course.groupDiscountPercentage) && (
              <div className="flex gap-2 admin-mb-4">
                {course.earlyBirdDiscountPercentage > 0 && (
                  <span className="admin-text-small bg-green-100 text-green-800 px-2 py-1 rounded">
                    Early Bird: {course.earlyBirdDiscountPercentage}% off
                  </span>
                )}
                {course.groupDiscountPercentage > 0 && (
                  <span className="admin-text-small bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Group: {course.groupDiscountPercentage}% off
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="admin-text-small admin-text-muted">
                    Last booking:{" "}
                    {course.lastBookingDate
                      ? format(new Date(course.lastBookingDate), "dd MMM yyyy")
                      : "Never"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(course)}
                    className="admin-btn admin-btn-secondary p-2"
                    title="Edit"
                  >
                    <Edit3 className="admin-icon-sm" />
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="admin-btn admin-btn-secondary p-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 className="admin-icon-sm" />
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Empty state */}
      {filteredCourses?.length === 0 && (
        <AdminCard>
          <AdminEmptyState
            icon={BookOpen}
            title="No courses found"
            description={
              searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first course"
            }
            action={
              !searchTerm &&
              statusFilter === "all" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="admin-btn admin-btn-primary"
                >
                  <Plus className="admin-icon-sm" />
                  Add Course
                </button>
              )
            }
          />
        </AdminCard>
      )}

      {/* Course Modal */}
      {showCreateModal && (
        <CourseModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          course={editingCourse}
          mode={editingCourse ? "edit" : "create"}
        />
      )}
    </div>
  );
};
