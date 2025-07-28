import React from 'react';

export const CalendarLegend: React.FC = () => {
  const legendItems = [
    { color: 'bg-green-500', label: 'Available' },
    { color: 'bg-blue-500', label: 'Filling Up' },
    { color: 'bg-amber-500', label: 'Nearly Full' },
    { color: 'bg-red-500', label: 'Full' },
    { color: 'bg-purple-500', label: 'Completed' },
    { color: 'bg-gray-500', label: 'Cancelled' }
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
      {legendItems.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${color}`}></div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};