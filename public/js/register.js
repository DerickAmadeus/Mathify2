// register.js - handles register form submission
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('error-message');
  const submitBtn = document.getElementById('register-button');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (!username || !email || !password || !confirm) {
      showError('All fields are required');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirm) {
      showError('Passwords do not match');
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Registration failed');
        return;
      }

      // On success, redirect to login
      window.location.href = '/login';

    } catch (err) {
      console.error(err);
      showError('Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
});
