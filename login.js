// login.js — Controls auth tab switching, validation, and submission

document.addEventListener('DOMContentLoaded', () => {
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authMessage = document.getElementById('authMessage');

  // Redirect if already logged in
  if (window.Auth.getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Tab switching
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    hideMessage();
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    hideMessage();
  });

  // Handle Login Submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    const res = window.Auth.login(email, pass);
    if (res.success) {
      showMessage('success', 'Logged in successfully! Redirecting...');
      setTimeout(() => {
        // Go back to the dashboard or previous page
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showMessage('error', res.message);
    }
  });

  // Handle Register Submit
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideMessage();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const pass = document.getElementById('registerPassword').value;

    const res = window.Auth.register(name, email, pass);
    if (res.success) {
      showMessage('success', 'Account created successfully! Logging you in...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showMessage('error', res.message);
    }
  });

  function showMessage(type, text) {
    authMessage.className = `auth-message ${type}`;
    authMessage.textContent = text;
  }

  function hideMessage() {
    authMessage.className = 'auth-message';
    authMessage.textContent = '';
  }
});
