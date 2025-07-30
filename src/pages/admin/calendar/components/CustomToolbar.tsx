// Custom calendar toolbar component
import React from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Views } from "react-big-calendar";
import { cn } from "@utils/cn";

interface CustomToolbarProps {
  date: Date;
  view: string;
  onNavigate: (action: string) => void;
  onView: (view: string) => void;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = (toolbar: any) => {
  const goToBack = () => {
    toolbar.date = moment(toolbar.date).subtract(1, toolbar.view).toDate();
    toolbar.onNavigate("prev");
  };

  const goToNext = () => {
    toolbar.date = moment(toolbar.date).add(1, toolbar.view).toDate();
    toolbar.onNavigate("next");
  };

  const goToCurrent = () => {
    toolbar.date = new Date();
    toolbar.onNavigate("current");
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-lg font-semibold">
        {toolbar.view === "month" && date.format("MMMM YYYY")}
        {toolbar.view === "week" &&
          `Week of ${date.startOf("week").format("MMM D")} - ${date.endOf("week").format("MMM D, YYYY")}`}
        {toolbar.view === "day" && date.format("dddd, MMMM D, YYYY")}
        {toolbar.view === "agenda" &&
          `${date.startOf("month").format("MMM D")} - ${date.endOf("month").format("MMM D, YYYY")}`}
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
        {Object.keys(Views).map((view) => (
          <button
            key={view}
            onClick={() => toolbar.onView(view.toLowerCase())}
            className={cn(
              "px-3 py-1 text-sm rounded-lg capitalize",
              toolbar.view === view.toLowerCase()
                ? "bg-primary-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            {view.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
};