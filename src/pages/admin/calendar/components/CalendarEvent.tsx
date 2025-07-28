import React from "react";
import { Users, AlertCircle } from "lucide-react";
import { CalendarEvent } from "../types";

interface CalendarEventComponentProps {
  event: CalendarEvent;
}

export const CalendarEventComponent: React.FC<CalendarEventComponentProps> = ({
  event,
}) => {
  const { capacity, stats } = event.resource;
  const isFull = capacity.percentFull >= 100;

  return (
    <div className="h-full p-1">
      <div className="font-semibold text-xs truncate">{event.title}</div>

      <div className="flex items-center justify-between text-xs mt-1">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span className={isFull ? "font-bold" : ""}>
            {capacity.booked}/{capacity.max}
          </span>
        </div>

        {stats.hasSpecialRequirements && (
          <AlertCircle className="w-3 h-3 text-yellow-300" />
        )}
      </div>

      {stats.waitlist > 0 && (
        <div className="text-xs mt-1 opacity-75">+{stats.waitlist} waiting</div>
      )}
    </div>
  );
};
