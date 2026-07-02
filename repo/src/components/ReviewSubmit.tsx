import React, { useState, useEffect } from 'react';
import { UserData, OcrData, screenUser, ScreeningResult } from '../services/mockKycService';

interface ReviewSubmitProps {
  userData: UserData;
  ocrData: OcrData;
  onNext: (needsReview: boolean) => void;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ userData, ocrData, onNext }) => {
  const [screening, setScreening] = useState(true);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  useEffect(() => {
    let active = true;
    screenUser(userData, ocrData).then((res) => {
      if (active) {
        setResult(res);
        setScreening(false);
      }
    });
    return () => { active = false; };
  }, [userData, ocrData]);

  if (screening) {
    return (
      <div className="review-submit" data-testid="review-screen">
        <h2>Verifying Your Profile</h2>
        <p>Running anti-money laundering (AML) screening and cross-referencing your documents with your registration details...</p>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '20px auto' }}></div>
      </div>
    );
  }

  const { mismatchPercentage, needsManualReview, amlStatus, score } = result!;

  return (
    <div className="review-submit" data-testid="review-screen">
      <h2>Review & Submit</h2>
      
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Onboarding Status Dashboard</h3>
        
        <p><strong>Compliance Score:</strong> {score} / 100</p>
        <p><strong>Data Mismatch Rate:</strong> {mismatchPercentage}%</p>
        <p><strong>AML Watchlist Screening:</strong> <span style={{ color: amlStatus === 'CLEARED' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{amlStatus}</span></p>
        <p><strong>Liveness Status:</strong> Verified</p>

        {needsManualReview ? (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '15px', borderRadius: '6px', margin: '15px 0' }} data-testid="manual-review-alert">
            ⚠️ <strong>Manual Review Required</strong>: The mismatch between user-entered and OCR-extracted data ({mismatchPercentage}%) exceeds the 15% automatic threshold, or an AML screening flag was raised. Your application will be reviewed manually.
          </div>
        ) : (
          <div style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#047857', padding: '15px', borderRadius: '6px', margin: '15px 0' }} data-testid="auto-approve-alert">
            ✓ <strong>Automatic Approval Eligible</strong>: Data matches cleanly and AML screening cleared!
          </div>
        )}
      </div>

      <button className="button" onClick={() => onNext(needsManualReview)}>
        Submit Application
      </button>
    </div>
  );
};
