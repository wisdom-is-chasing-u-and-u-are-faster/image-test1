import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { UserRegistration } from './components/UserRegistration';
import { MfaSetup } from './components/MfaSetup';
import { DocSelect } from './components/DocSelect';
import { DocCapture } from './components/DocCapture';
import { BioScan } from './components/BioScan';
import { ReviewSubmit } from './components/ReviewSubmit';
import { Confirmation } from './components/Confirmation';
import { UserData, OcrData } from './services/mockKycService';

type OnboardingStep = 
  | 'WELCOME'
  | 'REGISTRATION'
  | 'MFA'
  | 'DOC_SELECT'
  | 'DOC_CAPTURE'
  | 'BIO_SCAN'
  | 'REVIEW'
  | 'CONFIRMATION';

export const App: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('WELCOME');
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    dob: '',
    address: '',
    documentType: 'Passport'
  });
  const [ocrData, setOcrData] = useState<OcrData>({
    fullName: '',
    dob: '',
    address: '',
    documentNumber: ''
  });
  const [needsReview, setNeedsReview] = useState(false);

  const handleReset = () => {
    setStep('WELCOME');
    setUserData({ fullName: '', dob: '', address: '', documentType: 'Passport' });
    setOcrData({ fullName: '', dob: '', address: '', documentNumber: '' });
    setNeedsReview(false);
  };

  const getStepNumber = (): number => {
    const steps: OnboardingStep[] = ['WELCOME', 'REGISTRATION', 'MFA', 'DOC_SELECT', 'DOC_CAPTURE', 'BIO_SCAN', 'REVIEW', 'CONFIRMATION'];
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="onboarding-container">
      {step !== 'CONFIRMATION' && (
        <div className="step-indicator">
          Step {getStepNumber()} of 8: {step.replace('_', ' ')}
        </div>
      )}

      {step === 'WELCOME' && (
        <WelcomeScreen onNext={() => setStep('REGISTRATION')} />
      )}

      {step === 'REGISTRATION' && (
        <UserRegistration
          userData={userData}
          onChange={(data) => setUserData({ ...userData, ...data })}
          onNext={() => setStep('MFA')}
        />
      )}

      {step === 'MFA' && (
        <MfaSetup onNext={() => setStep('DOC_SELECT')} />
      )}

      {step === 'DOC_SELECT' && (
        <DocSelect
          documentType={userData.documentType}
          onChange={(type) => setUserData({ ...userData, documentType: type })}
          onNext={() => setStep('DOC_CAPTURE')}
        />
      )}

      {step === 'DOC_CAPTURE' && (
        <DocCapture
          documentType={userData.documentType}
          ocrData={ocrData}
          onChange={setOcrData}
          onNext={() => setStep('BIO_SCAN')}
          userFullName={userData.fullName}
        />
      )}

      {step === 'BIO_SCAN' && (
        <BioScan onNext={() => setStep('REVIEW')} />
      )}

      {step === 'REVIEW' && (
        <ReviewSubmit
          userData={userData}
          ocrData={ocrData}
          onNext={(reviewReq) => {
            setNeedsReview(reviewReq);
            setStep('CONFIRMATION');
          }}
        />
      )}

      {step === 'CONFIRMATION' && (
        <Confirmation needsReview={needsReview} onReset={handleReset} />
      )}
    </div>
  );
};

export default App;
