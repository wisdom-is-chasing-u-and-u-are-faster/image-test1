import React, { createContext, useContext, useState, useEffect } from 'react';
import { Donor, Appointment, BloodRequest, BloodInventory, EmergencyAlert } from './types';

interface AppStateContextType {
  donors: Donor[];
  currentDonor: Donor | null;
  activeDonorLogin: (email: string) => boolean;
  registerDonor: (donorData: Omit<Donor, 'id' | 'points' | 'upcomingAppointments' | 'donationHistory' | 'eligibilityStatus' | 'nextEligibleDate'>) => void;
  logoutDonor: () => void;
  bloodRequests: BloodRequest[];
  submitBloodRequest: (request: Omit<BloodRequest, 'id' | 'status' | 'timestamp'>) => void;
  inventory: BloodInventory;
  alerts: EmergencyAlert[];
  acceptEmergencyAlert: (alertId: string, donorId: string) => void;
  staffUser: { name: string; role: 'Hospital' | 'BankManager' } | null;
  loginStaff: (role: 'Hospital' | 'BankManager') => void;
  logoutStaff: () => void;
}

const initialDonors: Donor[] = [
  {
    id: 'donor-1',
    name: 'John Doe',
    email: 'john@gmail.com',
    phone: '555-0199',
    bloodGroup: 'O+',
    lastDonationDate: '2026-03-15',
    nextEligibleDate: '2026-06-15',
    eligibilityStatus: 'Eligible',
    latitude: 37.7749,
    longitude: -122.4194,
    points: 120,
    upcomingAppointments: [],
    donationHistory: [
      { date: '2026-03-15', center: 'City Blood Bank', status: 'Completed' }
    ]
  },
  {
    id: 'donor-2',
    name: 'Jane Smith',
    email: 'jane@gmail.com',
    phone: '555-0188',
    bloodGroup: 'A-',
    lastDonationDate: '2026-07-10',
    nextEligibleDate: '2026-10-10',
    eligibilityStatus: 'Ineligible',
    latitude: 37.7833,
    longitude: -122.4167,
    points: 50,
    upcomingAppointments: [],
    donationHistory: [
      { date: '2026-07-10', center: 'General Hospital Clinic', status: 'Completed' }
    ]
  }
];

const initialInventory: BloodInventory = {
  'O+': 45,
  'O-': 12,
  'A+': 30,
  'A-': 8,
  'B+': 22,
  'B-': 4,
  'AB+': 15,
  'AB-': 3
};

const initialRequests: BloodRequest[] = [
  {
    id: 'req-1',
    hospitalName: 'St. Francis Emergency',
    bloodGroup: 'O-',
    unitsRequested: 5,
    urgency: 'High',
    latitude: 37.7892,
    longitude: -122.4014,
    status: 'Matching',
    timestamp: '2026-07-23 10:15'
  }
];

const initialAlerts: EmergencyAlert[] = [
  {
    id: 'alert-1',
    requestId: 'req-1',
    bloodGroup: 'O-',
    location: 'St. Francis Emergency Center',
    message: 'URGENT: O- blood needed immediately at St. Francis Clinic!',
    active: true
  }
];

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donors, setDonors] = useState<Donor[]>(initialDonors);
  const [currentDonor, setCurrentDonor] = useState<Donor | null>(null);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>(initialRequests);
  const [inventory, setInventory] = useState<BloodInventory>(initialInventory);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(initialAlerts);
  const [staffUser, setStaffUser] = useState<{ name: string; role: 'Hospital' | 'BankManager' } | null>(null);

  // Auto-login active donor just for easier live interaction, but supports explicit login too
  const activeDonorLogin = (email: string): boolean => {
    const found = donors.find((d) => d.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentDonor(found);
      return true;
    }
    return false;
  };

  const registerDonor = (donorData: Omit<Donor, 'id' | 'points' | 'upcomingAppointments' | 'donationHistory' | 'eligibilityStatus' | 'nextEligibleDate'>) => {
    // Calculate eligibility: if no last donation date, eligible. Otherwise, 56 days (approx 2 months)
    const eligibilityStatus = 'Eligible';
    const nextEligibleDate = new Date().toISOString().split('T')[0];

    const newDonor: Donor = {
      ...donorData,
      id: `donor-${Date.now()}`,
      points: 10,
      upcomingAppointments: [],
      donationHistory: [],
      eligibilityStatus,
      nextEligibleDate
    };

    setDonors((prev) => [...prev, newDonor]);
    setCurrentDonor(newDonor);
  };

  const logoutDonor = () => {
    setCurrentDonor(null);
  };

  const submitBloodRequest = (request: Omit<BloodRequest, 'id' | 'status' | 'timestamp'>) => {
    const newId = `req-${Date.now()}`;
    const newReq: BloodRequest = {
      ...request,
      id: newId,
      status: 'Matching',
      timestamp: new Date().toLocaleString()
    };

    setBloodRequests((prev) => [newReq, ...prev]);

    // Automatically trigger an emergency alert if high or emergency urgency
    if (request.urgency === 'High' || request.urgency === 'Emergency') {
      const newAlert: EmergencyAlert = {
        id: `alert-${Date.now()}`,
        requestId: newId,
        bloodGroup: request.bloodGroup,
        location: request.hospitalName,
        message: `EMERGENCY: ${request.unitsRequested} units of ${request.bloodGroup} requested at ${request.hospitalName}!`,
        active: true
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const acceptEmergencyAlert = (alertId: string, donorId: string) => {
    // 1. Mark alert as inactive
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, active: false } : a)));

    // 2. Resolve request corresponding to alert
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setBloodRequests((prev) =>
        prev.map((r) => (r.id === alert.requestId ? { ...r, status: 'Completed' } : r))
      );

      // Decrement inventory (matching the full loop!)
      setInventory((prev) => ({
        ...prev,
        [alert.bloodGroup]: Math.max(0, (prev[alert.bloodGroup] || 0) - 1)
      }));
    }

    // 3. Create a scheduled reservation slot for the donor
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      donorId,
      center: alert ? alert.location : 'Regional Blood Clinic',
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      type: 'Emergency',
      status: 'Scheduled'
    };

    // Update donors list and current donor
    setDonors((prev) =>
      prev.map((d) => {
        if (d.id === donorId) {
          return {
            ...d,
            points: d.points + 50, // Gamification reward points!
            upcomingAppointments: [...d.upcomingAppointments, newAppointment]
          };
        }
        return d;
      })
    );

    if (currentDonor && currentDonor.id === donorId) {
      setCurrentDonor((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: prev.points + 50,
          upcomingAppointments: [...prev.upcomingAppointments, newAppointment]
        };
      });
    }
  };

  const loginStaff = (role: 'Hospital' | 'BankManager') => {
    setStaffUser({
      name: role === 'Hospital' ? 'Dr. Sarah Connor' : 'Chief Director Jenkins',
      role
    });
  };

  const logoutStaff = () => {
    setStaffUser(null);
  };

  return (
    <AppStateContext.Provider
      value={{
        donors,
        currentDonor,
        activeDonorLogin,
        registerDonor,
        logoutDonor,
        bloodRequests,
        submitBloodRequest,
        inventory,
        alerts,
        acceptEmergencyAlert,
        staffUser,
        loginStaff,
        logoutStaff
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
