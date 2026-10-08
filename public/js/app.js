/**
 * Main Interactive Application Script for Digital Savings Account Opening Platform.
 * Manages screen transitions, bilingual translation, dark/light theme, and live API state.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const appState = {
    fullName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    ssn: '******102',
    idDocumentUploaded: true,
    livenessVerified: true,
    currentApplicationId: null,
    status: null,
    cifNumber: null,
    ddaNumber: null
  };

  // 1. Navigation & Screen Router
  function navigate() {
    const allScreens = document.querySelectorAll('.screen');
    let hash = window.location.hash.substring(1);
    if (!hash) { hash = 'welcome'; }

    let targetScreen = document.getElementById(hash);
    if (!targetScreen) { targetScreen = document.getElementById('welcome'); }

    allScreens.forEach(screen => screen.classList.remove('active'));
    targetScreen.classList.add('active');

    // Trigger screen-specific data loaders
    if (hash === 'compliance_portal') {
      loadCompliancePortalData();
    } else if (hash === 'review') {
      updateReviewScreenData();
    } else if (hash === 'submitting') {
      executeSubmissionFlow();
    }

    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', navigate);

  // 2. Theme Switcher
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  if (themeToggle) {
    themeToggle.checked = savedTheme === 'dark';
    themeToggle.addEventListener('change', () => {
      const newTheme = themeToggle.checked ? 'dark' : 'light';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // 3. Language Switcher (REQ-F-014)
  const languageSelector = document.getElementById('languageSelector');
  const body = document.body;
  const savedLang = localStorage.getItem('language') || 'en';
  body.setAttribute('data-lang', savedLang);
  if (languageSelector) {
    languageSelector.value = savedLang;
    languageSelector.addEventListener('change', (e) => {
      const newLang = e.target.value;
      body.setAttribute('data-lang', newLang);
      localStorage.setItem('language', newLang);
    });
  }

  // 4. Personal Info Form Submission
  const personalInfoForm = document.getElementById('personalInfoForm');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('email');
      const ssnInput = document.getElementById('ssn');

      if (nameInput) appState.fullName = nameInput.value;
      if (emailInput) appState.email = emailInput.value;
      if (ssnInput) appState.ssn = ssnInput.value;

      window.location.hash = 'doc_capture';
    });
  }

  // 5. Update Review Screen Details
  function updateReviewScreenData() {
    const reviewName = document.getElementById('reviewFullName');
    const reviewEmail = document.getElementById('reviewEmail');
    const reviewSsn = document.getElementById('reviewSsn');

    if (reviewName) reviewName.textContent = appState.fullName || 'Alex Rivera';
    if (reviewEmail) reviewEmail.textContent = appState.email || 'you@example.com';
    if (reviewSsn) {
      const ssnVal = appState.ssn || '******102';
      const cleanDigits = ssnVal.replace(/\D/g, '');
      const masked = cleanDigits.length >= 3 ? `******${cleanDigits.slice(-3)}` : '******102';
      reviewSsn.textContent = masked;
    }
  }

  // 6. Submitting Flow -> API Call -> Status Transition
  async function executeSubmissionFlow() {
    try {
      const payload = {
        full_name: appState.fullName,
        email: appState.email,
        ssn: appState.ssn,
        id_document_uploaded: appState.idDocumentUploaded,
        liveness_verified: appState.livenessVerified,
        language: body.getAttribute('data-lang') || 'en'
      };

      const result = await window.apiClient.initiateAccount(payload);
      appState.currentApplicationId = result.application_id;
      appState.status = result.status;
      appState.cifNumber = result.cif_number;
      appState.ddaNumber = result.dda_number;

      setTimeout(() => {
        window.location.hash = 'status';
        renderStatusCards(result);
      }, 1200);
    } catch (err) {
      console.error('Submission error:', err);
      setTimeout(() => {
        window.location.hash = 'status';
        renderStatusCards({ status: 'REJECTED', message: err.message });
      }, 1200);
    }
  }

  // 7. Render Status Screen
  function renderStatusCards(data) {
    document.querySelectorAll('.status-card').forEach(c => c.style.display = 'none');

    const status = data.status || 'APPROVED';
    let targetCardId = 'status-approved';
    if (status === 'IN_REVIEW' || status === 'PENDING') {
      targetCardId = 'status-pending';
    } else if (status === 'REJECTED') {
      targetCardId = 'status-rejected';
    }

    const card = document.getElementById(targetCardId);
    if (card) {
      card.style.display = 'block';
      const cifEl = card.querySelector('.cif-number');
      const ddaEl = card.querySelector('.dda-number');
      if (cifEl && data.cif_number) cifEl.textContent = data.cif_number;
      if (ddaEl && data.dda_number) ddaEl.textContent = data.dda_number;
    }
  }

  // 8. Load & Render Compliance Portal Table (REQ-F-013)
  async function loadCompliancePortalData() {
    const tableBody = document.getElementById('complianceTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Loading applications...</td></tr>';

    try {
      const data = await window.apiClient.getComplianceApplications();
      if (!data.applications || data.applications.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No pending applications found.</td></tr>';
        return;
      }

      tableBody.innerHTML = '';
      data.applications.forEach(app => {
        const tr = document.createElement('tr');
        const badgeClass = (app.status || 'APPROVED').toLowerCase().replace(' ', '_');
        tr.innerHTML = `
          <td><strong>${app.application_id}</strong></td>
          <td>${app.full_name}</td>
          <td><code>${app.ssn_masked}</code></td>
          <td><span class="status-badge ${badgeClass}">${app.status}</span></td>
          <td>${app.risk_score ? app.risk_score.toFixed(1) : '10.0'}</td>
          <td>${app.created_at ? app.created_at.split(' ')[0] : 'Today'}</td>
          <td>
            ${app.status === 'IN_REVIEW' || app.status === 'PENDING' ? `
              <button class="btn btn-success btn-sm btn-approve" data-id="${app.application_id}">Approve</button>
              <button class="btn btn-danger btn-sm btn-reject" data-id="${app.application_id}">Reject</button>
            ` : `<span class="text-muted">Decided</span>`}
          </td>
        `;
        tableBody.appendChild(tr);
      });

      // Attach button actions
      tableBody.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          await window.apiClient.submitComplianceDecision(id, 'APPROVE', 'Approved via Compliance Review Portal');
          loadCompliancePortalData();
        });
      });

      tableBody.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          await window.apiClient.submitComplianceDecision(id, 'REJECT', 'Rejected via Compliance Review Portal');
          loadCompliancePortalData();
        });
      });

    } catch (err) {
      console.error('Portal load error:', err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${err.message}</td></tr>`;
    }
  }

  // Initialize
  navigate();
});
