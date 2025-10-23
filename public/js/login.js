/**
 * Utility function to show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Utility function to hide error message
 */
function hideError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Clear previous errors
  hideError();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    // Disable button saat proses
    const submitBtn = document.querySelector('.login-button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Loading...</span>';

    const response = await fetch('/api/users/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Simpan user ke localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect ke calculator
      window.location.href = '/calculator';
    } else {
      // Tampilkan error di div
      const errorMsg = data.error || data.details?.[0] || 'Login gagal';
      showError(errorMsg);
      
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span><svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>';
    }
  } catch (err) {
    // Tampilkan error di div
    showError('Login gagal: ' + err.message);
    
    // Re-enable button
    const submitBtn = document.querySelector('.login-button');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Sign In</span><svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>';
  }
});