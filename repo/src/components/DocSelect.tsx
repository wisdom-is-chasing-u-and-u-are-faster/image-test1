import React from 'react';

interface DocSelectProps {
  documentType: string;
  onChange: (docType: string) => void;
  onNext: () => void;
}

export const DocSelect: React.FC<DocSelectProps> = ({ documentType, onChange, onNext }) => {
  return (
    <div className="doc-select" data-testid="doc-select-screen">
      <h2>Document Selection</h2>
      <p>Select the government-issued photo identification you wish to use for verification.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
        {['Passport', "Driver's License", 'National ID'].map((type) => (
          <label
            key={type}
            style={{
              padding: '15px',
              border: `2px solid ${documentType === type ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="radio"
              name="documentType"
              checked={documentType === type}
              onChange={() => onChange(type)}
              style={{ marginRight: '10px' }}
            />
            {type}
          </label>
        ))}
      </div>

      <button className="button" onClick={onNext} disabled={!documentType}>
        Next: Capture Document
      </button>
    </div>
  );
};
