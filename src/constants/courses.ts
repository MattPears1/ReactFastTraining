export const COURSE_LIST = [
  "Emergency First Aid at Work",
  "First Aid at Work",
  "Paediatric First Aid",
  "Emergency Paediatric First Aid",
  "Activity First Aid",
  "CPR and AED",
  "Annual Skills Refresher",
  "Oxygen Therapy",
] as const;

export type CourseName = (typeof COURSE_LIST)[number];

export const COURSE_CATEGORIES = {
  workplace: {
    title: "Workplace First Aid",
    description: "Ofqual regulated and HSE approved courses for workplace compliance",
    courses: [
      "Emergency First Aid at Work",
      "First Aid at Work",
    ],
  },
  paediatric: {
    title: "Paediatric First Aid",
    description: "Specialized training for those working with children",
    courses: [
      "Paediatric First Aid",
      "Emergency Paediatric First Aid",
    ],
  },
  specialist: {
    title: "Specialist Training",
    description: "Additional qualifications and skills",
    courses: [
      "Activity First Aid",
      "CPR and AED",
      "Annual Skills Refresher",
      "Oxygen Therapy",
    ],
  },
} as const;

export const COURSE_DURATIONS: Record<CourseName, string> = {
  "Emergency First Aid at Work": "Full Day (6 hours)",
  "First Aid at Work": "3-Day Course",
  "Paediatric First Aid": "2-Day Course",
  "Emergency Paediatric First Aid": "1-Day Course",
  "Activity First Aid": "Full Day (5 hours)",
  "CPR and AED": "3 Hours",
  "Annual Skills Refresher": "3 Hours",
  "Oxygen Therapy": "1-Day Course",
};

export const COURSE_PRICES: Record<CourseName, number> = {
  "Emergency First Aid at Work": 100,
  "First Aid at Work": 200,
  "Paediatric First Aid": 150,
  "Emergency Paediatric First Aid": 100,
  "Activity First Aid": 175,
  "CPR and AED": 50,
  "Annual Skills Refresher": 50,
  "Oxygen Therapy": 60,
};
