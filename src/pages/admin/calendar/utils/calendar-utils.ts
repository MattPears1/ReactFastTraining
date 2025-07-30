import moment from "moment";
import { Views } from "react-big-calendar";
import { CalendarRange } from "../types";

export const getRange = (date: Date, view: string): CalendarRange => {
  const mDate = moment(date);
  let start: Date;
  let end: Date;

  switch (view) {
    case Views.MONTH:
      start = mDate.clone().startOf("month").startOf("week").toDate();
      end = mDate.clone().endOf("month").endOf("week").toDate();
      break;
    case Views.WEEK:
      start = mDate.clone().startOf("week").toDate();
      end = mDate.clone().endOf("week").toDate();
      break;
    case Views.DAY:
      start = mDate.clone().startOf("day").toDate();
      end = mDate.clone().endOf("day").toDate();
      break;
    case Views.AGENDA:
      start = mDate.clone().toDate();
      end = mDate.clone().add(1, "month").toDate();
      break;
    default:
      start = mDate.clone().startOf("month").toDate();
      end = mDate.clone().endOf("month").toDate();
  }

  return { start, end };
};

export const getEventStyle = (event: any) => {
  const { status } = event.resource.capacity;
  
  const baseStyle = {
    fontSize: "0.875rem",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
  };

  switch (status) {
    case "available":
      return {
        ...baseStyle,
        backgroundColor: "#10b981",
        borderColor: "#059669",
      };
    case "filling":
      return {
        ...baseStyle,
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
      };
    case "nearly-full":
      return {
        ...baseStyle,
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
      };
    case "full":
      return {
        ...baseStyle,
        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
      };
    default:
      return baseStyle;
  }
};

export const filterEvents = (events: any[], filters: any) => {
  return events.filter((event) => {
    const { courseType, location, instructor } = filters;
    const resource = event.resource;

    if (courseType && resource.courseType !== courseType) return false;
    if (location && resource.location !== location) return false;
    if (instructor && resource.instructor !== instructor) return false;

    return true;
  });
};