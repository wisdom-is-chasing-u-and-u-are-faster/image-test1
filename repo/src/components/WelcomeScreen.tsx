import React from 'react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <div className="welcome-screen" data-testid="welcome-screen">
      <h1>Welcome to Enterprise KYC</h1>
      <p>Secure identity verification and customer onboarding. Please have your identity documents (Passport, Driver's License, or National ID) ready before continuing.</p>
      <button className="button" onClick={onNext}>
        Start Onboarding
      </button>
    </div>
  );
};
