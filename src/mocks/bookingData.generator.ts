import { CourseSchedule, CourseTypeCode, VenueCode } from '@/types/booking.types';
import { COURSE_TYPE_CONFIG } from '@/config/courseTypes.config';
import { VENUE_CONFIG } from '@/config/venues.config';

export const generateMockSchedules = (): CourseSchedule[] => {
  const schedules: CourseSchedule[] = [];
  let id = 1;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // Start from next week
  
  // Generate schedules for each course type
  Object.keys(COURSE_TYPE_CONFIG).forEach((courseTypeCode) => {
    const courseType = courseTypeCode as CourseTypeCode;
    const courseConfig = COURSE_TYPE_CONFIG[courseType];
    
    // Generate 2-3 sessions per course type across different venues
    const venues = Object.keys(VENUE_CONFIG) as VenueCode[];
    const sessionsCount = Math.floor(Math.random() * 2) + 2; // 2-3 sessions
    
    for (let i = 0; i < sessionsCount; i++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(sessionDate.getDate() + (id * 3)); // Space out sessions
      
      // Set appropriate start and end times based on duration
      const startHour = 9; // 9 AM start
      sessionDate.setHours(startHour, 0, 0, 0);
      
      const endDate = new Date(sessionDate);
      if (courseConfig.duration.includes('Half Day')) {
        endDate.setHours(13, 0, 0, 0); // 1 PM end for half day
      } else {
        endDate.setHours(17, 0, 0, 0); // 5 PM end for full day
      }
      
      const venueCode = venues[i % venues.length];
      const venue = VENUE_CONFIG[venueCode];
      
      // Randomize available spots
      const maxParticipants = 12;
      const bookedSpots = Math.floor(Math.random() * 8);
      const availableSpots = maxParticipants - bookedSpots;
      
      schedules.push({
        id: id++,
        courseType,
        courseName: courseConfig.name,
        startDate: sessionDate.toISOString(),
        endDate: endDate.toISOString(),
        venue: venueCode,
        venueName: venue.name,
        venueAddress: `${venue.address}, ${venue.city}`,
        availableSpots,
        maxParticipants,
        pricePerPerson: courseConfig.price,
        instructorName: 'Lex'
      });
    }
  });
  
  // Add some additional popular course sessions
  const popularCourses: CourseTypeCode[] = ['EFAW', 'FAW', 'PAEDIATRIC'];
  popularCourses.forEach(courseType => {
    const courseConfig = COURSE_TYPE_CONFIG[courseType];
    const extraDate = new Date(startDate);
    extraDate.setDate(extraDate.getDate() + 45); // Future date
    extraDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(extraDate);
    endDate.setHours(17, 0, 0, 0);
    
    schedules.push({
      id: id++,
      courseType,
      courseName: courseConfig.name,
      startDate: extraDate.toISOString(),
      endDate: endDate.toISOString(),
      venue: 'SHEFFIELD',
      venueName: VENUE_CONFIG.SHEFFIELD.name,
      venueAddress: `${VENUE_CONFIG.SHEFFIELD.address}, ${VENUE_CONFIG.SHEFFIELD.city}`,
      availableSpots: 12,
      maxParticipants: 12,
      pricePerPerson: courseConfig.price,
      instructorName: 'Lex'
    });
  });
  
  return schedules;
};