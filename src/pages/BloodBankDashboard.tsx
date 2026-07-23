import React, { useState } from 'react';
import { useAppState } from '../state';

export const BloodBankDashboard: React.FC = () => {
  const { staffUser, logoutStaff, inventory, bloodRequests } = useAppState();
  const [replenishGroup, setReplenishGroup] = useState('O+');
  const [replenishUnits, setReplenishUnits] = useState(10);
  const [localInventory, setLocalInventory] = useState(inventory);

  if (!staffUser || staffUser.role !== 'BankManager') {
    return <p>Access Denied. Blood Bank Manager credentials required.</p>;
  }

  const handleReplenish = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalInventory((prev) => ({
      ...prev,
      [replenishGroup]: (prev[replenishGroup] || 0) + Number(replenishUnits)
    }));
  };

  // Get list of blood groups from state/local inventory
  const bloodGroups = Object.keys(localInventory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Portal Header */}
      <div className="portal-header">
        <div>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Blood Bank Regional Control</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-color-muted)' }}>
            Logged in as {staffUser.name} ({staffUser.role})
          </p>
        </div>
        <button onClick={logoutStaff} className="btn btn-secondary">
          Sign Out Portal
        </button>
      </div>

      {/* Stats Board */}
      <div className="dashboard-grid">
        <div className="stat-widget">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-color-muted)', fontWeight: '600' }}>
            Total Regional Stocks
          </span>
          <span className="stat-val">
            {Object.values(localInventory).reduce((a, b) => a + b, 0)} Units
          </span>
        </div>
        <div className="stat-widget">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-color-muted)', fontWeight: '600' }}>
            Matching Demand Streams
          </span>
          <span className="stat-val" style={{ color: 'var(--accent-color)' }}>
            {bloodRequests.filter((r) => r.status === 'Matching').length} Urgent
          </span>
        </div>
        <div className="stat-widget">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-color-muted)', fontWeight: '600' }}>
            Active Regional Centers
          </span>
          <span className="stat-val" style={{ color: 'var(--success-color)' }}>
            5 Clinics
          </span>
        </div>
      </div>

      {/* Main Panel Layout */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Anonymized Inventory & Replenishment */}
        <div style={{ flex: 1.5, minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Inventory Table */}
          <div className="card" style={{ margin: 0 }}>
            <h4 style={{ margin: '0 0 15px', color: 'var(--primary-color)' }}>Anonymized Inventory Stockpiles</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {bloodGroups.map((grp) => {
                const stock = localInventory[grp];
                const isLow = stock < 10;
                return (
                  <div
                    key={grp}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      textAlign: 'center',
                      backgroundColor: isLow ? '#FFEBEE' : 'var(--surface-bg)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: isLow ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                      {grp}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginTop: '4px' }}>
                      {stock} Units
                    </div>
                    {isLow && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                        LOW STOCK
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replenish Stock */}
          <div className="card" style={{ margin: 0 }}>
            <h4 style={{ margin: '0 0 15px', color: 'var(--primary-color)' }}>Replenish Stocks (Simulated Deliveries)</h4>
            <form onSubmit={handleReplenish} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Blood Group</label>
                <select
                  className="form-control"
                  value={replenishGroup}
                  onChange={(e) => setReplenishGroup(e.target.value)}
                >
                  {bloodGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Units Added</label>
                <input
                  type="number"
                  className="form-control"
                  value={replenishUnits}
                  onChange={(e) => setReplenishUnits(Number(e.target.value))}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                Refill Stock
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Geospatial Matching Demand & Anonymized Demographics */}
        <div style={{ flex: 1.2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Demand Map Card */}
          <div className="card" style={{ margin: 0 }}>
            <h4 style={{ margin: '0 0 5px', color: 'var(--primary-color)' }}>Geospatial Demand Map</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
              Real-time matching hotspots across Bay Area region
            </p>

            <div className="map-simulation">
              {/* Map grid lines */}
              <div style={{ position: 'absolute', top: '50px', left: 0, right: 0, height: '1px', backgroundColor: '#d0e0f0' }} />
              <div style={{ position: 'absolute', top: '150px', left: 0, right: 0, height: '1px', backgroundColor: '#d0e0f0' }} />
              <div style={{ position: 'absolute', left: '100px', top: 0, bottom: 0, width: '1px', backgroundColor: '#d0e0f0' }} />
              <div style={{ position: 'absolute', left: '220px', top: 0, bottom: 0, width: '1px', backgroundColor: '#d0e0f0' }} />

              {/* Match hotspot markers (anonymized!) */}
              <div className="map-marker" style={{ top: '80px', left: '120px' }} />
              <div className="map-label" style={{ top: '96px', left: '100px' }}>O- Demand (St. Francis)</div>

              <div className="map-marker" style={{ top: '160px', left: '180px', backgroundColor: 'var(--primary-color)' }} />
              <div className="map-label" style={{ top: '176px', left: '160px' }}>O+ Clinic Center</div>
            </div>
          </div>

          {/* Anonymized Donor Demographics Chart */}
          <div className="card" style={{ margin: 0 }}>
            <h4 style={{ margin: '0 0 5px', color: 'var(--primary-color)' }}>Anonymized Donor Statistics</h4>
            <p style={{ margin: '0 0 15px', fontSize: '0.75rem', color: 'var(--text-color-muted)' }}>
              Counts by region (All direct PII stripped)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <span>North Region</span>
                  <span>140 Donors</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E1E8ED', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--primary-color)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <span>South Region</span>
                  <span>88 Donors</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E1E8ED', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--primary-color)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <span>Downtown Hub</span>
                  <span>182 Donors</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E1E8ED', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: '90%', height: '100%', backgroundColor: 'var(--primary-color)' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
