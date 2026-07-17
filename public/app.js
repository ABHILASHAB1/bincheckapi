let activeUser = null;

// DOM Elements
const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const userHeaderBlock = document.getElementById('user-header-block');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const clientKeyText = document.getElementById('client-key-text');
const balanceFill = document.getElementById('balance-fill');
const balanceText = document.getElementById('balance-text');
const restrictCountries = document.getElementById('restrict-countries');
const restrictSchemes = document.getElementById('restrict-schemes');

const btnGoogle = document.getElementById('btn-google-login');
const btnMock = document.getElementById('btn-mock-login');
const btnSignout = document.getElementById('btn-signout');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

const sandboxForm = document.getElementById('sandbox-form');
const sandboxBin = document.getElementById('sandbox-bin');
const curlContainer = document.getElementById('curl-container');
const curlCode = document.getElementById('curl-code');
const responseContainer = document.getElementById('response-container');
const responseCode = document.getElementById('response-code');
const toastElement = document.getElementById('toast');

// Sandbox Export Actions
const btnExportJson = document.getElementById('btn-export-json');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnShareDetails = document.getElementById('btn-share-details');

// Initialize portal authentication states
function init() {
  const cachedUser = localStorage.getItem('aou_user_session');
  if (cachedUser) {
    activeUser = JSON.parse(cachedUser);
    syncDashboardData();
  }
  
  // Check mock sign-in lock status
  const mockTries = parseInt(localStorage.getItem('mock_signin_tries') || '0');
  if (mockTries >= 2) {
    btnMock.style.opacity = '0.5';
    btnMock.style.cursor = 'not-allowed';
    btnMock.textContent = "⚙️ Simulate Sign-In (Locked)";
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('aou_theme') || 'light';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeUI('light');
  } else {
    document.body.classList.remove('light-theme');
    updateThemeUI('dark');
  }
}

function updateThemeUI(theme) {
  const themeBtnIcon = document.getElementById('theme-btn-icon');
  const themeBtnText = document.getElementById('theme-btn-text');
  if (!themeBtnIcon || !themeBtnText) return;
  
  if (theme === 'light') {
    themeBtnIcon.setAttribute('data-lucide', 'sun');
    themeBtnText.textContent = 'Light Mode';
  } else {
    themeBtnIcon.setAttribute('data-lucide', 'moon');
    themeBtnText.textContent = 'Dark Mode';
  }
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Perform session sign-in registration on the backend
async function registerSession(payload) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      activeUser = data.user;
      localStorage.setItem('aou_user_session', JSON.stringify(activeUser));
      syncDashboardData();
      showToast('Logged in successfully!');
    } else {
      showToast('Authentication failed.');
    }
  } catch (err) {
    showToast('Failed to connect to authentication server.');
  }
}

// Refresh balance details and limits from backend
async function refreshBalance() {
  if (!activeUser) return;
  try {
    const res = await fetch(`/v1/balance?api_key=${activeUser.api_key}`);
    if (res.ok) {
      const payload = await res.json();
      activeUser.balance = payload.data.balance;
      activeUser.limit_queries = payload.data.limit;
      localStorage.setItem('aou_user_session', JSON.stringify(activeUser));
      renderProgressGauge();
    }
  } catch (e) {
    console.error('Error fetching balance updates:', e);
  }
}

// Render balance details gauge
function renderProgressGauge() {
  const balance = activeUser.balance || 0;
  const limit = activeUser.limit_queries || 10;
  const pct = Math.max(0, Math.min(100, (balance / limit) * 100));
  balanceFill.style.width = `${pct}%`;
  balanceText.textContent = `${balance.toLocaleString()} / ${limit.toLocaleString()} Queries`;
  
  // Visual warnings
  if (balance <= 0) {
    balanceFill.style.background = 'var(--accent-danger)';
  } else if (balance <= 3) {
    balanceFill.style.background = 'var(--accent-warning)';
  } else {
    balanceFill.style.background = 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
  }
}

// Synchronize profile layouts
function syncDashboardData() {
  if (!activeUser) return;
  
  profileName.textContent = activeUser.client_name;
  profileEmail.textContent = activeUser.email || 'developer@aou.com';
  clientKeyText.textContent = activeUser.api_key;
  
  // Restrictions display
  restrictCountries.textContent = activeUser.allowed_countries || '*';
  restrictSchemes.textContent = (activeUser.allowed_schemes || '*').toUpperCase();
  
  renderProgressGauge();
  
  // Hide Auth panel, show Dashboard
  authPanel.classList.add('hidden');
  dashboardPanel.classList.remove('hidden');
  userHeaderBlock.classList.remove('hidden');
}

// Sign Out Handler
async function handleSignOut() {
  if (window.firebaseAuth.isConfigured) {
    try {
      await window.firebaseAuth.signOut();
    } catch (e) {}
  }
  
  localStorage.removeItem('aou_user_session');
  activeUser = null;
  
  dashboardPanel.classList.add('hidden');
  userHeaderBlock.classList.add('hidden');
  authPanel.classList.remove('hidden');
  
  // Clear Sandbox fields
  curlContainer.classList.add('hidden');
  responseContainer.classList.add('hidden');
  sandboxBin.value = '';
  
  showToast('Logged out successfully.');
}

