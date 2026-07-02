import React, { useState } from 'react';
import { OcrData } from '../services/mockKycService';

interface DocCaptureProps {
  documentType: string;
  ocrData: OcrData;
  onChange: (data: OcrData) => void;
  onNext: () => void;
  userFullName: string; // for auto-fill suggestion
}

export const DocCapture: React.FC<DocCaptureProps> = ({
  documentType,
  ocrData,
  onChange,
  onNext,
  userFullName
}) => {
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  const handleCapture = () => {
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      setCaptured(true);
      // Populate mock OCR data (matching user default)
      onChange({
        fullName: userFullName,
        dob: '1990-01-01',
        address: '123 Enterprise St',
        documentNumber: 'A12345678'
      });
    }, 100);
  };

  const handleTriggerMismatch = () => {
    // Generate OCR data with intentional mismatch (>15%)
    onChange({
      fullName: 'John Different Name Doe',
      dob: '1985-05-15',
      address: '999 Completely Different Rd',
      documentNumber: 'Z98765432'
    });
    setCaptured(true);
  };

  return (
    <div className="doc-capture" data-testid="doc-capture-screen">
      <h2>Document Capture</h2>
      <p>Simulating 3rd party SDK web document capture for <strong>{documentType}</strong>.</p>

      {!captured ? (
        <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #9ca3af', borderRadius: '8px', margin: '20px 0' }}>
          {capturing ? (
            <div>
              <p>Scanning document & extracting OCR details...</p>
              <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: 'auto' }}></div>
            </div>
          ) : (
            <div>
              <p>Camera integration ready. Position your document clearly in the frame.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="button" type="button" onClick={handleCapture}>
                  Capture Document (Match User Data)
                </button>
                <button className="button" type="button" style={{ backgroundColor: '#dc2626' }} onClick={handleTriggerMismatch}>
                  Capture with Data Mismatch (Trigger Review)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '15px' }}>
            ✓ OCR Extraction Complete!
          </div>

          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
            <h3>Extracted Document Information (OCR)</h3>
            <p><strong>Full Name:</strong> {ocrData.fullName}</p>
            <p><strong>DOB:</strong> {ocrData.dob}</p>
            <p><strong>Address:</strong> {ocrData.address}</p>
            <p><strong>Doc Number:</strong> {ocrData.documentNumber}</p>
          </div>

          <button className="button" onClick={onNext}>
            Proceed to Biometric Scan
          </button>
        </div>
      )}
    </div>
  );
};
