export interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  lastDonationDate?: string;
  nextEligibleDate: string;
  eligibilityStatus: 'Eligible' | 'Ineligible';
  latitude: number;
  longitude: number;
  points: number;
  upcomingAppointments: Appointment[];
  donationHistory: { date: string; center: string; status: string }[];
}

export interface Appointment {
  id: string;
  donorId: string;
  center: string;
  date: string;
  time: string;
  type: 'Regular' | 'Emergency';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface BloodRequest {
  id: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequested: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Matching' | 'Dispatched' | 'Completed';
  timestamp: string;
}

export interface BloodInventory {
  [bloodGroup: string]: number; // Group -> Units
}

export interface EmergencyAlert {
  id: string;
  requestId: string;
  bloodGroup: string;
  location: string;
  message: string;
  active: boolean;
}
