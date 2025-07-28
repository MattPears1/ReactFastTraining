import { addDays, addHours, format } from 'date-fns';

export class DashboardMockDataService {
  static generateUpcomingSchedules() {
    const courses = [
      { name: 'Emergency First Aid at Work', duration: 1 },
      { name: 'First Aid at Work', duration: 3 },
      { name: 'Paediatric First Aid', duration: 2 },
      { name: 'Emergency Paediatric First Aid', duration: 1 },
      { name: 'CPR and AED', duration: 0.125 }, // 3 hours
      { name: 'Oxygen Therapy', duration: 1 },
      { name: 'Activity First Aid', duration: 1 }
    ];

    const venues = [
      'Location 1 - TBA',
      'Location 2 - TBA',  
      'Location 3 - TBA',
      'Location 4 - TBA',
      'Location 5 - TBA'
    ];

    const times = [
      '09:00 - 17:00',
      '09:30 - 16:30', 
      '10:00 - 17:00',
      '13:00 - 16:00',
      '14:00 - 17:00'
    ];
    
    const schedules = [];
    const baseDate = new Date();
    
    // Shuffle courses array to get different order
    const shuffledCourses = [...courses].sort(() => Math.random() - 0.5);
    
    // Generate 5 different upcoming schedules
    for (let i = 0; i < 5; i++) {
      const course = shuffledCourses[i % shuffledCourses.length];
      const venue = venues[i % venues.length];
      const time = times[i % times.length];
      
      // Vary the dates - some today, some in the next few days
      const daysToAdd = Math.floor(i * 1.5); // 0, 1, 3, 4, 6 days
      const scheduleDate = addDays(baseDate, daysToAdd);
      
      // Calculate current capacity to show variety
      const maxCapacity = 12;
      const currentCapacity = i === 0 ? 0 : Math.floor(Math.random() * (maxCapacity - 2)) + 1; // First one has 0, others have 1-10
      
      schedules.push({
        id: i + 1,
        courseName: course.name,
        date: format(scheduleDate, 'yyyy-MM-dd'),
        time: time,
        venue: venue,
        currentCapacity: currentCapacity,
        maxCapacity: maxCapacity
      });
    }
    
    return schedules;
  }
}