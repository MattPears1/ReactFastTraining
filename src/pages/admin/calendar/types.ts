// Calendar types
import { Views } from "react-big-calendar";

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

export type CalendarView = (typeof Views)[keyof typeof Views];

export interface EventStyleResult {
  style: React.CSSProperties;
}

export interface DateRange {
  start: Date;
  end: Date;
}
