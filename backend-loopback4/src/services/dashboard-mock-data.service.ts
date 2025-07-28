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
      'Location 1 - To be announced',
      'Location 2 - To be announced',  
      'Location 3 - To be announced',
      'Location 4 - To be announced'
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
    
    // Generate 5 different upcoming schedules
    for (let i = 0; i < 5; i++) {
      const course = courses[i % courses.length];
      const venue = venues[i % venues.length];
      const time = times[i % times.length];
      
      // Vary the dates - some today, some in the next few days
      const daysToAdd = Math.floor(i * 1.5); // 0, 1, 3, 4, 6 days
      const scheduleDate = addDays(baseDate, daysToAdd);
      
      // Calculate current capacity to show variety
      const maxCapacity = 12;
      const currentCapacity = Math.floor(Math.random() * (maxCapacity - 2)) + 2; // Between 2 and 10
      
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