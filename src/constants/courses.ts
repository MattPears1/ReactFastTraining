export const COURSE_LIST = [
  'Emergency First Aid at Work',
  'First Aid at Work',
  'Paediatric First Aid',
  'Emergency Paediatric First Aid',
  'FAW Requalification',
  'EFAW Requalification',
  'Paediatric Requalification',
  'Emergency Paediatric Requalification',
  'Activity First Aid',
  'Activity First Aid Requalification',
  'CPR and AED',
  'Annual Skills Refresher',
  'Oxygen Therapy'
] as const

export type CourseName = typeof COURSE_LIST[number]

export const COURSE_CATEGORIES = {
  workplace: {
    title: 'Workplace First Aid',
    description: 'HSE approved courses for workplace compliance',
    courses: [
      'Emergency First Aid at Work',
      'First Aid at Work',
      'FAW Requalification',
      'EFAW Requalification'
    ]
  },
  paediatric: {
    title: 'Paediatric First Aid',
    description: 'Specialized training for those working with children',
    courses: [
      'Paediatric First Aid',
      'Emergency Paediatric First Aid',
      'Paediatric Requalification',
      'Emergency Paediatric Requalification'
    ]
  },
  specialist: {
    title: 'Specialist Training',
    description: 'Additional qualifications and skills',
    courses: [
      'Activity First Aid',
      'Activity First Aid Requalification',
      'CPR and AED',
      'Annual Skills Refresher',
      'Oxygen Therapy'
    ]
  }
} as const

export const COURSE_DURATIONS: Record<CourseName, string> = {
  'Emergency First Aid at Work': '1 Day',
  'First Aid at Work': '3 Days',
  'Paediatric First Aid': '2 Days',
  'Emergency Paediatric First Aid': '1 Day',
  'FAW Requalification': '2 Days',
  'EFAW Requalification': '1 Day',
  'Paediatric Requalification': '1 Day',
  'Emergency Paediatric Requalification': '1 Day',
  'Activity First Aid': '2 Days',
  'Activity First Aid Requalification': '1 Day',
  'CPR and AED': 'Half Day',
  'Annual Skills Refresher': 'Half Day',
  'Oxygen Therapy': 'Half Day'
}

export const COURSE_PRICES: Record<CourseName, number> = {
  'Emergency First Aid at Work': 100,
  'First Aid at Work': 200,
  'Paediatric First Aid': 150,
  'Emergency Paediatric First Aid': 100,
  'FAW Requalification': 150,
  'EFAW Requalification': 75,
  'Paediatric Requalification': 100,
  'Emergency Paediatric Requalification': 75,
  'Activity First Aid': 175,
  'Activity First Aid Requalification': 100,
  'CPR and AED': 50,
  'Annual Skills Refresher': 50,
  'Oxygen Therapy': 75
}