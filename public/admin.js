let keysList = [];
let filteredList = [];

// DOM Elements
const keysTableBody = document.querySelector('#keys-table tbody');
const searchFilterInput = document.getElementById('search-filter');
const toastElement = document.getElementById('toast');
const lockScreenOverlay = document.getElementById('admin-lock-screen');
const lockForm = document.getElementById('lock-form');
const lockErrorMsg = document.getElementById('lock-error');
const adminPinInput = document.getElementById('admin-pin');
const btnSignOut = document.getElementById('btn-admin-signout');

// Get active session token
function getAdminToken() {
  return localStorage.getItem('adminToken') || '';
}

// Show/Hide Lock Overlay
function showLockScreen() {
  lockScreenOverlay.classList.remove('hidden');
  adminPinInput.value = '';
  adminPinInput.focus();
}

function hideLockScreen() {
  lockScreenOverlay.classList.add('hidden');
  adminPinInput.value = '';
  lockErrorMsg.classList.add('hidden');
}

// Handle Admin Sign Out
function handleSignOut() {
  localStorage.removeItem('adminToken');
  showLockScreen();
  showToast('Logged out securely');
}

// Fetch and load keys from API
async function loadKeys() {
  const token = getAdminToken();
  if (!token) {
    showLockScreen();
    return;
  }
  try {
    const res = await fetch('/api/keys', {
      headers: { 'X-Admin-Token': token }
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }
    
    keysList = await res.json();
    applyFilter();
    hideLockScreen();
  } catch (err) {
    console.error('Error fetching API keys:', err);
    showToast('Failed to connect to server');
  }
}

// Apply text filtering on Client Name, Email, or Firebase UID
function applyFilter() {
  const query = searchFilterInput.value.toLowerCase().trim();
  if (!query) {
    filteredList = [...keysList];
  } else {
    filteredList = keysList.filter(k => 
      (k.client_name || '').toLowerCase().includes(query) ||
      (k.email || '').toLowerCase().includes(query) ||
      (k.firebase_uid || '').toLowerCase().includes(query) ||
      (k.api_key || '').toLowerCase().includes(query)
    );
  }
  renderKeysTable();
}

// Render keys list inside the HTML Table
function renderKeysTable() {
  if (filteredList.length === 0) {
    keysTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No matching customers found.</td>
      </tr>
    `;
    return;
  }

  keysTableBody.innerHTML = '';
  filteredList.forEach(key => {
    const tr = document.createElement('tr');
    
    const displayKey = key.api_key;
    const obscuredKey = displayKey.slice(0, 10) + '...' + displayKey.slice(-5);
    
    const isSuspended = key.status === 'suspended';
    const statusBadge = isSuspended 
      ? `<span class="status-badge status-suspended">Suspended</span>` 
      : `<span class="status-badge status-active">Active</span>`;
      
    const userBadge = key.firebase_uid
      ? `<div class="user-id-badge" title="UID: ${key.firebase_uid}">ID: ${key.firebase_uid.substring(0,18)}...</div>`
      : `<div class="user-id-badge" style="background-color: rgba(99, 102, 241, 0.05); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.1);">Admin manual</div>`;

    tr.innerHTML = `
      <td data-label="Client">
        <div style="font-weight: 600;">${key.client_name}</div>
        ${key.email ? `<div class="text-email">${key.email}</div>` : ''}
        ${userBadge}
        <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">
          🌍 ${key.allowed_countries} | 💳 ${key.allowed_schemes.toUpperCase()}
        </div>
      </td>
      <td data-label="API Key">
        <div class="key-cell">
          <code class="key-text" id="key-${key.id}">${obscuredKey}</code>
          <button class="action-row-btn" onclick="copyTextToClipboard('${key.api_key}')" title="Copy to clipboard">📋</button>
        </div>
      </td>
      <td data-label="Balance" style="font-family: var(--font-mono); font-weight: 600;">${key.balance.toLocaleString()}</td>
      <td data-label="Query Limit" style="font-family: var(--font-mono); color: var(--text-muted);">${key.limit_queries.toLocaleString()}</td>
      <td data-label="Expires" style="font-size: 11px; color: var(--text-muted);">${key.expires_at.split(' ')[0]}</td>
      <td data-label="Status">${statusBadge}</td>
      <td data-label="Actions">
        <div class="action-group">
          <button class="btn btn-icon btn-toggle-suspend" onclick="toggleKeyStatus(${key.id}, '${key.status}')" title="${isSuspended ? 'Activate' : 'Suspend'} key">
            ${isSuspended ? '🟢' : '⏸️'}
          </button>
          <button class="btn btn-icon btn-adjust" onclick="adjustKeyBalance(${key.id}, ${key.balance}, ${key.limit_queries})" title="Adjust Balance & Limit">
            ✏️
          </button>
          <button class="btn btn-icon btn-topup" onclick="topUpKey(${key.id})" title="Top up +10,000 queries">
            ⚡
          </button>
          <button class="btn btn-icon btn-delete" onclick="deleteKey(${key.id})" title="Revoke Key">
            🗑️
          </button>
        </div>
      </td>
    `;
    keysTableBody.appendChild(tr);
  });
}

// Issue Key Submission Handler (Manual)
document.getElementById('key-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientName = document.getElementById('client-name').value;
  const limitQueries = parseInt(document.getElementById('query-limit').value) || 50000;
  const durationMonths = parseInt(document.getElementById('duration').value) || 12;
  const allowedCountries = document.getElementById('allowed-countries').value || '*';
  const allowedSchemes = document.getElementById('allowed-schemes').value || '*';

  try {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Token': getAdminToken()
      },
      body: JSON.stringify({
        client_name: clientName,
        limit_queries: limitQueries,
        expires_months: durationMonths,
        allowed_countries: allowedCountries,
        allowed_schemes: allowedSchemes
      })
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }

    if (res.ok) {
      document.getElementById('client-name').value = '';
      document.getElementById('allowed-countries').value = '*';
      document.getElementById('allowed-schemes').value = '*';
      showToast('API Key generated successfully!');
      await loadKeys();
    } else {
      const err = await res.json();
      showToast('Error: ' + err.error);
    }
  } catch (error) {
    showToast('Failed to connect to server');
  }
});

// Toggle Status (Active / Suspended)
async function toggleKeyStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  try {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Token': getAdminToken()
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }

    if (res.ok) {
      showToast(`Key status updated to ${newStatus}`);
      await loadKeys();
    }
  } catch (err) {
    showToast('Failed to update status');
  }
}

// Top Up Key balance (+10,000 queries)
async function topUpKey(id) {
  try {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Token': getAdminToken()
      },
      body: JSON.stringify({ top_up_balance: 10000 })
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }

    if (res.ok) {
      showToast('Balance topped up successfully (+10,000)');
      await loadKeys();
    }
  } catch (err) {
    showToast('Failed to top up balance');
  }
}

// Custom adjust balance & limit dialog controls
async function adjustKeyBalance(id, currentBalance, currentLimit) {
  const newLimitStr = prompt("Enter new maximum query limit for this client:", currentLimit);
  if (newLimitStr === null) return;
  const newLimit = parseInt(newLimitStr);
  if (isNaN(newLimit)) {
    alert("Invalid limit number.");
    return;
  }

  const newBalanceStr = prompt("Enter new remaining query balance for this client:", currentBalance);
  if (newBalanceStr === null) return;
  const newBalance = parseInt(newBalanceStr);
  if (isNaN(newBalance)) {
    alert("Invalid balance number.");
    return;
  }

  try {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Token': getAdminToken()
      },
      body: JSON.stringify({
        balance: newBalance,
        limit_queries: newLimit
      })
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }

    if (res.ok) {
      showToast("Balance and limit adjusted successfully!");
      await loadKeys();
    } else {
      showToast("Failed to save changes.");
    }
  } catch (err) {
    showToast('Failed to connect to server');
  }
}

// Delete Key
async function deleteKey(id) {
  if (!confirm('Are you sure you want to permanently revoke this API Key? Client connections using this key will fail immediately.')) return;
  try {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': getAdminToken() }
    });
    
    if (res.status === 401) {
      handleSignOut();
      return;
    }

    if (res.ok) {
      showToast('API Key revoked successfully');
      await loadKeys();
    }
  } catch (err) {
    showToast('Failed to delete key');
  }
}

// Copy raw text to clipboard
function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied key to clipboard!');
  }).catch(() => {
    showToast('Failed to copy text');
  });
}

// Admin Lock Screen Form Handler
lockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = adminPinInput.value;
  lockErrorMsg.classList.add('hidden');

  try {
    // Attempt authentication by requesting the keys list with the passcode
    const res = await fetch('/api/keys', {
      headers: { 'X-Admin-Token': pin }
    });

    if (res.ok) {
      localStorage.setItem('adminToken', pin);
      keysList = await res.json();
      applyFilter();
      hideLockScreen();
      showToast('Welcome back, Admin!');
    } else {
      lockErrorMsg.classList.remove('hidden');
      adminPinInput.value = '';
      adminPinInput.focus();
    }
  } catch (err) {
    showToast('Failed to connect to authentication service');
  }
});

// Manual refresh
document.getElementById('btn-refresh').addEventListener('click', loadKeys);

// Filter bindings
searchFilterInput.addEventListener('input', applyFilter);

// Sign Out click handler
btnSignOut.addEventListener('click', handleSignOut);

// Theme Switcher bindings
const btnThemeToggle = document.getElementById('btn-theme-toggle');

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

if (btnThemeToggle) {
  btnThemeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('aou_theme', newTheme);
    updateThemeUI(newTheme);
  });
}

// Init theme on load
const savedTheme = localStorage.getItem('aou_theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
  updateThemeUI('light');
} else {
  document.body.classList.remove('light-theme');
  updateThemeUI('dark');
}

// Initialize Lucide icons on start
if (window.lucide) {
  lucide.createIcons();
}

// Initial Load on page entry
loadKeys();
