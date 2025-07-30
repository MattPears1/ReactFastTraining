import React from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Views } from "react-big-calendar";
import { cn } from "@utils/cn";

interface CalendarToolbarProps {
  date: Date;
  view: string;
  onNavigate: (action: "prev" | "next" | "current") => void;
  onView: (view: string) => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  date,
  view,
  onNavigate,
  onView,
}) => {
  const goToBack = () => onNavigate("prev");
  const goToNext = () => onNavigate("next");
  const goToCurrent = () => onNavigate("current");

  const label = () => {
    const momentDate = moment(date);
    return (
      <span className="text-lg font-semibold">
        {view === "month" && momentDate.format("MMMM YYYY")}
        {view === "week" &&
          `Week of ${momentDate.startOf("week").format("MMM D")} - ${momentDate.endOf("week").format("MMM D, YYYY")}`}
        {view === "day" && momentDate.format("dddd, MMMM D, YYYY")}
        {view === "agenda" &&
          `${momentDate.startOf("month").format("MMM D")} - ${momentDate.endOf("month").format("MMM D, YYYY")}`}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <button
          onClick={goToBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToCurrent}
          className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Today
        </button>
        <button
          onClick={goToNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="ml-4">{label()}</div>
      </div>

      <div className="flex items-center gap-2">
        {Object.keys(Views).map((viewName) => (
          <button
            key={viewName}
            onClick={() => onView(viewName.toLowerCase())}
            className={cn(
              "px-3 py-1 text-sm rounded-lg capitalize",
              view === viewName.toLowerCase()
                ? "bg-primary-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-700",
            )}
          >
            {viewName.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
};
