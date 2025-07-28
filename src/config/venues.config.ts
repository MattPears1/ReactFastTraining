import { VenueConfig, VenueCode } from "@/types/booking.types";

export const VENUE_CONFIG: Record<VenueCode, VenueConfig> = {
  SHEFFIELD: {
    code: "SHEFFIELD",
    name: "Sheffield Area",
    address: "To be confirmed with attendees",
    city: "Sheffield",
    postcode: "TBC",
    facilities: [
      "Location selected for accessibility",
      "Suitable training environment",
      "Refreshments can be arranged",
      "Flexible venue options",
    ],
    parkingInfo: "Parking details provided once location confirmed",
    publicTransport: "Transport information provided with venue details",
  },
  LEEDS: {
    code: "LEEDS",
    name: "Leeds Area",
    address: "To be confirmed with attendees",
    city: "Leeds",
    postcode: "TBC",
    facilities: [
      "Location selected for accessibility",
      "Suitable training environment",
      "Refreshments can be arranged",
      "Flexible venue options",
    ],
    parkingInfo: "Parking details provided once location confirmed",
    publicTransport: "Transport information provided with venue details",
  },
  BARNSLEY: {
    code: "BARNSLEY",
    name: "Barnsley Area",
    address: "To be confirmed with attendees",
    city: "Barnsley",
    postcode: "TBC",
    facilities: [
      "Location selected for accessibility",
      "Suitable training environment",
      "Refreshments can be arranged",
      "Flexible venue options",
    ],
    parkingInfo: "Parking details provided once location confirmed",
    publicTransport: "Transport information provided with venue details",
  },
  DONCASTER: {
    code: "DONCASTER",
    name: "Doncaster Area",
    address: "To be confirmed with attendees",
    city: "Doncaster",
    postcode: "TBC",
    facilities: [
      "Location selected for accessibility",
      "Suitable training environment",
      "Refreshments can be arranged",
      "Flexible venue options",
    ],
    parkingInfo: "Parking details provided once location confirmed",
    publicTransport: "Transport information provided with venue details",
  },
  ROTHERHAM: {
    code: "ROTHERHAM",
    name: "Rotherham Area",
    address: "To be confirmed with attendees",
    city: "Rotherham",
    postcode: "TBC",
    facilities: [
      "Location selected for accessibility",
      "Suitable training environment",
      "Refreshments can be arranged",
      "Flexible venue options",
    ],
    parkingInfo: "Parking details provided once location confirmed",
    publicTransport: "Transport information provided with venue details",
  },
};

export const getVenueConfig = (code: VenueCode): VenueConfig => {
  return VENUE_CONFIG[code];
};

export const getAllVenues = (): VenueConfig[] => {
  return Object.values(VENUE_CONFIG);
};
