import React, { useState } from 'react';

interface UserRegistrationProps {
  userData: { fullName: string; dob: string; address: string };
  onChange: (data: { fullName: string; dob: string; address: string }) => void;
  onNext: () => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ userData, onChange, onNext }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!userData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!userData.dob) newErrors.dob = 'Date of Birth is required';
    if (!userData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form className="user-registration" onSubmit={handleSubmit} data-testid="registration-screen">
      <h2>User Registration</h2>
      <div>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          className="input-field"
          type="text"
          value={userData.fullName}
          onChange={(e) => onChange({ ...userData, fullName: e.target.value })}
        />
        {errors.fullName && <div className="error-message">{errors.fullName}</div>}
      </div>

      <div>
        <label htmlFor="dob">Date of Birth</label>
        <input
          id="dob"
          className="input-field"
          type="date"
          value={userData.dob}
          onChange={(e) => onChange({ ...userData, dob: e.target.value })}
        />
        {errors.dob && <div className="error-message">{errors.dob}</div>}
      </div>

      <div>
        <label htmlFor="address">Address</label>
        <input
          id="address"
          className="input-field"
          type="text"
          value={userData.address}
          onChange={(e) => onChange({ ...userData, address: e.target.value })}
        />
        {errors.address && <div className="error-message">{errors.address}</div>}
      </div>

      <button className="button" type="submit">
        Next
      </button>
    </form>
  );
};
