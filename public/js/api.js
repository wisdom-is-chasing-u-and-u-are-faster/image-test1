/**
 * Client-Side API Layer for Digital Savings Account Opening Platform.
 * Communicates with backend REST API endpoints defined in api_contract.json.
 */

const API_BASE_URL = '/api/v1';

const apiClient = {
  /**
   * Health and readiness probe
   */
  async checkHealth() {
    try {
      const response = await fetch('/health');
      return await response.json();
    } catch (err) {
      console.error('Health check failed:', err);
      return { status: 'error', message: err.message };
    }
  },

  /**
   * Initiate customer onboarding session (REQ-F-008)
   */
  async initiateAccount(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/accounts/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate application');
      }
      return await response.json();
    } catch (err) {
      console.error('Account initiation error:', err);
      throw err;
    }
  },

  /**
   * Query status of an application session (REQ-F-009)
   */
  async getAccountStatus(applicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/accounts/${encodeURIComponent(applicationId)}/status`);
      if (!response.ok) {
        throw new Error(`Application status lookup failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Status fetch error:', err);
      throw err;
    }
  },

  /**
   * Retrieve all compliance applications (REQ-F-013)
   */
  async getComplianceApplications() {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/applications`);
      if (!response.ok) {
        throw new Error(`Failed to load compliance list: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Compliance fetch error:', err);
      return { total: 0, applications: [] };
    }
  },

  /**
   * Submit Compliance Officer Decision (REQ-F-013)
   */
  async submitComplianceDecision(applicationId, decision, notes = '', reviewerId = 'officer-01') {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/applications/${encodeURIComponent(applicationId)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes, reviewer_id: reviewerId })
      });
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to record compliance decision');
      }
      return await response.json();
    } catch (err) {
      console.error('Compliance decision error:', err);
      throw err;
    }
  }
};

window.apiClient = apiClient;
