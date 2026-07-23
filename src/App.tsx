import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './state';
import { DonorLogin } from './pages/DonorLogin';
import { DonorRegistration } from './pages/DonorRegistration';
import { DonorDashboard } from './pages/DonorDashboard';
import { DonorEmergencyAlert } from './pages/DonorEmergencyAlert';
import { PortalLogin } from './pages/PortalLogin';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { BloodBankDashboard } from './pages/BloodBankDashboard';
import './styles/app.css';

const CombinedAppShell: React.FC = () => {
  const { currentDonor, staffUser } = useAppState();
  const [donorTab, setDonorTab] = useState<'auth' | 'register' | 'home' | 'alerts'>('auth');

  // Sync donor tab with context donor login state
  React.useEffect(() => {
    if (currentDonor) {
      if (donorTab === 'auth' || donorTab === 'register') {
        setDonorTab('home');
      }
    } else {
      if (donorTab !== 'register') {
        setDonorTab('auth');
      }
    }
  }, [currentDonor]);

  return (
    <div className="app-container">
      {/* LEFT VIEWPORT: Simulated Mobile Device View */}
      <div className="mobile-view-wrapper">
        <h4 style={{ margin: '0 0 10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
          📱 SIMULATED DONOR SMARTPHONE
        </h4>
        <div className="smartphone-frame">
          <div className="smartphone-screen">
            {/* Quick Mobile Tab Bar (if logged in) */}
            {currentDonor && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#fff',
                  borderBottom: '1px solid var(--border-color)',
                  justifyContent: 'space-around',
                  padding: '10px 0'
                }}
              >
                <button
                  onClick={() => setDonorTab('home')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontWeight: donorTab === 'home' ? 'bold' : 'normal',
                    color: donorTab === 'home' ? 'var(--primary-color)' : 'var(--text-color-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setDonorTab('alerts')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontWeight: donorTab === 'alerts' ? 'bold' : 'normal',
                    color: donorTab === 'alerts' ? 'var(--accent-color)' : 'var(--text-color-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Alerts 🚨
                </button>
              </div>
            )}

            {/* Screen Content Controller */}
            {donorTab === 'auth' && (
              <DonorLogin onRegisterClick={() => setDonorTab('register')} />
            )}
            {donorTab === 'register' && (
              <DonorRegistration onLoginClick={() => setDonorTab('auth')} />
            )}
            {donorTab === 'home' && <DonorDashboard />}
            {donorTab === 'alerts' && <DonorEmergencyAlert />}
          </div>
        </div>
      </div>

      {/* RIGHT VIEWPORT: Staff Web Portal View */}
      <div className="portal-view-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>
            💻 SECURE BDCN STAFF WEB PORTAL
          </h4>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#e2f0d9', color: '#1e4620', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            TLS 1.3 ACTIVE
          </span>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-1)', overflowY: 'auto' }}>
          {!staffUser ? (
            <PortalLogin />
          ) : staffUser.role === 'Hospital' ? (
            <HospitalDashboard />
          ) : (
            <BloodBankDashboard />
          )}
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppStateProvider>
      <CombinedAppShell />
    </AppStateProvider>
  );
};

export default App;
