import React, { useState } from 'react';

interface MfaSetupProps {
  onNext: () => void;
}

export const MfaSetup: React.FC<MfaSetupProps> = ({ onNext }) => {
  const [method, setMfaMethod] = useState<'SMS' | 'TOTP'>('TOTP');
  const [phone, setPhone] = useState('');
  const [secret] = useState('JBSWY3DPEHPK3PXP'); // Dummy base32 key
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (method === 'SMS' && !phone.match(/^\+?[1-9]\d{1,14}$/)) {
      setError('Please enter a valid E.164 phone number');
      return;
    }
    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }
    setSuccess(true);
    setError('');
  };

  return (
    <div className="mfa-setup" data-testid="mfa-screen">
      <h2>MFA Setup</h2>
      <p>Configure Multi-Factor Authentication to secure your onboarding.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          className="button"
          type="button"
          style={{ marginRight: '10px', backgroundColor: method === 'TOTP' ? '#2563eb' : '#9ca3af' }}
          onClick={() => { setMfaMethod('TOTP'); setSuccess(false); setCode(''); }}
        >
          Authenticator App (TOTP)
        </button>
        <button
          className="button"
          type="button"
          style={{ backgroundColor: method === 'SMS' ? '#2563eb' : '#9ca3af' }}
          onClick={() => { setMfaMethod('SMS'); setSuccess(false); setCode(''); }}
        >
          SMS Verification
        </button>
      </div>

      {!success ? (
        <div>
          {method === 'TOTP' ? (
            <div>
              <p>Scan the secret key below with Google Authenticator or Duo:</p>
              <div style={{ padding: '10px', background: '#e5e7eb', fontFamily: 'monospace', textAlign: 'center', marginBottom: '15px' }}>
                Secret: {secret}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="phone">Phone Number (E.164 format)</label>
              <input
                id="phone"
                className="input-field"
                type="text"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor="mfaCode">Enter 6-digit verification code</label>
            <input
              id="mfaCode"
              className="input-field"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="button" type="button" onClick={handleVerify}>
            Verify Code
          </button>
        </div>
      ) : (
        <div>
          <div style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '15px' }}>
            ✓ Multi-factor authentication configured successfully!
          </div>
          <button className="button" type="button" onClick={onNext}>
            Proceed to Document Selection
          </button>
        </div>
      )}
    </div>
  );
};
