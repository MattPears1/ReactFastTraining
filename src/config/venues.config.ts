import { VenueConfig, VenueCode } from '@/types/booking.types';

export const VENUE_CONFIG: Record<VenueCode, VenueConfig> = {
  SHEFFIELD: {
    code: 'SHEFFIELD',
    name: 'Sheffield Training Centre',
    address: 'City Centre',
    city: 'Sheffield',
    postcode: 'S1 1AA',
    facilities: [
      'Free parking nearby',
      'Wheelchair accessible',
      'Refreshments provided',
      'Air conditioning'
    ],
    parkingInfo: 'Multi-storey car park 2 minutes walk',
    publicTransport: 'Sheffield station 10 minute walk, multiple bus routes nearby'
  },
  LEEDS: {
    code: 'LEEDS',
    name: 'Leeds Training Centre',
    address: 'City Centre',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    facilities: [
      'City centre location',
      'Wheelchair accessible',
      'Refreshments provided',
      'Modern facilities'
    ],
    parkingInfo: 'Several city centre car parks within 5 minutes',
    publicTransport: 'Leeds station 15 minute walk, excellent bus connections'
  },
  BARNSLEY: {
    code: 'BARNSLEY',
    name: 'Barnsley Training Venue',
    address: 'Town Centre',
    city: 'Barnsley',
    postcode: 'S70 1AA',
    facilities: [
      'Free parking',
      'Ground floor access',
      'Refreshments provided',
      'Break out areas'
    ],
    parkingInfo: 'Free on-site parking available',
    publicTransport: 'Barnsley Interchange 5 minute walk'
  },
  DONCASTER: {
    code: 'DONCASTER',
    name: 'Doncaster Training Venue',
    address: 'Town Centre',
    city: 'Doncaster',
    postcode: 'DN1 1AA',
    facilities: [
      'Easy access location',
      'Wheelchair accessible',
      'Refreshments provided',
      'Comfortable training rooms'
    ],
    parkingInfo: 'Town centre parking available',
    publicTransport: 'Doncaster station 10 minute walk'
  },
  ROTHERHAM: {
    code: 'ROTHERHAM',
    name: 'Rotherham Training Centre',
    address: 'Town Centre',
    city: 'Rotherham',
    postcode: 'S60 1AA',
    facilities: [
      'Central location',
      'Accessible facilities',
      'Refreshments provided',
      'Modern equipment'
    ],
    parkingInfo: 'Public parking nearby',
    publicTransport: 'Rotherham Central station nearby'
  }
};

export const getVenueConfig = (code: VenueCode): VenueConfig => {
  return VENUE_CONFIG[code];
};

export const getAllVenues = (): VenueConfig[] => {
  return Object.values(VENUE_CONFIG);
};