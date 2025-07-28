// Generate mock upcoming schedules for dashboard
function generateDashboardSchedules() {
  const baseDate = new Date();
  
  const courses = [
    'Emergency First Aid at Work',
    'Paediatric First Aid', 
    'First Aid at Work',
    'CPR and AED Training',
    'Emergency Paediatric First Aid',
    'Oxygen Therapy',
    'Activity First Aid'
  ];
  
  const times = [
    '09:00 - 17:00',
    '09:30 - 16:30',
    '10:00 - 17:00',
    '13:00 - 16:00',
    '14:00 - 17:00'
  ];
  
  const schedules = [];
  
  for (let i = 0; i < 5; i++) {
    const daysToAdd = i === 0 ? 0 : i * 1 + Math.floor(Math.random() * 2);
    const scheduleDate = new Date(baseDate);
    scheduleDate.setDate(scheduleDate.getDate() + daysToAdd);
    
    const locationNumber = ((i % 4) + 1);
    const currentCapacity = Math.floor(Math.random() * 8) + 3; // 3-10
    
    schedules.push({
      id: i + 1,
      courseName: courses[i % courses.length],
      date: scheduleDate.toISOString().split('T')[0],
      time: times[i % times.length],
      venue: `Location ${locationNumber} - TBA`,
      currentCapacity: currentCapacity,
      maxCapacity: 12
    });
  }
  
  return schedules;
}

module.exports = { generateDashboardSchedules };