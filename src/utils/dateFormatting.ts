export const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Same day
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  // Different days
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const formatCourseSchedule = (startDate: string | Date, endDate: string | Date): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Same day
  if (start.toDateString() === end.toDateString()) {
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  }
  
  // Multiple days
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};

export const getDurationInHours = (startDate: string | Date, endDate: string | Date): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
};

export const isDateInPast = (date: string | Date): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < now;
};

export const daysUntil = (date: string | Date): number => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffMs = targetDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const formatCountdown = (date: string | Date): string => {
  const days = daysUntil(date);
  
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  if (days <= 30) return `In ${Math.floor(days / 7)} weeks`;
  
  return formatDate(date);
};