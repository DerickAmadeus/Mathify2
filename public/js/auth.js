/**
 * Authentication Check & Protection
 * Protects pages that require login
 */

document.addEventListener('DOMContentLoaded', function() {
  checkAuthAndProtectPage();
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
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) {
      userNameEl.textContent = userData.username;
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
