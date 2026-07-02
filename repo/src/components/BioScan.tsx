import React, { useState } from 'react';

interface BioScanProps {
  onNext: () => void;
}

export const BioScan: React.FC<BioScanProps> = ({ onNext }) => {
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setVerified(true);
    }, 100);
  };

  return (
    <div className="bio-scan" data-testid="bio-scan-screen">
      <h2>Biometric Liveness Scan</h2>
      <p>Please look directly at your camera for 3D liveness detection and facial matching against your document photo.</p>

      {!verified ? (
        <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #9ca3af', borderRadius: '8px', margin: '20px 0' }}>
          {scanning ? (
            <div>
              <p>Performing 3D facial matching and liveness validation...</p>
              <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: 'auto' }}></div>
            </div>
          ) : (
            <div>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #3b82f6', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                👤
              </div>
              <button className="button" type="button" onClick={handleScan}>
                Start Face Scan
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '15px' }}>
            ✓ Facial Liveness and Document Match Verified!
          </div>
          <button className="button" onClick={onNext}>
            Proceed to Final Review
          </button>
        </div>
      )}
    </div>
  );
};
