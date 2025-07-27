export const COURSE_COLOR_THEMES = {
  workplace: {
    name: 'Workplace First Aid',
    description: 'Work-related first aid courses',
    primary: 'blue',
    variants: {
      FAW: 'blue-600',
      EFAW: 'blue-500',
      FAW_REQUAL: 'blue-700',
      EFAW_REQUAL: 'blue-400'
    }
  },
  paediatric: {
    name: 'Paediatric First Aid',
    description: 'Child-focused first aid courses',
    primary: 'purple',
    variants: {
      PFA: 'purple-600',
      EPFA: 'purple-500',
      PFA_REQUAL: 'purple-700',
      EPFA_REQUAL: 'purple-400'
    }
  },
  specialist: {
    name: 'Specialist Courses',
    description: 'Specialized and supplementary courses',
    primary: 'orange',
    variants: {
      ACTIVITY: 'orange-600',
      CPR_AED: 'red-500',
      REFRESHER: 'teal-500',
      OXYGEN: 'sky-500',
      ACTIVITY_REQUAL: 'orange-400'
    }
  }
}

export const getCourseColorTheme = (courseTitle: string): string => {
  const title = courseTitle.toLowerCase()
  
  // Workplace courses
  if (title.includes('work') && !title.includes('paediatric')) {
    if (title.includes('requal')) {
      return title.includes('emergency') ? 'blue-400' : 'blue-700'
    }
    return title.includes('emergency') ? 'blue-500' : 'blue-600'
  }
  
  // Paediatric courses
  if (title.includes('paediatric')) {
    if (title.includes('requal')) {
      return title.includes('emergency') ? 'purple-400' : 'purple-700'
    }
    return title.includes('emergency') ? 'purple-500' : 'purple-600'
  }
  
  // Specialist courses
  if (title.includes('activity')) {
    return title.includes('requal') ? 'orange-400' : 'orange-600'
  }
  if (title.includes('cpr') || title.includes('aed')) return 'red-500'
  if (title.includes('refresher')) return 'teal-500'
  if (title.includes('oxygen')) return 'sky-500'
  
  // Default
  return 'gray-600'
}