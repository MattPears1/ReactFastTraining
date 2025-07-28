import React from 'react';
import { FilterState } from '../types';

interface CalendarFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={filters.courseType}
          onChange={(e) => onChange({ ...filters, courseType: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Course Types</option>
          <option value="EFAW">Emergency First Aid at Work</option>
          <option value="FAW">First Aid at Work</option>
          <option value="Paediatric">Paediatric First Aid</option>
          <option value="Mental Health">Mental Health First Aid</option>
        </select>
        
        <select
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Locations</option>
          <option value="Leeds Training Center">Leeds Training Center</option>
          <option value="Sheffield Venue">Sheffield Venue</option>
          <option value="Bradford Office">Bradford Office</option>
          <option value="Client Site">Client Site</option>
        </select>
        
        <select
          value={filters.instructor}
          onChange={(e) => onChange({ ...filters, instructor: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Instructors</option>
          <option value="John Smith">John Smith</option>
          <option value="Sarah Johnson">Sarah Johnson</option>
          <option value="Mike Wilson">Mike Wilson</option>
        </select>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onChange({ courseType: '', location: '', instructor: '' })}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};