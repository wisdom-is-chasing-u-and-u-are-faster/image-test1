import React, { useState } from 'react';
import { useAppState } from '../state';

interface DonorLoginProps {
  onRegisterClick: () => void;
}

export const DonorLogin: React.FC<DonorLoginProps> = ({ onRegisterClick }) => {
  const { activeDonorLogin } = useAppState();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    const success = activeDonorLogin(email);
    if (!success) {
      setError('Donor email not found. Try quick-fill demo below or register.');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <div style={{ fontSize: '3rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>♥</div>
        <h2 style={{ margin: '8px 0 4px', color: 'var(--primary-color)' }}>BDCN</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
          Donor Connection Mobile App
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
        <div className="form-group">
          <label>Donor Registered Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="e.g. john@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </div>

        {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
          Log In securely
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '10px' }}>
        <span>Don't have a profile? </span>
        <button
          onClick={onRegisterClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-color)',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Register here
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-color-muted)' }}>
          Quick Demo Accounts (Click to Fill):
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setEmail('john@gmail.com')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px', flex: 1 }}
          >
            John Doe (O+) - Eligible
          </button>
          <button
            onClick={() => setEmail('jane@gmail.com')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px', flex: 1 }}
          >
            Jane Smith (A-) - Ineligible
          </button>
        </div>
      </div>
    </div>
  );
};
