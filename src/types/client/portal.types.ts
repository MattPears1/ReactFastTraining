export interface UserStats {
  totalBookings: number;
  completedCourses: number;
  totalAttendees: number;
  certificatesEarned: number;
}

export interface NextCourse {
  booking: {
    id: string;
    bookingReference: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    createdAt: string;
  };
  session: {
    id: string;
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  };
  attendeeCount: number;
  specialRequirements?: SpecialRequirement[];
  preMaterials?: boolean;
  daysUntil: number;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean;
}

export interface UpcomingCourse {
  booking: {
    id: string;
    bookingReference: string;
    status: 'confirmed' | 'pending' | 'cancelled';
  };
  session: {
    id: string;
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  attendeeCount: number;
  specialRequirements?: SpecialRequirement[];
}

export interface SpecialRequirement {
  id: string;
  category: string;
  requirementType: string;
  details?: string;
}

export interface PreCourseMaterial {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  isRequired: boolean;
  viewed: boolean;
}

export interface ClientPortalState {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  stats: UserStats | null;
  upcomingCourses: UpcomingCourse[];
  nextCourse: NextCourse | null;
  loading: boolean;
  error: Error | null;
}