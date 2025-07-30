// Calendar constants
export const BUSINESS_HOURS = {
  START: 8,
  END: 18,
} as const;

export const CAPACITY_THRESHOLDS = {
  FULL: 100,
  NEARLY_FULL: 75,
  FILLING: 50,
} as const;

export const EVENT_COLORS = {
  AVAILABLE: "#10B981", // Green
  FILLING: "#3B82F6", // Blue
  NEARLY_FULL: "#F59E0B", // Amber
  FULL: "#EF4444", // Red
  COMPLETED: "#8B5CF6", // Purple
  CANCELLED: "#6B7280", // Gray
} as const;

export const COURSE_TYPES = [
  { value: "", label: "All Course Types" },
  { value: "EFAW", label: "Emergency First Aid at Work" },
  { value: "FAW", label: "First Aid at Work" },
  { value: "Paediatric", label: "Paediatric First Aid" },
  { value: "Mental Health", label: "Mental Health First Aid" },
] as const;

export const LOCATIONS = [
  { value: "", label: "All Locations" },
  { value: "Leeds Training Center", label: "Leeds Training Center" },
  { value: "Sheffield Venue", label: "Sheffield Venue" },
  { value: "Bradford Office", label: "Bradford Office" },
  { value: "Client Site", label: "Client Site" },
] as const;

export const INSTRUCTORS = [
  { value: "", label: "All Instructors" },
  { value: "John Smith", label: "John Smith" },
  { value: "Sarah Johnson", label: "Sarah Johnson" },
  { value: "Mike Wilson", label: "Mike Wilson" },
] as const;