/**
 * Authentication Check & Protection
 * Protects pages that require login
 */

document.addEventListener('DOMContentLoaded', function() {
  checkAuthAndProtectPage();
  initializeDropdownMenu();
});

/**
 * Check if user is authenticated
 * If not, redirect to login
 */
function checkAuthAndProtectPage() {
  const user = localStorage.getItem('user');
  
  if (!user) {
    console.log('❌ Not logged in, redirecting to login...');
    window.location.href = '/login';
    return false;
  }
  
  try {
    const userData = JSON.parse(user);
    console.log('✅ Logged in as:', userData.username);
    
    // Update user name in UI if element exists
    const userNameEl = document.querySelector('#user-name-display');
    if (userNameEl) {
      userNameEl.textContent = userData.username;
    }
    
    // Update dropdown user info
    const dropdownUsername = document.querySelector('#dropdown-username');
    const dropdownEmail = document.querySelector('#dropdown-email');
    if (dropdownUsername) {
      dropdownUsername.textContent = userData.username;
    }
    if (dropdownEmail) {
      dropdownEmail.textContent = userData.email || 'No email';
    }
    
    return userData;
  } catch (err) {
    console.error('❌ Invalid user data in localStorage');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return false;
  }
}

/**
 * Initialize dropdown menu toggle functionality
 */
function initializeDropdownMenu() {
  const toggle = document.querySelector('#user-account-toggle');
  const menu = document.querySelector('#user-dropdown-menu');
  
  if (!toggle || !menu) {
    console.warn('⚠️ Dropdown menu elements not found');
    return;
  }
  
  // Toggle dropdown on header click
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-account-wrapper')) {
      menu.style.display = 'none';
    }
  });
}

/**
 * Get current logged-in user
 * @returns {object|null} User object or null if not logged in
 */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  if (!user) return null;
  
  try {
    return JSON.parse(user);
  } catch (err) {
    console.error('❌ Invalid user data');
    return null;
  }
}

/**
 * Logout user
 * Clear localStorage and redirect to login
 */
function logout() {
  console.log('🚪 Logging out...');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
