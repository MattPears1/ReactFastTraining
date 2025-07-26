export const siteConfig = {
  name: 'React Fast Training',
  slogan: 'Act Fast | Save Lives',
  description: 'Professional onsite first aid training for businesses across Yorkshire. Ofqual accredited courses delivered at your workplace.',
  url: process.env.VITE_SITE_URL || 'https://example.com',
  
  // Business Information
  business: {
    type: 'service' as const,
    industry: 'Training & Education',
    specialization: 'First Aid & Health Safety Training',
    
    // Contact Information
    contact: {
      phone: '07845 123456',
      email: 'info@reactfasttraining.com',
      address: {
        street: '123 Training Street',
        city: 'Yorkshire',
        region: 'Yorkshire',
        postcode: 'YO1 1AA',
        country: 'United Kingdom',
      },
    },
    
    // Business Hours
    hours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 1:00 PM',
      sunday: 'Closed',
    },
  },
  
  // Theme Configuration
  // Logo Configuration
  logo: {
    full: '/images/logos/fulllogo_transparent.png',
    icon: '/images/logos/textonly.png',
    print: '/images/logos/print_transparent.svg',
    alternatives: {
      withBuffer: '/images/logos/fulllogo.png',
      noBuffer: '/images/logos/fulllogo_nobuffer.png',
      grayscale: '/images/logos/grayscale_transparent.png',
    }
  },
  
  theme: {
    colors: {
      primary: '#0EA5E9', // Trust blue - main brand color
      secondary: '#10B981', // Calming green - growth and healing
      accent: '#F97316', // Warm orange - energy and urgency
      success: '#10B981', // Green for positive outcomes
      warning: '#F59E0B', // Amber for caution
      error: '#DC2626', // Red used sparingly for critical alerts only
      info: '#3B82F6', // Information blue
      background: {
        light: '#F0F9FF', // Very light blue tint
        card: '#FFFFFF',
        dark: '#0F172A',
      },
      text: {
        primary: '#1E293B',
        secondary: '#64748B',
        light: '#FFFFFF',
      }
    },
  },
  
  // Navigation
  navigation: {
    main: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Courses', href: '/courses' },
      { label: 'Training Venue', href: '/venue' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  
  // Features
  features: {
    booking: true,
    onlinePayment: true,
    courseCalendar: true,
    certificationTracking: true,
    groupBookings: true,
    corporateAccounts: true,
  },
  
  // SEO & Social
  seo: {
    defaultTitle: 'Professional First Aid Training Yorkshire | React Fast Training',
    titleTemplate: '%s | React Fast Training - Act Fast Save Lives',
    defaultDescription: 'Ofqual accredited first aid training delivered at your workplace across Yorkshire. Save time and money with our professional onsite courses. Act Fast, Save Lives.',
    keywords: [
      'first aid training Yorkshire',
      'React Fast Training',
      'workplace first aid Yorkshire',
      'onsite training Yorkshire',
      'first aid courses Leeds',
      'emergency first aid at work Yorkshire',
      'paediatric first aid Yorkshire',
      'mental health first aid Yorkshire',
      'CPR training Yorkshire',
      'defibrillator training Yorkshire',
      'health and safety training Yorkshire',
      'act fast save lives',
      'Yorkshire first aid trainer',
    ],
  },
  
  social: {
    facebook: 'https://facebook.com/reactfasttraining',
    twitter: 'https://twitter.com/reactfasttraining',
    linkedin: 'https://linkedin.com/company/react-fast-training',
    instagram: 'https://instagram.com/reactfasttraining',
  },
  
  // Trust Indicators
  certifications: [
    {
      name: 'Ofqual Regulated',
      logo: '/images/certifications/ofqual.png',
      description: 'All our courses are Ofqual regulated',
    },
    {
      name: 'HSE Approved',
      logo: '/images/certifications/hse.png',
      description: 'Health and Safety Executive approved training',
    },
    {
      name: 'First Aid Awards',
      logo: '/images/certifications/faa.png',
      description: 'Certified by First Aid Awards',
    },
  ],
  
  // Value Propositions
  valueProps: [
    {
      title: 'Save Money',
      description: 'Save up to £100 per person with onsite training across Yorkshire',
      icon: 'currency-pound',
    },
    {
      title: 'Save Time',
      description: 'No travel time - we come to your Yorkshire workplace',
      icon: 'clock',
    },
    {
      title: 'Fully Accredited',
      description: 'All courses are Ofqual regulated and HSE compliant',
      icon: 'badge-check',
    },
    {
      title: 'Local Experts',
      description: 'Yorkshire-based trainers with emergency service backgrounds',
      icon: 'academic-cap',
    },
  ],
};

export default siteConfig;