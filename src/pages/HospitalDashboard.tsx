import React, { useState } from 'react';
import { useAppState } from '../state';

export const HospitalDashboard: React.FC = () => {
  const { staffUser, logoutStaff, bloodRequests, submitBloodRequest } = useAppState();

  const [bloodGroup, setBloodGroup] = useState('O-');
  const [unitsRequested, setUnitsRequested] = useState(2);
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [success, setSuccess] = useState('');

  if (!staffUser || staffUser.role !== 'Hospital') {
    return <p>Access Denied. Hospital Coordinator clearance required.</p>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBloodRequest({
      hospitalName: 'St. Francis Emergency Clinic',
      bloodGroup,
      unitsRequested: Number(unitsRequested),
      urgency,
      latitude: 37.7892,
      longitude: -122.4014
    });

    setSuccess('Request Submitted Successfully! Broadcasting match alerts...');
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Portal Inner Header */}
      <div className="portal-header">
        <div>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Hospital Request Console</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
            Logged in as {staffUser.name} ({staffUser.role})
          </p>
        </div>
        <button onClick={logoutStaff} className="btn btn-secondary">
          Sign Out Portal
        </button>
      </div>

      {/* Main Body Grid */}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Form Column */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div className="card">
            <h4 style={{ margin: '0 0 15px', color: 'var(--primary-color)' }}>New Outbound Blood Order</h4>
            
            {success && (
              <div
                style={{
                  backgroundColor: '#E8F5E9',
                  border: '1px solid var(--success-color)',
                  color: 'var(--success-color)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '15px',
                  fontWeight: '600'
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Target Blood Group</label>
                <select
                  className="form-control"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="O-">O Negative (O-) - Universal Deficit</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Required (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-control"
                  value={unitsRequested}
                  onChange={(e) => setUnitsRequested(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Urgency Level</label>
                <select
                  className="form-control"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                >
                  <option value="Low">Low - Elective Surgery</option>
                  <option value="Medium">Medium - Standby</option>
                  <option value="High">High - Impending Trauma</option>
                  <option value="Emergency">Emergency - Instant Match Required</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Submit HL7 Blood Request
              </button>
            </form>
          </div>
        </div>

        {/* Live Requests Status Column */}
        <div style={{ flex: 1.5, minWidth: '360px' }}>
          <div className="card">
            <h4 style={{ margin: '0 0 15px', color: 'var(--primary-color)' }}>Active Outbound Requests</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bloodRequests.length === 0 ? (
                <p style={{ color: 'var(--text-color-muted)' }}>No active requests submitted.</p>
              ) : (
                bloodRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      backgroundColor: req.status === 'Completed' ? '#F9FBF9' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold' }}>{req.hospitalName}</span>
                      <span
                        className={`badge ${
                          req.status === 'Completed' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
                      <span>
                        Group: <strong style={{ color: 'var(--text-color)' }}>{req.bloodGroup}</strong> | Units: {req.unitsRequested}
                      </span>
                      <span>
                        Urgency:{' '}
                        <strong
                          style={{
                            color:
                              req.urgency === 'Emergency' || req.urgency === 'High'
                                ? 'var(--danger-color)'
                                : 'var(--text-color)'
                          }}
                        >
                          {req.urgency}
                        </strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-color-muted)', marginTop: '8px', textAlign: 'right' }}>
                      Timestamp: {req.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
