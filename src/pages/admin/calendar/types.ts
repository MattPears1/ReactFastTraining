export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    sessionId: string;
    courseType: string;
    location: string;
    instructor: string;
    capacity: {
      max: number;
      booked: number;
      available: number;
      percentFull: number;
      status: "available" | "filling" | "nearly-full" | "full";
    };
    stats: {
      bookings: number;
      revenue: number;
      waitlist: number;
      hasSpecialRequirements: boolean;
    };
    status: string;
  };
}

export interface FilterState {
  courseType: string;
  location: string;
  instructor: string;
}

export interface CalendarRange {
  start: Date;
  end: Date;
}