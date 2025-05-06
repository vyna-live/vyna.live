// Minimal popup.js for Vyna Extension - just shows log in form

// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, running minimal popup script');
  
  // Set up event listeners for login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Display the form values
      const usernameOrEmail = document.getElementById('usernameOrEmail').value;
      const password = document.getElementById('password').value;
      
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
          if (response && response.success) {
            console.log('Login successful:', response.user);
            // Just show login success message for now
            document.body.innerHTML = '<div class="success-message">Login successful! Refresh to continue.</div>';
          } else {
            console.error('Login failed:', response ? response.error : 'Unknown error');
            
            // Show error message
            const errorElement = document.getElementById('auth-error');
            const errorMessageElement = document.getElementById('error-message');
            if (errorElement && errorMessageElement) {
              errorMessageElement.textContent = response?.error || 'Login failed. Please try again.';
              errorElement.style.display = 'flex';
            }
            
            // Reset login button
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalContent;
          }
        });
      }
    });
  }
  
  // Set up event listeners for register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      
      console.log('Register attempt with:', username, email);
      
      // Validate inputs
      let hasErrors = false;
      if (!username || username.length < 3) {
        document.getElementById('register-username-error').textContent = 'Username must be at least 3 characters';
        hasErrors = true;
      }
      
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('register-email-error').textContent = 'Valid email is required';
        hasErrors = true;
      }
      
      if (!password || password.length < 8) {
        document.getElementById('register-password-error').textContent = 'Password must be at least 8 characters';
        hasErrors = true;
      }
      
      if (hasErrors) return;
      
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
            // Just show success message for now
            document.body.innerHTML = '<div class="success-message">Registration successful! Refresh to continue.</div>';
          } else {
            console.error('Registration failed:', response ? response.error : 'Unknown error');
            
            // Show error message
            const errorElement = document.getElementById('auth-error');
            const errorMessageElement = document.getElementById('error-message');
            if (errorElement && errorMessageElement) {
              errorMessageElement.textContent = response?.error || 'Registration failed. Please try again.';
              errorElement.style.display = 'flex';
            }
            
            // Reset register button
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalContent;
          }
        });
      }
    });
  }
  
  // Set up event listener for Google auth button
  const googleBtn = document.getElementById('google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', function() {
      console.log('Google auth requested');
      
      // Show loading state
      const originalContent = googleBtn.innerHTML;
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<span class="loading-indicator"></span> Connecting...';
      
      chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH' }, function(response) {
        if (response && response.success) {
          console.log('Google auth successful:', response.user);
          // Just show success message for now
          document.body.innerHTML = '<div class="success-message">Google login successful! Refresh to continue.</div>';
        } else {
          console.error('Google auth failed:', response ? response.error : 'Unknown error');
          
          // Show error message
          const errorElement = document.getElementById('auth-error');
          const errorMessageElement = document.getElementById('error-message');
          if (errorElement && errorMessageElement) {
            errorMessageElement.textContent = response?.error || 'Google authentication failed. Please try again.';
            errorElement.style.display = 'flex';
          }
          
          // Reset Google button
          googleBtn.disabled = false;
          googleBtn.innerHTML = originalContent;
        }
      });
    });
  }
  
  // Set up tab switching for login/register forms
  const tabTriggers = document.querySelectorAll('.tab-trigger');
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
      
      // Update tab content visibility
      document.querySelectorAll('.auth-tabs .tab-content').forEach(function(content) {
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Clear error messages when switching tabs
      const authError = document.getElementById('auth-error');
      if (authError) {
        authError.style.display = 'none';
      }
    });
  });
  
  // Check if the user is already logged in (optional)
  chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, function(response) {
    if (response && response.isAuthenticated) {
      // User is already logged in
      document.body.innerHTML = `
        <div class="success-message">
          <h3>You are already logged in</h3>
          <p>Welcome back, ${response.user.username || 'User'}!</p>
          <button id="logout-btn" class="auth-button">Logout</button>
        </div>
      `;
      
      // Add logout button event listener
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
          chrome.runtime.sendMessage({ type: 'LOGOUT' }, function() {
            window.location.reload();
          });
        });
      }
    }
  });
});
