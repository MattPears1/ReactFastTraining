import { AxiosInstance } from "axios";
import axios from "./axios-init";

export interface CreateCourseSessionData {
  courseId: string;
  trainerId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  pricePerPerson: number;
  isOnsite?: boolean;
  onsiteClientName?: string;
  notes?: string;
}

export interface UpdateCourseSessionData
  extends Partial<CreateCourseSessionData> {
  status?:
    | "SCHEDULED"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
}

class AdminCourseSessionService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.PROD
      ? ""
      : import.meta.env.VITE_API_URL || "http://localhost:3000";

    this.api = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("adminAccessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async createSession(data: CreateCourseSessionData) {
    const response = await this.api.post("/course-sessions", data);
    return response.data;
  }

  async updateSession(sessionId: string, data: UpdateCourseSessionData) {
    const response = await this.api.patch(
      `/course-sessions/${sessionId}`,
      data,
    );
    return response.data;
  }

  async deleteSession(sessionId: string) {
    const response = await this.api.delete(`/course-sessions/${sessionId}`);
    return response.data;
  }

  async cancelSession(sessionId: string) {
    const response = await this.api.post(
      `/course-sessions/${sessionId}/cancel`,
    );
    return response.data;
  }

  async getSessionBookings(sessionId: string) {
    const response = await this.api.get(
      `/course-sessions/${sessionId}/bookings`,
    );
    return response.data;
  }

  async getSessionAvailability(sessionId: string) {
    const response = await this.api.get(
      `/course-sessions/${sessionId}/availability`,
    );
    return response.data;
  }

  async suggestAlternativeDates(data: {
    courseId: string;
    trainerId: string;
    locationId: string;
    preferredStartDate: string;
    durationDays: number;
  }) {
    const response = await this.api.post(
      "/course-sessions/suggest-dates",
      data,
    );
    return response.data;
  }
}

export const adminCourseSessionService = new AdminCourseSessionService();
