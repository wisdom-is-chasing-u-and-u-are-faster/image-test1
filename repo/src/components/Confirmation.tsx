import React from 'react';

interface ConfirmationProps {
  needsReview: boolean;
  onReset: () => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({ needsReview, onReset }) => {
  return (
    <div className="confirmation" data-testid="confirmation-screen">
      <h2>Application Submitted</h2>
      
      {needsReview ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h3>Under Manual Review</h3>
          <p>Your application was successfully received and has been routed to our compliance operations team for manual verification. We expect to complete this review within 24 hours.</p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
          <h3>Fully Approved!</h3>
          <p>Congratulations! Your identity has been automatically verified, and your onboarding is complete. You may now access your account.</p>
        </div>
      )}

      <button className="button" style={{ marginTop: '20px', backgroundColor: '#4b5563' }} onClick={onReset}>
        Reset Flow / Start Over
      </button>
    </div>
  );
};
