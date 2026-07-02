import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { calculateMismatch, performCrossValidation } from './services/mockKycService';

describe('KYC Service - calculateMismatch', () => {
  test('returns 0 for exact match', () => {
    expect(calculateMismatch('John Doe', 'John Doe')).toBe(0);
  });

  test('returns 100 for completely empty', () => {
    expect(calculateMismatch('John Doe', '')).toBe(100);
  });

  test('calculates correct mismatch rate for partial matches', () => {
    // 2 out of 3 words match -> 33% mismatch
    expect(calculateMismatch('John Doe Smith', 'John Doe')).toBe(33);
  });
});

describe('KYC Service - performCrossValidation', () => {
  test('does not require manual review for identical data', () => {
    const user = { fullName: 'John Doe', dob: '1990-01-01', address: '123 Enterprise St', documentType: 'Passport' };
    const ocr = { fullName: 'John Doe', dob: '1990-01-01', address: '123 Enterprise St', documentNumber: 'A12' };
    const result = performCrossValidation(user, ocr);
    expect(result.needsManualReview).toBe(false);
    expect(result.mismatchPercentage).toBe(0);
  });

  test('requires manual review for mismatch > 15%', () => {
    const user = { fullName: 'John Doe', dob: '1990-01-01', address: '123 Enterprise St', documentType: 'Passport' };
    const ocr = { fullName: 'Jane Smith', dob: '1985-05-15', address: '999 Way St', documentNumber: 'A12' };
    const result = performCrossValidation(user, ocr);
    expect(result.needsManualReview).toBe(true);
    expect(result.mismatchPercentage).toBeGreaterThan(15);
  });
});

describe('Enterprise KYC Onboarding Application Flow', () => {
  test('navigates cleanly through all 8 steps of the onboarding flow', async () => {
    render(<App />);

    // Step 1: Welcome Screen
    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start Onboarding'));

    // Step 2: User Registration
    expect(screen.getByTestId('registration-screen')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Alice Jones' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Enterprise St' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 3: MFA Setup
    expect(screen.getByTestId('mfa-screen')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify Code'));
    expect(await screen.findByText(/configured successfully/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Proceed to Document Selection'));

    // Step 4: Doc Select Screen
    expect(screen.getByTestId('doc-select-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Passport'));
    fireEvent.click(screen.getByText('Next: Capture Document'));

    // Step 5: Doc Capture Screen
    expect(screen.getByTestId('doc-capture-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Capture Document (Match User Data)'));
    expect(await screen.findByText(/OCR Extraction Complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Proceed to Biometric Scan'));

    // Step 6: Bio Scan Screen
    expect(screen.getByTestId('bio-scan-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start Face Scan'));
    expect(await screen.findByText(/Facial Liveness and Document Match Verified/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Proceed to Final Review'));

    // Step 7: Review & Submit (Simulate api delay)
    expect(screen.getByTestId('review-screen')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('auto-approve-alert')).toBeInTheDocument();
    }, { timeout: 2000 });
    fireEvent.click(screen.getByText('Submit Application'));

    // Step 8: Confirmation Screen
    expect(screen.getByTestId('confirmation-screen')).toBeInTheDocument();
    expect(screen.getByText('Fully Approved!')).toBeInTheDocument();
  });
});
