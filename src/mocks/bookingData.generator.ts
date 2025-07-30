import {
  CourseSchedule,
  CourseTypeCode,
  VenueCode,
} from "@/types/booking.types";
import { COURSE_TYPE_CONFIG } from "@/config/courseTypes.config";
import { VENUE_CONFIG } from "@/config/venues.config";

export const generateMockSchedules = (): CourseSchedule[] => {
  const schedules: CourseSchedule[] = [];
  let id = 1;

  // Start from July 28th, 2025
  const startDate = new Date("2025-07-28");

  const venues = Object.keys(VENUE_CONFIG) as VenueCode[];
  const courseTypes = Object.keys(COURSE_TYPE_CONFIG) as CourseTypeCode[];

  // Generate courses for the next 60 days with multiple courses per day
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    // Skip Sundays (day 0)
    if (currentDate.getDay() === 0) continue;

    // Generate 1-4 courses per day depending on the day
    const isWeekend = currentDate.getDay() === 6; // Saturday
    const isWeekday = currentDate.getDay() >= 1 && currentDate.getDay() <= 5;

    let coursesPerDay = 1;
    if (isWeekday) {
      coursesPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 courses on weekdays
    } else if (isWeekend) {
      coursesPerDay = Math.floor(Math.random() * 2) + 1; // 1-2 courses on Saturday
    }

    // Generate multiple time slots for the day
    const timeSlots = [
      { start: 9, end: 13 }, // Morning half-day
      { start: 9, end: 17 }, // Full day
      { start: 14, end: 18 }, // Afternoon half-day
      { start: 10, end: 14 }, // Mid-day half-day
    ];

    for (let courseIndex = 0; courseIndex < coursesPerDay; courseIndex++) {
      // Pick a random course type
      const courseType =
        courseTypes[Math.floor(Math.random() * courseTypes.length)];
      const courseConfig = COURSE_TYPE_CONFIG[courseType];

      // Pick a random venue
      const venueCode = venues[Math.floor(Math.random() * venues.length)];
      const venue = VENUE_CONFIG[venueCode];

      // Pick a time slot that doesn't overlap with existing courses on this day
      const timeSlot = timeSlots[courseIndex % timeSlots.length];

      const sessionDate = new Date(currentDate);
      sessionDate.setHours(timeSlot.start, 0, 0, 0);

      const endDate = new Date(currentDate);
      endDate.setHours(timeSlot.end, 0, 0, 0);

      // Randomize available spots (more variety)
      const maxParticipants = 12;
      const bookedSpots = Math.floor(Math.random() * 10); // 0-9 booked
      const availableSpots = Math.max(0, maxParticipants - bookedSpots);

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
        instructorName: ["Lex", "Sarah", "Mike", "Emma"][courseIndex % 4],
      });
    }
  }

  // Add some specific popular course combinations for certain days
  const specialDates = [
    "2025-08-05",
    "2025-08-12",
    "2025-08-19",
    "2025-08-26",
    "2025-09-02",
    "2025-09-09",
    "2025-09-16",
    "2025-09-23",
  ];

  specialDates.forEach((dateStr) => {
    const specialDate = new Date(dateStr);

    // Add EFAW + FAW combo days
    ["EFAW", "FAW"].forEach((courseType, index) => {
      const courseConfig = COURSE_TYPE_CONFIG[courseType as CourseTypeCode];
      const sessionDate = new Date(specialDate);
      sessionDate.setHours(9 + index * 4, 0, 0, 0); // 9 AM and 1 PM

      const endDate = new Date(sessionDate);
      endDate.setHours(sessionDate.getHours() + 4, 0, 0, 0);

      schedules.push({
        id: id++,
        courseType: courseType as CourseTypeCode,
        courseName: courseConfig.name,
        startDate: sessionDate.toISOString(),
        endDate: endDate.toISOString(),
        venue: "LEEDS",
        venueName: VENUE_CONFIG.LEEDS.name,
        venueAddress: `${VENUE_CONFIG.LEEDS.address}, ${VENUE_CONFIG.LEEDS.city}`,
        availableSpots: 12,
        maxParticipants: 12,
        pricePerPerson: courseConfig.price,
        instructorName: "Lex",
      });
    });
  });

  return schedules;
};