// Google Auth Sign-In click
btnGoogle.addEventListener('click', async () => {
  if (!window.firebaseAuth.isConfigured) {
    showToast("Firebase not configured. Please use the 'Simulate Sign-In' option.");
    return;
  }
  
  try {
    const payload = await window.firebaseAuth.signIn();
    await registerSession(payload);
  } catch (err) {
    showToast("Google Authentication cancelled: " + err.message);
  }
});

// Mock/Simulated Sign-In click (for fast testing)
btnMock.addEventListener('click', async () => {
  let mockTries = parseInt(localStorage.getItem('mock_signin_tries') || '0');
  if (mockTries >= 2) {
    showToast("Mock sign-in limit exceeded (Max 2 tries). Please use Google Sign-In.");
    btnMock.style.opacity = '0.5';
    btnMock.style.cursor = 'not-allowed';
    btnMock.textContent = "⚙️ Simulate Sign-In (Locked)";
    return;
  }

  const email = prompt("Enter simulated email address:", "tester@aou.com");
  if (!email) return;
  const name = prompt("Enter simulated customer name:", "AOU Web Tester");
  if (!name) return;

  // Generate deterministic UID based on email for testing session persistence
  const mockUid = "MOCK-UID-" + btoa(email).replace(/=/g, '').toUpperCase();
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: mockUid,
        email: email,
        displayName: name
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      activeUser = data.user;
      localStorage.setItem('aou_user_session', JSON.stringify(activeUser));
      
      // Increment and persist tries counter
      mockTries += 1;
      localStorage.setItem('mock_signin_tries', mockTries);
      
      syncDashboardData();
      showToast('Simulated login successful!');
      
      if (mockTries >= 2) {
        btnMock.style.opacity = '0.5';
        btnMock.style.cursor = 'not-allowed';
        btnMock.textContent = "⚙️ Simulate Sign-In (Locked)";
      }
    } else {
      showToast('Authentication failed.');
    }
  } catch (err) {
    showToast('Failed to connect to authentication server.');
  }
});

btnSignout.addEventListener('click', handleSignOut);

// Sandbox execution handler
let lastLookupData = null;
sandboxForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeUser) return;
  
  const bin = sandboxBin.value.trim();
  const apiKey = activeUser.api_key;
  const url = `${window.location.origin}/v1/${bin}?api_key=${apiKey}`;
  
  curlCode.textContent = `curl "${url}"`;
  curlContainer.classList.remove('hidden');
  
  // Show preview immediately and add shimmers for loading state
  const previewPanel = document.getElementById('sandbox-card-preview');
  previewPanel.classList.remove('hidden');
  responseContainer.classList.add('hidden');
  document.getElementById('btn-toggle-raw').textContent = "Show Raw Response (JSON)";

  const shimmerFields = [
    document.getElementById('card-brand-logo'),
    document.getElementById('card-number-text'),
    document.getElementById('card-bank-name'),
    document.getElementById('card-type-category-text'),
    document.getElementById('spec-issuer'),
    document.getElementById('spec-scheme'),
    document.getElementById('spec-type'),
    document.getElementById('spec-category'),
    document.getElementById('spec-country')
  ];
  shimmerFields.forEach(el => el.classList.add('shimmer'));
  
  try {
    const res = await fetch(`/v1/${bin}?api_key=${apiKey}`);
    const payload = await res.json();
    
    // Remove shimmers
    shimmerFields.forEach(el => el.classList.remove('shimmer'));
    
    // Display raw response code inside code tag
    responseCode.textContent = JSON.stringify(payload, null, 2);

    if (payload.result === 200 && payload.data) {
      const card = payload.data;
      lastLookupData = card;
      
      // Update Virtual Card UI
      const vCard = document.getElementById('virtual-card');
      const cardBrandLogo = document.getElementById('card-brand-logo');
      const cardNumberText = document.getElementById('card-number-text');
      const cardBankName = document.getElementById('card-bank-name');
      const cardTypeCategoryText = document.getElementById('card-type-category-text');

      // Clear card background classes
      vCard.className = 'virtual-card';
      const schemeLower = (card.scheme || '').toLowerCase().trim();

      if (schemeLower === 'visa') {
        vCard.classList.add('card-brand-visa');
      } else if (schemeLower === 'mastercard') {
        vCard.classList.add('card-brand-mastercard');
      } else if (schemeLower === 'mada') {
        vCard.classList.add('card-brand-mada');
      } else {
        vCard.classList.add('card-brand-generic');
      }

      cardBrandLogo.textContent = card.scheme || 'NETWORK';
      
      // Format number display
      const binFormatted = card.bin.replace(/(.{4})/g, '$1 ').trim();
      cardNumberText.textContent = `${binFormatted} XX XX XXXX`;
      cardBankName.textContent = card.issuer || 'ISSUER BANK';
      cardTypeCategoryText.textContent = `${(card.type || 'DEBIT').toUpperCase()} / ${(card.category || 'STANDARD').toUpperCase()}`;

      // Update Card Specifications
      document.getElementById('spec-issuer').textContent = card.issuer || '--';
      document.getElementById('spec-scheme').textContent = (card.scheme || '--').toUpperCase();
      document.getElementById('spec-type').textContent = (card.type || '--').toUpperCase();
      document.getElementById('spec-category').textContent = (card.category || '--').toUpperCase();
      document.getElementById('spec-country').textContent = (card.country || '--').toUpperCase();

      // Update Switching Parameters
      const isSaudi = (card.country || '').trim().toUpperCase() === 'SAUDI ARABIA';
      const optBadge = document.getElementById('spec-optimized');
      optBadge.textContent = isSaudi ? 'ENABLED' : 'N/A';
      optBadge.className = 'status-badge ' + (isSaudi ? 'status-active' : 'status-suspended');

      const isMfaIssuer = (card.issuer || '').includes('Investment') || (card.issuer || '').includes('National') || (card.issuer || '').includes('ALFALAH');
      const mfaBadge = document.getElementById('spec-mfa');
      mfaBadge.textContent = isMfaIssuer ? 'YES' : 'NO';
      mfaBadge.className = 'status-badge ' + (isMfaIssuer ? 'status-active' : 'status-suspended');

    } else {
      lastLookupData = null;
      previewPanel.classList.add('hidden');
      responseContainer.classList.remove('hidden');
    }

    // Refresh balance progress bar immediately after query finishes
    await refreshBalance();
  } catch (err) {
    shimmerFields.forEach(el => el.classList.remove('shimmer'));
    lastLookupData = null;
    previewPanel.classList.add('hidden');
    responseCode.textContent = JSON.stringify({ error: "Network lookup failed" }, null, 2);
    responseContainer.classList.remove('hidden');
  }
});

