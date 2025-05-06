// Simplified popup.js for Vyna Extension - focusing only on authentication

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, running simplified popup script');
  
  // Setup login form
  setupLoginForm();
  
  // Setup register form
  setupRegisterForm();
  
  // Setup tab switching
  setupTabSwitching();
  
  // Check if already logged in
  checkAuthState();
});

function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    console.error('Login form not found');
    return;
  }
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const usernameOrEmail = document.getElementById('usernameOrEmail')?.value || '';
    const password = document.getElementById('password')?.value || '';
    
    if (!usernameOrEmail || !password) {
      showError('Please enter both username and password');
      return;
    }
    
    console.log('Login attempt with:', usernameOrEmail);
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      const originalContent = loginBtn.innerHTML;
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span class="loading-indicator"></span> Signing in...';
      
      // Make the API request to login
      chrome.runtime.sendMessage({
        type: 'LOGIN',
        data: { usernameOrEmail, password }
      }, function(response) {
        console.log('Login response:', response);
        
        if (response && response.success) {
          console.log('Login successful:', response.user);
          showSuccessMessage('Login successful! Welcome back.');
        } else {
          console.error('Login failed:', response ? response.error : 'Unknown error');
          showError(response?.error || 'Login failed. Please try again.');
          
          // Reset login button
          loginBtn.disabled = false;
          loginBtn.innerHTML = originalContent;
        }
      });
    }
  });
}

function setupRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) {
    console.error('Register form not found');
    return;
  }
  
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const username = document.getElementById('register-username')?.value || '';
    const email = document.getElementById('register-email')?.value || '';
    const password = document.getElementById('register-password')?.value || '';
    
    // Basic validation
    let hasErrors = false;
    if (!username) {
      document.getElementById('register-username-error').textContent = 'Username is required';
      hasErrors = true;
    }
    
    if (!email) {
      document.getElementById('register-email-error').textContent = 'Email is required';
      hasErrors = true;
    }
    
    if (!password) {
      document.getElementById('register-password-error').textContent = 'Password is required';
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    console.log('Register attempt with:', username, email);
    
    // Show loading state
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      const originalContent = registerBtn.innerHTML;
      registerBtn.disabled = true;
      registerBtn.innerHTML = '<span class="loading-indicator"></span> Creating account...';
      
      // Make the API request to register
      chrome.runtime.sendMessage({
        type: 'REGISTER',
        data: { username, email, password }
      }, function(response) {
        if (response && response.success) {
          console.log('Registration successful:', response.user);
          showSuccessMessage('Account created successfully! Welcome to Vyna.live');
        } else {
          console.error('Registration failed:', response ? response.error : 'Unknown error');
          showError(response?.error || 'Registration failed. Please try again.');
          
          // Reset register button
          registerBtn.disabled = false;
          registerBtn.innerHTML = originalContent;
        }
      });
    }
  });
}

function setupTabSwitching() {
  // Set up tab switching for login/register forms
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  if (!tabTriggers.length) {
    console.error('No tab triggers found');
    return;
  }
  
  tabTriggers.forEach(function(trigger) {
    trigger.addEventListener('click', function() {
      // Remove active class from all triggers
      tabTriggers.forEach(function(t) {
        t.classList.remove('active');
      });
      
      // Add active class to clicked trigger
      trigger.classList.add('active');
      
      // Get the tab name from data attribute
      const tabName = trigger.dataset.tab;
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
      });
      
      // Show selected tab content
      const selectedTab = document.getElementById(`${tabName}-tab`);
      if (selectedTab) {
        selectedTab.classList.add('active');
      }
      
      // Clear error message
      const errorElement = document.getElementById('auth-error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    });
  });
}

function checkAuthState() {
  chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, function(response) {
    console.log('Auth state response:', response);
    
    if (response && response.isAuthenticated) {
      showSuccessMessage(`You are already logged in as ${response.user.username || 'User'}`);
    }
  });
}

function showError(message) {
  const errorElement = document.getElementById('auth-error');
  const errorMessageElement = document.getElementById('error-message');
  
  if (errorElement && errorMessageElement) {
    errorMessageElement.textContent = message;
    errorElement.style.display = 'flex';
  } else {
    console.error('Error elements not found');
    alert(message); // Fallback
  }
}

function showSuccessMessage(message) {
  // Simplify by just setting the body directly
  document.body.innerHTML = `
    <div class="success-container" style="display:flex; align-items:center; justify-content:center; min-height:400px; background:#212121; color:#fff; padding:20px;">
      <div class="success-message" style="text-align:center; max-width:300px;">
        <svg viewBox="0 0 24 24" fill="none" style="width:60px; height:60px; margin:0 auto 20px; color:#10b981;" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3 style="margin-bottom:10px; font-size:18px;">${message}</h3>
        <p style="margin-bottom:20px; opacity:0.8;">You can now access Vyna.live features.</p>
        <button id="logout-btn" style="background:#5D1C34; border:none; color:white; padding:10px 15px; border-radius:4px; cursor:pointer;">Logout</button>
      </div>
    </div>
  `;
  
  // Add logout button event listener directly after creating it
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({ type: 'LOGOUT' }, function() {
        window.location.reload();
      });
    });
  } else {
    console.error('Logout button not found after adding it to DOM');
  }
}