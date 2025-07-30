import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/api";
import { SessionDetail, Course, Venue } from "../types";

export const useSessionDetail = (sessionId: string, isOpen: boolean, isNewSession: boolean) => {
  return useQuery<SessionDetail>({
    queryKey: ["admin-session-details", sessionId],
    queryFn: async () => {
      if (isNewSession) return null;
      const response = await adminApi.get(`/api/admin/schedules/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session details");
      return response.json();
    },
    enabled: isOpen && !isNewSession,
  });
};

export const useCourses = (enabled: boolean) => {
  return useQuery<Course[]>({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
    enabled,
  });
};

export const useVenues = (enabled: boolean) => {
  return useQuery<Venue[]>({
    queryKey: ["admin-venues"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/venues");
      if (!response.ok) throw new Error("Failed to fetch venues");
      return response.json();
    },
    enabled,
  });
};