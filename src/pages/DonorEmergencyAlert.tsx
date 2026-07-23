import React, { useState } from 'react';
import { useAppState } from '../state';

export const DonorEmergencyAlert: React.FC = () => {
  const { currentDonor, alerts, acceptEmergencyAlert } = useAppState();
  const [routeStep, setRouteStep] = useState<'alert' | 'route'>('alert');
  const [successMsg, setSuccessMsg] = useState('');

  if (!currentDonor) {
    return null;
  }

  // Find active alert matching donor's blood group (or any active alert for demonstration)
  const activeAlert = alerts.find((a) => a.active);

  const handleAccept = () => {
    if (activeAlert) {
      acceptEmergencyAlert(activeAlert.id, currentDonor.id);
      setSuccessMsg('Reservation Confirmed! Slot booked for today.');
      setRouteStep('route');
    }
  };

  if (!activeAlert && routeStep === 'alert') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: '40px' }}>
        <div style={{ fontSize: '3rem', color: 'var(--success-color)' }}>✔</div>
        <h4 style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>All Clear</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
          There are no active emergency alerts in your area matching your profile.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
      
      {routeStep === 'alert' && activeAlert ? (
        <div
          style={{
            border: '2px solid var(--accent-color)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#FFF5F5',
            padding: '20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-2)',
            animation: 'pulse 2s infinite'
          }}
        >
          <div style={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '10px' }}>🚨</div>
          <h4 style={{ color: 'var(--accent-color)', fontWeight: 'bold', margin: '0 0 10px' }}>
            EMERGENCY CALL
          </h4>
          <p style={{ fontWeight: 'bold', fontSize: '1.125rem', margin: '0 0 12px' }}>
            Request Group: {activeAlert.bloodGroup}
          </p>
          <p style={{ fontSize: '0.875rem', margin: '0 0 20px', color: '#333', lineHeight: '1.4' }}>
            {activeAlert.message}
          </p>

          <button
            onClick={handleAccept}
            className="btn btn-accent"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', textTransform: 'uppercase' }}
          >
            Accept & Book Appointment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div
            style={{
              backgroundColor: '#E8F5E9',
              border: '1px solid var(--success-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'center'
            }}
          >
            <span style={{ color: 'var(--success-color)', fontWeight: 'bold', display: 'block' }}>
              {successMsg}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
              Appointment scheduled. See routing below.
            </span>
          </div>

          <h5 style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Clinic GPS Routing (Live)
          </h5>

          {/* GPS Routing Simulator Map */}
          <div className="map-simulation" style={{ height: '320px' }}>
            {/* Base Lines */}
            <div style={{ position: 'absolute', top: '100px', left: 0, right: 0, height: '4px', backgroundColor: '#fff' }} />
            <div style={{ position: 'absolute', left: '150px', top: 0, bottom: 0, width: '4px', backgroundColor: '#fff' }} />
            
            {/* Route Path Polyline */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <polyline
                points="100,240 150,240 150,100 240,100"
                fill="none"
                stroke="#005A9C"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="8,4"
              />
            </svg>

            {/* Donor Marker */}
            <div className="map-marker" style={{ top: '234px', left: '94px', backgroundColor: '#005A9C' }} />
            <div className="map-label" style={{ top: '252px', left: '74px' }}>My Location</div>

            {/* Target Clinic Marker */}
            <div className="map-marker" style={{ top: '94px', left: '234px', backgroundColor: '#D92121' }} />
            <div className="map-label" style={{ top: '112px', left: '210px' }}>St. Francis</div>

            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                textAlign: 'center'
              }}
            >
              Turn Right on Market St. Center is 0.4 miles away (Est. 5 mins)
            </div>
          </div>

          <button
            onClick={() => {
              setRouteStep('alert');
              setSuccessMsg('');
            }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
