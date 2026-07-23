import React from 'react';
import { useAppState } from '../state';

export const PortalLogin: React.FC = () => {
  const { loginStaff } = useAppState();

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '100px auto',
        padding: '30px',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-2)',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '3rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>⛨</div>
      <h3 style={{ margin: '10px 0 6px', color: 'var(--primary-color)' }}>BDCN Portal</h3>
      <p style={{ margin: '0 0 30px', fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
        Web interface for hospital and blood bank coordinators
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button
          onClick={() => loginStaff('Hospital')}
          className="btn btn-primary"
          style={{ padding: '12px', fontSize: '1rem' }}
        >
          Sign In as Hospital Coordinator
        </button>

        <button
          onClick={() => loginStaff('BankManager')}
          className="btn btn-secondary"
          style={{ padding: '12px', fontSize: '1rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
        >
          Sign In as Blood Bank Manager
        </button>
      </div>

      <p style={{ margin: '30px 0 0', fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
        Secure, OAuth2-compliant, zero-trust authorized terminal.
      </p>
    </div>
  );
};
