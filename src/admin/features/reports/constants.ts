import { DateRange } from "./types";

export const CHART_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

export const PREDEFINED_DATE_RANGES: DateRange[] = [
  {
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
    label: "Last 7 Days",
  },
  {
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
    label: "Last 30 Days",
  },
  {
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    end: new Date(),
    label: "Last 3 Months",
  },
  {
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date(),
    label: "Last 6 Months",
  },
  {
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
    label: "Year to Date",
  },
];

export const MOCK_COURSE_PERFORMANCE = [
  {
    name: "Emergency First Aid",
    sessions: 24,
    attendees: 216,
    avg: 9.0,
    revenue: 18300,
    completion: 95.5,
  },
  {
    name: "Paediatric First Aid",
    sessions: 18,
    attendees: 144,
    avg: 8.0,
    revenue: 13725,
    completion: 93.8,
  },
  {
    name: "First Aid at Work",
    sessions: 15,
    attendees: 120,
    avg: 8.0,
    revenue: 9150,
    completion: 94.2,
  },
  {
    name: "Mental Health",
    sessions: 7,
    attendees: 62,
    avg: 8.9,
    revenue: 4575,
    completion: 92.1,
  },
];