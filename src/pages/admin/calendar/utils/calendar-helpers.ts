import moment from "moment";
import { CalendarEvent, EventStyleResult, DateRange } from "../types";

export const getRange = (date: Date, view: string): DateRange => {
  const start = moment(date)
    .startOf(view as any)
    .toDate();
  const end = moment(date)
    .endOf(view as any)
    .toDate();
  return { start, end };
};

export const eventStyleGetter = (event: CalendarEvent): EventStyleResult => {
  const { capacity, status } = event.resource;

  let backgroundColor = "#10B981"; // Green - available
  if (status === "cancelled") {
    backgroundColor = "#6B7280"; // Gray
  } else if (status === "completed") {
    backgroundColor = "#8B5CF6"; // Purple
  } else if (capacity.percentFull >= 100) {
    backgroundColor = "#EF4444"; // Red - full
  } else if (capacity.percentFull >= 75) {
    backgroundColor = "#F59E0B"; // Amber - nearly full
  } else if (capacity.percentFull >= 50) {
    backgroundColor = "#3B82F6"; // Blue - filling
  }

  return {
    style: {
      backgroundColor,
      borderRadius: "8px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      fontSize: "12px",
      padding: "2px 4px",
    },
  };
};