// Toggle raw JSON response container
document.getElementById('btn-toggle-raw').addEventListener('click', (e) => {
  const container = document.getElementById('response-container');
  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    container.classList.remove('hidden');
    e.target.textContent = "Hide Raw Response (JSON)";
  } else {
    container.classList.add('hidden');
    e.target.textContent = "Show Raw Response (JSON)";
  }
});

// Toast popup helpers
function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.remove('hidden');
  setTimeout(() => {
    toastElement.classList.add('hidden');
  }, 3000);
}

// Copy clipboard helpers
window.copyClientKey = function() {
  if (!activeUser) return;
  navigator.clipboard.writeText(activeUser.api_key).then(() => {
    showToast("Copied API Secret Key!");
  });
};

window.copyText = function(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    navigator.clipboard.writeText(el.textContent).then(() => {
      showToast("Copied command!");
    });
  }
};

// Theme Switcher click listener
if (btnThemeToggle) {
  btnThemeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('aou_theme', newTheme);
    updateThemeUI(newTheme);
  });
}

// Export JSON
if (btnExportJson) {
  btnExportJson.addEventListener('click', () => {
    if (!lastLookupData) {
      showToast("No active data to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(lastLookupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin_${lastLookupData.bin}_spec.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported JSON successfully!");
  });
}

// Export CSV
if (btnExportCsv) {
  btnExportCsv.addEventListener('click', () => {
    if (!lastLookupData) {
      showToast("No active data to export.");
      return;
    }
    const headers = ['BIN', 'Issuer', 'Scheme', 'Type', 'Category', 'Country', 'Domestic Optimized'];
    const isSaudi = (lastLookupData.country || '').trim().toUpperCase() === 'SAUDI ARABIA';
    const row = [
      lastLookupData.bin,
      `"${lastLookupData.issuer || 'N/A'}"`,
      lastLookupData.scheme || 'N/A',
      lastLookupData.type || 'N/A',
      lastLookupData.category || 'N/A',
      lastLookupData.country || 'N/A',
      isSaudi ? 'ENABLED' : 'N/A'
    ];
    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin_${lastLookupData.bin}_spec.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported CSV successfully!");
  });
}

// Share details link
if (btnShareDetails) {
  btnShareDetails.addEventListener('click', () => {
    if (!lastLookupData) {
      showToast("No active data to share.");
      return;
    }
    const shareText = `BIN Lookup details for ${lastLookupData.bin}:\n` +
      `- Issuer: ${lastLookupData.issuer || 'N/A'}\n` +
      `- Brand: ${lastLookupData.scheme || 'N/A'}\n` +
      `- Type: ${lastLookupData.type || 'N/A'}\n` +
      `- Country: ${lastLookupData.country || 'N/A'}\n` +
      `Checked via AOU BIN Check Portal.`;
    navigator.clipboard.writeText(shareText).then(() => {
      showToast("Copied card specs details to clipboard!");
    });
  });
}

// Initialize Lucide icons on start
if (window.lucide) {
  lucide.createIcons();
}

// Start
init();
