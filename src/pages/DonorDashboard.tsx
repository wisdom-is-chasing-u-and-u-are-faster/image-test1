import React from 'react';
import { useAppState } from '../state';

export const DonorDashboard: React.FC = () => {
  const { currentDonor, logoutDonor } = useAppState();

  if (!currentDonor) {
    return <p>Loading Donor Session...</p>;
  }

  const isEligible = currentDonor.eligibilityStatus === 'Eligible';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mini App Header */}
      <div
        style={{
          backgroundColor: 'var(--primary-color)',
          color: '#fff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Welcome back,</p>
          <h4 style={{ margin: 0, fontWeight: 'bold' }}>{currentDonor.name}</h4>
        </div>
        <button
          onClick={logoutDonor}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Screen Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
        
        {/* Gamification Milestone Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #005A9C 0%, #D92121 100%)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-1)'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px', fontWeight: 'bold' }}>Hero Level 2</h4>
            <p style={{ margin: 0, fontSize: '0.75rem' }}>Next Milestone: 150 pts (+30 pts to go)</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentDonor.points}</span>
            <span style={{ fontSize: '0.75rem', display: 'block' }}>Points</span>
          </div>
        </div>

        {/* Eligibility Card */}
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <h5 style={{ margin: '0 0 10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            My Eligibility Status
          </h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.875rem' }}>
              {currentDonor.eligibilityStatus}
            </span>
            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary-color)' }}>
              Group {currentDonor.bloodGroup}
            </span>
          </div>

          {isEligible ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
              You are ready and cleared to donate! Your contribution makes an immediate impact.
            </p>
          ) : (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
                You are temporarily deferred due to standard recovery guidelines.
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold' }}>
                Next Eligible Donation: {currentDonor.nextEligibleDate}
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <h5 style={{ margin: '0 0 10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Upcoming Appointments
          </h5>

          {currentDonor.upcomingAppointments.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
              No appointments scheduled. Walk-ins and Emergency responses are always welcome.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentDonor.upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px',
                    backgroundColor: 'var(--surface-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{app.center}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      {app.type}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
                    Date: {app.date} | Time: {app.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donation History */}
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <h5 style={{ margin: '0 0 10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Donation History
          </h5>
          {currentDonor.donationHistory.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
              No history found yet. Make your first appointment today!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentDonor.donationHistory.map((history, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '6px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '600' }}>{history.center}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
                      {history.date}
                    </span>
                  </div>
                  <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
                    {history.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
