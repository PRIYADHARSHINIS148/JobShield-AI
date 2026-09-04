// auth.js — Shared session management & header UI controller

const USERS_KEY = 'jobshield_users';
const CURRENT_USER_KEY = 'jobshield_current_user';

const Auth = {
  getUsers() {
    try {
      let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.length === 0) {
        const demoUser = {
          name: 'Demo Seeker',
          email: 'demo@jobshield.com',
          password: 'password123',
          createdAt: new Date().toISOString()
        };
        users = [demoUser];
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      return users;
    } catch {
      return [{
        name: 'Demo Seeker',
        email: 'demo@jobshield.com',
        password: 'password123',
        createdAt: new Date().toISOString()
      }];
    }
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch { return null; }
  },

  register(name, email, password) {
    try {
      const users = this.getUsers();
      email = email.toLowerCase().trim();
      if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email already registered.' };
      }
      const newUser = { name: name.trim(), email, password, createdAt: new Date().toISOString() };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Auto log in after registration
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: newUser.name, email: newUser.email }));
      return { success: true };
    } catch (err) {
      return { success: false, message: `Storage error: ${err.message}. Please check browser settings.` };
    }
  },

  login(email, password) {
    try {
      const users = this.getUsers();
      email = email.toLowerCase().trim();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return { success: false, message: 'Invalid email or password.' };
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: user.name, email: user.email }));
      return { success: true };
    } catch (err) {
      return { success: false, message: `Storage error: ${err.message}. Please check browser settings.` };
    }
  },

  logout() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (err) {
      console.error(err);
    }
    // Redirect to login page
    window.location.href = 'login.html';
  },


  updateHeader() {
    const user = this.getCurrentUser();
    const nav = document.querySelector('.header-nav');
    if (!nav) return;

    // Check if there is already a user section
    let userSection = document.getElementById('header-user-section');
    if (userSection) userSection.remove();

    userSection = document.createElement('div');
    userSection.id = 'header-user-section';
    userSection.className = 'header-user-section';

    if (user) {
      // User is logged in
      userSection.innerHTML = `
        <div class="user-profile-menu">
          <span class="user-avatar">👤</span>
          <span class="user-name">${user.name}</span>
          <div class="profile-dropdown">
            <div class="dropdown-header">
              <strong>${user.name}</strong><br>
              <span class="dropdown-email">${user.email}</span>
            </div>
            <hr class="dropdown-divider">
            <a href="dashboard.html" class="dropdown-item">📊 My Dashboard</a>
            <a href="#" id="logoutBtn" class="dropdown-item logout-link">🚪 Log Out</a>
          </div>
        </div>
      `;
    } else {
      // User is not logged in
      userSection.innerHTML = `
        <a href="login.html" class="btn-login">Sign In</a>
      `;
    }

    nav.parentNode.appendChild(userSection);

    // Bind logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }
};

window.Auth = Auth;

// Immediate authentication gate check
try {
  const user = Auth.getCurrentUser();
  const isLoginPage = window.location.pathname.toLowerCase().includes('login');
  
  if (!user && !isLoginPage) {
    window.location.href = 'login.html';
  } else if (user && isLoginPage) {
    window.location.href = 'dashboard.html';
  }
} catch (err) {
  console.error("Auth gate check failed:", err);
}

// Run header update on DOM load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateHeader();
});

