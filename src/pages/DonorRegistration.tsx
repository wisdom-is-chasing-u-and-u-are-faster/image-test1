import React, { useState } from 'react';
import { useAppState } from '../state';

interface DonorRegistrationProps {
  onLoginClick: () => void;
}

export const DonorRegistration: React.FC<DonorRegistrationProps> = ({ onLoginClick }) => {
  const { registerDonor } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setError('All fields are required');
      return;
    }
    registerDonor({
      name,
      email,
      phone,
      bloodGroup,
      latitude: 37.7749 + (Math.random() - 0.5) * 0.05,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.05
    });
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: '20px 0 0', color: 'var(--primary-color)', textAlign: 'center' }}>
        Create Donor Profile
      </h3>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)', textAlign: 'center' }}>
        Join the network to save lives in your region.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            className="form-control"
            placeholder="jane@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            className="form-control"
            placeholder="555-0155"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError('');
            }}
          />
        </div>

        <div className="form-group">
          <label>Blood Group</label>
          <select
            className="form-control"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="O+">O Positive (O+)</option>
            <option value="O-">O Negative (O-)</option>
            <option value="A+">A Positive (A+)</option>
            <option value="A-">A Negative (A-)</option>
            <option value="B+">B Positive (B+)</option>
            <option value="B-">B Negative (B-)</option>
            <option value="AB+">AB Positive (AB+)</option>
            <option value="AB-">AB Negative (AB-)</option>
          </select>
        </div>

        {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '10px' }}>
          Complete Registration
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
        <span>Already have an account? </span>
        <button
          onClick={onLoginClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-color)',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
