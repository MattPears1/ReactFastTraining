import { CourseTypeConfig, CourseTypeCode } from '@/types/booking.types';

export const COURSE_TYPE_CONFIG: Record<CourseTypeCode, CourseTypeConfig> = {
  EFAW: {
    code: 'EFAW',
    name: 'Emergency First Aid at Work',
    duration: '1 Day (6 hours)',
    price: 100,
    certificateValidity: '3 years',
    color: {
      border: 'border-blue-500',
      background: 'bg-blue-50 dark:bg-blue-900/20',
      dot: 'bg-blue-500'
    },
    category: 'workplace',
    description: 'Essential first aid skills for low-risk workplaces'
  },
  FAW: {
    code: 'FAW',
    name: 'First Aid at Work',
    duration: '1 Day (6 hours)',
    price: 200,
    certificateValidity: '3 years',
    color: {
      border: 'border-green-500',
      background: 'bg-green-50 dark:bg-green-900/20',
      dot: 'bg-green-500'
    },
    category: 'workplace',
    description: 'Comprehensive first aid training for workplace first aiders'
  },
  PAEDIATRIC: {
    code: 'PAEDIATRIC',
    name: 'Paediatric First Aid',
    duration: '1 Day (6 hours)',
    price: 150,
    certificateValidity: '3 years',
    color: {
      border: 'border-purple-500',
      background: 'bg-purple-50 dark:bg-purple-900/20',
      dot: 'bg-purple-500'
    },
    category: 'paediatric',
    description: 'Specialized first aid for those working with children'
  },
  EMERGENCY_PAEDIATRIC: {
    code: 'EMERGENCY_PAEDIATRIC',
    name: 'Emergency Paediatric First Aid',
    duration: '1 Day (5 hours)',
    price: 100,
    certificateValidity: '3 years',
    color: {
      border: 'border-indigo-500',
      background: 'bg-indigo-50 dark:bg-indigo-900/20',
      dot: 'bg-indigo-500'
    },
    category: 'paediatric',
    description: 'Emergency first aid skills for childcare providers'
  },
  FAW_REQUALIFICATION: {
    code: 'FAW_REQUALIFICATION',
    name: 'FAW Requalification',
    duration: '1 Day (5 hours)',
    price: 150,
    certificateValidity: '3 years',
    color: {
      border: 'border-emerald-500',
      background: 'bg-emerald-50 dark:bg-emerald-900/20',
      dot: 'bg-emerald-500'
    },
    category: 'workplace',
    description: 'Renewal course for expiring FAW certificates'
  },
  EFAW_REQUALIFICATION: {
    code: 'EFAW_REQUALIFICATION',
    name: 'EFAW Requalification',
    duration: 'Half Day (4 hours)',
    price: 75,
    certificateValidity: '3 years',
    color: {
      border: 'border-cyan-500',
      background: 'bg-cyan-50 dark:bg-cyan-900/20',
      dot: 'bg-cyan-500'
    },
    category: 'workplace',
    description: 'Renewal course for expiring EFAW certificates'
  },
  PAEDIATRIC_REQUALIFICATION: {
    code: 'PAEDIATRIC_REQUALIFICATION',
    name: 'Paediatric Requalification',
    duration: 'Half Day (4 hours)',
    price: 100,
    certificateValidity: '3 years',
    color: {
      border: 'border-violet-500',
      background: 'bg-violet-50 dark:bg-violet-900/20',
      dot: 'bg-violet-500'
    },
    category: 'paediatric',
    description: 'Renewal course for expiring paediatric certificates'
  },
  EMERGENCY_PAEDIATRIC_REQUALIFICATION: {
    code: 'EMERGENCY_PAEDIATRIC_REQUALIFICATION',
    name: 'Emergency Paediatric Requalification',
    duration: 'Half Day (3 hours)',
    price: 75,
    certificateValidity: '3 years',
    color: {
      border: 'border-fuchsia-500',
      background: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
      dot: 'bg-fuchsia-500'
    },
    category: 'paediatric',
    description: 'Renewal course for emergency paediatric certificates'
  },
  ACTIVITY_FIRST_AID: {
    code: 'ACTIVITY_FIRST_AID',
    name: 'Activity First Aid',
    duration: '1 Day (5 hours)',
    price: 175,
    certificateValidity: '3 years',
    color: {
      border: 'border-orange-500',
      background: 'bg-orange-50 dark:bg-orange-900/20',
      dot: 'bg-orange-500'
    },
    category: 'specialist',
    description: 'First aid for sports and outdoor activity providers'
  },
  ACTIVITY_FIRST_AID_REQUALIFICATION: {
    code: 'ACTIVITY_FIRST_AID_REQUALIFICATION',
    name: 'Activity First Aid Requalification',
    duration: 'Half Day (3 hours)',
    price: 100,
    certificateValidity: '3 years',
    color: {
      border: 'border-amber-500',
      background: 'bg-amber-50 dark:bg-amber-900/20',
      dot: 'bg-amber-500'
    },
    category: 'specialist',
    description: 'Renewal course for activity first aid certificates'
  },
  CPR_AED: {
    code: 'CPR_AED',
    name: 'CPR and AED',
    duration: 'Half Day (3 hours)',
    price: 50,
    certificateValidity: '1 year',
    color: {
      border: 'border-red-500',
      background: 'bg-red-50 dark:bg-red-900/20',
      dot: 'bg-red-500'
    },
    category: 'specialist',
    description: 'Essential CPR and defibrillator training'
  },
  ANNUAL_SKILLS_REFRESHER: {
    code: 'ANNUAL_SKILLS_REFRESHER',
    name: 'Annual Skills Refresher',
    duration: 'Half Day (3 hours)',
    price: 50,
    certificateValidity: '1 year',
    color: {
      border: 'border-teal-500',
      background: 'bg-teal-50 dark:bg-teal-900/20',
      dot: 'bg-teal-500'
    },
    category: 'specialist',
    description: 'Annual update to maintain first aid skills'
  },
  OXYGEN_THERAPY: {
    code: 'OXYGEN_THERAPY',
    name: 'Oxygen Therapy',
    duration: 'Half Day (4 hours)',
    price: 75,
    certificateValidity: '3 years',
    color: {
      border: 'border-sky-500',
      background: 'bg-sky-50 dark:bg-sky-900/20',
      dot: 'bg-sky-500'
    },
    category: 'specialist',
    description: 'Safe administration of emergency oxygen'
  }
};

export const getCourseTypeConfig = (code: CourseTypeCode): CourseTypeConfig => {
  return COURSE_TYPE_CONFIG[code];
};

export const getCoursesByCategory = (category: 'workplace' | 'paediatric' | 'specialist'): CourseTypeConfig[] => {
  return Object.values(COURSE_TYPE_CONFIG).filter(course => course.category === category);
};

export const getAllCourseTypes = (): CourseTypeConfig[] => {
  return Object.values(COURSE_TYPE_CONFIG);
};