// Constants
const API_URL = 'http://localhost:3000/api'; // Adjust to your backend port

// UI Elements - Sections
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const managementSection = document.getElementById('management-section');

// UI Elements - Management Console
const roleSelector = document.getElementById('role-selector');
const permissionMatrix = document.getElementById('permission-matrix');
const savePermissionsBtn = document.getElementById('save-permissions-btn');
const saveStatus = document.getElementById('save-status');
const managementActions = document.getElementById('management-actions');

// UI Elements - Login
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

// UI Elements - Dashboard
const userEmailDisplay = document.getElementById('user-email');
const userRoleBadge = document.getElementById('user-role-badge');
const permissionsList = document.getElementById('permissions-list');
const logoutBtn = document.getElementById('logout-btn');
const noPermsMsg = document.getElementById('no-perms-msg');

// ACL Feature boxes
const features = {
  'item:create': document.getElementById('feat-create'),
  'item:read': document.getElementById('feat-read'),
  'item:delete': document.getElementById('feat-delete'),
};

// Initial State Check
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  const savedToken = localStorage.getItem('token');

  if (savedUser && savedToken) {
    showDashboard(JSON.parse(savedUser));
  }
});

// LOGIN ACTION
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Authenticating...';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Success! Store data
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    showDashboard(data.data.user);
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Authenticate Access';
  }
});

// LOGOUT ACTION
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
});

// UI UPDATER
function showDashboard(user) {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');

  userEmailDisplay.textContent = user.email;
  userRoleBadge.textContent = `Role: ${user.role || 'User'}`;
  userRoleBadge.className = `user-badge badge-${user.role === 'admin' ? 'admin' : 'user'}`;

  // Render Permissions Tags
  permissionsList.innerHTML = '';
  const perms = user.permissions || [];
  
  if (perms.length === 0) {
    permissionsList.innerHTML = '<span style="color:var(--danger); font-size:0.7rem;">None</span>';
  } else {
    perms.forEach(p => {
      const tag = document.createElement('span');
      tag.className = 'perm-tag';
      tag.textContent = p;
      permissionsList.appendChild(tag);
    });
  }

  // Update Feature Visibility based on Permissions
  let hasAnyFeature = false;
  
  Object.keys(features).forEach(permissionKey => {
    const element = features[permissionKey];
    if (perms.includes(permissionKey)) {
      element.classList.remove('hidden');
      hasAnyFeature = true;
    } else {
      element.classList.add('hidden');
    }
  });

  // Show Management Console if user is admin
  if (user.role === 'admin') {
    managementSection.classList.remove('hidden');
    initManagementConsole();
  } else {
    managementSection.classList.add('hidden');
  }

  // Toggle "No Permissions" empty state message
  if (hasAnyFeature) {
    noPermsMsg.classList.add('hidden');
  } else {
    noPermsMsg.classList.remove('hidden');
  }
}

// --- ACL MANAGEMENT CONSOLE LOGIC ---

let allPermissions = {}; // Grouped by module
let currentRoles = [];

async function initManagementConsole() {
  await fetchRoles();
  await fetchAllPermissions();
  
  roleSelector.onchange = (e) => {
    const roleId = e.target.value;
    const selectedRole = currentRoles.find(r => r.id == roleId);
    renderPermissionMatrix(selectedRole);
    managementActions.classList.remove('hidden');
  };

  savePermissionsBtn.onclick = handleSavePermissions;
}

async function fetchRoles() {
  console.log('Fetching roles from:', `${API_URL}/roles`);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
      return;
    }

    const res = await fetch(`${API_URL}/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Fetch roles failed:', res.status, errorData);
      roleSelector.innerHTML = `<option value="" disabled selected>-- Error ${res.status} --</option>`;
      return;
    }

    const data = await res.json();
    console.log('Roles data received:', data);
    
    // Defensive check: ensure data.data is an array
    currentRoles = Array.isArray(data.data) ? data.data : [];

    if (currentRoles.length === 0) {
      console.warn('No roles found in data.data:', data);
      roleSelector.innerHTML = '<option value="" disabled selected>-- No roles in DB --</option>';
      return;
    }

    // Populate dropdown
    roleSelector.innerHTML = '<option value="" disabled selected>-- Choose a Role --</option>';
    currentRoles.forEach(role => {
      if (!role.name) return;
      const opt = document.createElement('option');
      opt.value = role.id;
      opt.textContent = role.name.charAt(0).toUpperCase() + role.name.slice(1);
      roleSelector.appendChild(opt);
    });
    console.log('Dropdown populated with', currentRoles.length, 'roles');
  } catch (err) {
    console.error('Network or Parsing Error fetching roles:', err);
    roleSelector.innerHTML = '<option value="" disabled selected>-- Fetch Error --</option>';
  }
}

async function fetchAllPermissions() {
  try {
    const res = await fetch(`${API_URL}/roles/permissions`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    allPermissions = data.data; // Already grouped by module from backend
  } catch (err) {
    console.error('Error fetching permissions:', err);
  }
}

function renderPermissionMatrix(role) {
  permissionMatrix.innerHTML = '';
  
  // Get active permission IDs for this role
  const activePerms = role.permissions || [];

  Object.entries(allPermissions).forEach(([module, perms]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'permission-group';
    
    groupDiv.innerHTML = `<h4>${module}</h4>`;
    
    perms.forEach(p => {
      const isChecked = activePerms.includes(p.name);
      
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      item.innerHTML = `
        <input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} data-action="${p.action}">
        <div class="checkbox-label">
          <span class="action-name">${p.name}</span>
          <span class="action-desc">${p.description || ''}</span>
        </div>
      `;
      groupDiv.appendChild(item);
    });

    permissionMatrix.appendChild(groupDiv);
  });
}

async function handleSavePermissions() {
  const roleId = roleSelector.value;
  if (!roleId) return;

  const checkedInputs = permissionMatrix.querySelectorAll('input[type="checkbox"]:checked');
  const permissionIds = Array.from(checkedInputs).map(i => parseInt(i.value));

  saveStatus.textContent = '';
  saveStatus.className = '';
  savePermissionsBtn.disabled = true;
  savePermissionsBtn.innerHTML = '<span class="spinner"></span> Updating...';

  try {
    const res = await fetch(`${API_URL}/roles/${roleId}/assign-permissions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ permissionIds })
    });

    if (!res.ok) throw new Error('Failed to update');

    saveStatus.textContent = '✅ Saved Successfully!';
    saveStatus.className = 'success';
    
    // Refresh local role data (optional: requires re-login or page refresh to see effect on current user)
    await fetchRoles(); 
    
  } catch (err) {
    saveStatus.textContent = '❌ Update Failed';
    saveStatus.className = 'error';
  } finally {
    savePermissionsBtn.disabled = false;
    savePermissionsBtn.textContent = 'Update Permissions';
  }
}
