// Calendar utilities
import moment from "moment";
import { CalendarEvent, EventStyleResult } from "./types";
import { CAPACITY_THRESHOLDS, EVENT_COLORS } from "./constants";

export const getRange = (date: Date, view: string) => {
  const start = moment(date)
    .startOf(view as any)
    .toDate();
  const end = moment(date)
    .endOf(view as any)
    .toDate();
  return { start, end };
};

export const getEventStyle = (event: CalendarEvent): EventStyleResult => {
  const { capacity, status } = event.resource;

  let backgroundColor = EVENT_COLORS.AVAILABLE;
  if (status === "cancelled") {
    backgroundColor = EVENT_COLORS.CANCELLED;
  } else if (status === "completed") {
    backgroundColor = EVENT_COLORS.COMPLETED;
  } else if (capacity.percentFull >= CAPACITY_THRESHOLDS.FULL) {
    backgroundColor = EVENT_COLORS.FULL;
  } else if (capacity.percentFull >= CAPACITY_THRESHOLDS.NEARLY_FULL) {
    backgroundColor = EVENT_COLORS.NEARLY_FULL;
  } else if (capacity.percentFull >= CAPACITY_THRESHOLDS.FILLING) {
    backgroundColor = EVENT_COLORS.FILLING;
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

export const getCapacityStatusColor = (percentFull: number): string => {
  if (percentFull >= CAPACITY_THRESHOLDS.FULL) return "bg-red-500";
  if (percentFull >= CAPACITY_THRESHOLDS.NEARLY_FULL) return "bg-amber-500";
  if (percentFull >= CAPACITY_THRESHOLDS.FILLING) return "bg-blue-500";
  return "bg-green-500";
};