import { apiService } from '../api.service';
import type { 
  UserStats, 
  NextCourse, 
  UpcomingCourse, 
  PreCourseMaterial 
} from '@/types/client';

class ClientPortalService {
  private basePath = '/client';

  async getDashboard(): Promise<{
    stats: UserStats;
    nextCourse: NextCourse | null;
    upcomingCourses: UpcomingCourse[];
  }> {
    const response = await apiService.get(`${this.basePath}/dashboard`);
    return response.data;
  }

  async getUpcomingCourses(): Promise<UpcomingCourse[]> {
    const response = await apiService.get(`${this.basePath}/upcoming-courses`);
    return response.data;
  }

  async getNextCourse(): Promise<NextCourse | null> {
    const response = await apiService.get(`${this.basePath}/next-course`);
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await apiService.get(`${this.basePath}/stats`);
    return response.data;
  }

  async getPreCourseMaterials(bookingId: string): Promise<PreCourseMaterial[]> {
    const response = await apiService.get(`${this.basePath}/materials/${bookingId}`);
    return response.data;
  }

  async downloadMaterial(materialId: string): Promise<void> {
    const response = await apiService.get(
      `${this.basePath}/materials/${materialId}/download`,
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `material-${materialId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async markMaterialAsViewed(materialId: string): Promise<void> {
    await apiService.put(`${this.basePath}/materials/${materialId}/viewed`);
  }

  async addToCalendar(bookingId: string): Promise<string> {
    const response = await apiService.get(`${this.basePath}/bookings/${bookingId}/calendar`);
    return response.data.icsUrl;
  }
}

export const clientPortalService = new ClientPortalService();