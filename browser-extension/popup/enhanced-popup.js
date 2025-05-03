// API Base URL
// API Base URL pointing to production
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://vyna-live.replit.app';

console.log('Using API base URL:', API_BASE_URL);

// Helper function to get templates, even if they're removed from the DOM
const templates = {};
function getTemplate(templateId) {
  // If we've already cached the template, return it
  if (templates[templateId]) {
    return templates[templateId];
  }
  
  // Try to find the template in the DOM
  const template = document.querySelector(`template#${templateId}`);
  if (template) {
    // Cache the template for future use
    templates[templateId] = template;
    return template;
  }
  
  console.error(`Template with ID ${templateId} not found`);
  return null;
}

// User state
let currentUser = null;
let isAuthenticated = false;
let activeTab = 'vynaai'; // Default tab
let currentChatSessionId = null;
let chatSessions = [];
let commentaryStyle = 'color'; // Default to color commentary

// Note: savedNotes and currentNoteId are declared in this scope
// but will be used throughout the file

// These are our working variables for notepad functionality
let savedNotes = [];
let currentNoteId = null;
let noteLines = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  try {
    // Check if user is authenticated
    const authStatus = await checkAuthentication();
    
    // Clear the app container completely
    const appContainer = document.getElementById('app');
    console.log('InitializeApp: Clearing app container');
    appContainer.innerHTML = '';
    
    if (authStatus.isAuthenticated) {
      // Cache all available templates first
      const allTemplates = document.querySelectorAll('template');
      console.log('InitializeApp: All templates in DOM:', Array.from(allTemplates).map(t => t.id));
      allTemplates.forEach(template => {
        if (template.id) {
          templates[template.id] = template;
          console.log('InitializeApp: Cached template:', template.id);
        }
      });
      
      // User is authenticated, show main interface from template
      const mainInterface = getTemplate('main-interface-template');
      console.log('InitializeApp: Main interface template found from cache:', !!mainInterface);
      
      if (mainInterface) {
        const mainInterfaceContent = document.importNode(mainInterface.content, true);
        appContainer.appendChild(mainInterfaceContent);
        console.log('InitializeApp: Main interface content appended to container');
      } else {
        console.error('InitializeApp: Main interface template not found!');
        // Try to create main interface without template as fallback
        appContainer.innerHTML = '<div class="main-interface"><div class="header"><div class="logo"><img src="../assets/logo.png" alt="Vyna.live" height="28"></div></div><div class="content"><div>Error loading interface. Please reload extension.</div></div></div>';
        return;
      }
      
      // Update the user info display
      document.querySelector('#username').textContent = authStatus.user.displayName || authStatus.user.username;
      
      // Set user avatar if available
      if (authStatus.user.avatarUrl) {
        document.querySelector('#userAvatar').src = authStatus.user.avatarUrl;
      } else {
        // Default avatar
        document.querySelector('#userAvatar').src = '../assets/user-avatar.png';
      }
      
      // Store user info
      currentUser = authStatus.user;
      isAuthenticated = true;
      
      // Initialize the user dropdown
      initializeUserDropdown();
      
      // Initialize the interface
      console.log('Setting up interface with activeTab:', activeTab);
      const defaultTabElement = document.querySelector('.tabs .tab[data-tab="vynaai"]');
      if (defaultTabElement) {
        defaultTabElement.classList.add('active');
      } else {
        console.error('Default tab element not found');
      }
      
      const defaultContentElement = document.getElementById('vynaai-content');
      if (defaultContentElement) {
        defaultContentElement.classList.add('active');
      } else {
        console.error('Default content element not found');
      }
      
      // Initialize tabs with event delegation
      initializeTabs();
      
      // Load the active tab content
      setTimeout(() => {
        console.log('Loading initial tab content');
        loadActiveTab();
      }, 100);
    } else {
      // User is not authenticated, show login screen
      showLoginScreen();
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    showLoginScreen();
  }
}

// Authentication functions
async function checkAuthentication() {
  try {
    console.log('Checking authentication status...');
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('Auth response status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('User authenticated:', userData);
      return { isAuthenticated: true, user: userData };
    } else {
      console.log('Authentication failed, status:', response.status);
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    return { isAuthenticated: false, user: null };
  }
}

function showLoginScreen() {
  // Clear the app container completely
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = '';
  
  // Cache all available templates first
  const allTemplates = document.querySelectorAll('template');
  console.log('showLoginScreen: Caching all templates:', Array.from(allTemplates).map(t => t.id));
  allTemplates.forEach(template => {
    if (template.id) {
      templates[template.id] = template;
    }
  });
  
  // Get the auth template and clone it
  const authTemplate = getTemplate('auth-template');
  if (authTemplate) {
    const authContent = document.importNode(authTemplate.content, true);
    
    // Append to the app container
    appContainer.appendChild(authContent);
    
    // Initialize auth tabs
    initializeAuthTabs();
    
    // Add event listeners for login and register forms
    document.getElementById('loginButton').addEventListener('click', handleLogin);
    document.getElementById('registerButton').addEventListener('click', handleRegister);
  } else {
    // If template not found, show error
    appContainer.innerHTML = '<div class="auth-error">Failed to load authentication interface. Please reload the extension.</div>';
  }
}

function initializeAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  const contents = document.querySelectorAll('.auth-tab-content');
  
  // Add click event to each tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      const tabType = tab.dataset.tab;
      tab.classList.add('active');
      document.getElementById(`${tabType}-content`).classList.add('active');
      
      // Clear any error messages
      document.getElementById('authError').style.display = 'none';
    });
  });
}

async function handleLogin() {
  // Get form data
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  // Validate input
  if (!username || !password) {
    showError('loginError', 'Please enter both username and password');
    return;
  }
  
  try {
    // Disable the login button and show loading state
    const loginButton = document.getElementById('loginButton');
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="loading-spinner"></span> Signing in...';
    
    // Clear any previous errors
    document.getElementById('authError').style.display = 'none';
    
    // Send login request
    console.log('Sending login request to:', `${API_BASE_URL}/api/login`);
    console.log('Login payload:', { usernameOrEmail: username, password: '****' });
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usernameOrEmail: username, // Server expects usernameOrEmail parameter name
        password
      })
    });
    console.log('Login response status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('Login successful, user data:', userData);
      
      // Store user data
      currentUser = userData;
      isAuthenticated = true;
      
      // Show success toast
      showToast('Successfully signed in');
      
      // Clear the app container completely
      const appContainer = document.getElementById('app');
      console.log('Clearing app container before UI rebuild');
      appContainer.innerHTML = '';
      
      // Cache all available templates before clearing the DOM
      const allLoginTemplates = document.querySelectorAll('template');
      console.log('Login: All templates in DOM:', Array.from(allLoginTemplates).map(t => t.id));
      allLoginTemplates.forEach(template => {
        if (template.id) {
          templates[template.id] = template;
          console.log('Login: Cached template:', template.id);
        }
      });

      // Re-add the main interface using our cached template
      const mainInterface = getTemplate('main-interface-template');
      console.log('Main interface template found from cache:', !!mainInterface);
      if (mainInterface) {
        const mainInterfaceContent = document.importNode(mainInterface.content, true);
        appContainer.appendChild(mainInterfaceContent);
        console.log('Main interface content appended to container');
        
        // Update the user info display
        document.querySelector('#username').textContent = userData.displayName || userData.username;
        
        // Set user avatar if available
        if (userData.avatarUrl) {
          document.querySelector('#userAvatar').src = userData.avatarUrl;
        } else {
          // Default avatar
          document.querySelector('#userAvatar').src = '../assets/user-avatar.png';
        }
        
        // Initialize the interface
        initializeUserDropdown();
        initializeTabs();
        loadActiveTab();
      } else {
        // If template not found, reload the entire extension
        window.location.reload();
      }
    } else {
      // Re-enable the login button
      loginButton.disabled = false;
      loginButton.innerHTML = '<span class="button-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></span> Sign in';
      
      try {
        // Show error message
        const errorData = await response.json();
        showError('loginError', errorData.error || 'Login failed. Please check your credentials.');
      } catch (error) {
        showError('loginError', 'Login failed. Please check your credentials.');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Re-enable the login button
    const loginButton = document.getElementById('loginButton');
    loginButton.disabled = false;
    loginButton.innerHTML = '<span class="button-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></span> Sign in';
    
    showError('loginError', 'Login failed due to a network error. Please try again.');
  }
}

async function handleRegister() {
  // Get form data
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
  
  // Validate input
  if (!username || !email || !password || !confirmPassword) {
    showError('registerError', 'Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showError('registerError', 'Passwords do not match');
    return;
  }
  
  // Email format validation
  if (!email.includes('@') || !email.includes('.')) {
    showError('registerError', 'Please enter a valid email address');
    return;
  }
  
  try {
    // Disable the register button and show loading state
    const registerButton = document.getElementById('registerButton');
    registerButton.disabled = true;
    registerButton.innerHTML = '<span class="loading-spinner"></span> Creating account...';
    
    // Clear any previous errors
    document.getElementById('authError').style.display = 'none';
    
    // Send register request
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password,
        displayName: username
      })
    });
    
    if (response.ok) {
      const userData = await response.json();
      // Store user data
      currentUser = userData;
      isAuthenticated = true;
      
      // Show success toast
      showToast('Account created successfully');
      
      // Clear the app container completely
      const appContainer = document.getElementById('app');
      console.log('Register: Clearing app container before UI rebuild');
      appContainer.innerHTML = '';
      
      // Cache all available templates before clearing the DOM
      const allRegisterTemplates = document.querySelectorAll('template');
      console.log('Register: All templates in DOM:', Array.from(allRegisterTemplates).map(t => t.id));
      allRegisterTemplates.forEach(template => {
        if (template.id) {
          templates[template.id] = template;
          console.log('Register: Cached template:', template.id);
        }
      });
      
      // Re-add the main interface using our cached template
      const mainInterface = getTemplate('main-interface-template');
      console.log('Register: Main interface template found from cache:', !!mainInterface);
      if (mainInterface) {
        const mainInterfaceContent = document.importNode(mainInterface.content, true);
        appContainer.appendChild(mainInterfaceContent);
        console.log('Register: Main interface content appended to container');
        
        // Update the user info display
        document.querySelector('#username').textContent = userData.displayName || userData.username;
        
        // Set user avatar if available
        if (userData.avatarUrl) {
          document.querySelector('#userAvatar').src = userData.avatarUrl;
        } else {
          // Default avatar
          document.querySelector('#userAvatar').src = '../assets/user-avatar.png';
        }
        
        // Initialize the interface
        initializeUserDropdown();
        initializeTabs();
        loadActiveTab();
      } else {
        // If template not found, reload the entire extension
        window.location.reload();
      }
    } else {
      // Re-enable the register button
      registerButton.disabled = false;
      registerButton.innerHTML = '<span class="button-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg></span> Create account';
      
      // Show error message
      try {
        const errorData = await response.json();
        showError('registerError', errorData.error || 'Registration failed. Please try again.');
      } catch (e) {
        showError('registerError', 'Registration failed. Please try again.');
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Re-enable the register button
    const registerButton = document.getElementById('registerButton');
    registerButton.disabled = false;
    registerButton.innerHTML = '<span class="button-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg></span> Create account';
    
    showError('registerError', 'Registration failed due to a network error. Please try again.');
  }
}

function showError(elementId, message) {
  // For the new tabbed auth UI, we use a single error display
  if (elementId === 'loginError' || elementId === 'registerError') {
    const errorElement = document.getElementById('authError');
    const errorMessageElement = document.getElementById('authErrorMessage');
    errorMessageElement.textContent = message;
    errorElement.style.display = 'flex';
  } else {
    // For other error elements
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
}

// User dropdown functions
function initializeUserDropdown() {
  const userProfile = document.getElementById('userProfile');
  const userDropdown = document.getElementById('userDropdown');
  const logoutButton = document.getElementById('logoutButton');
  
  // Toggle dropdown when clicking on the user profile
  userProfile.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
  });
  
  // Prevent dropdown from closing when clicking inside it
  userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Handle logout button click
  logoutButton.addEventListener('click', handleLogout);
}

async function handleLogout() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (response.ok) {
      // Reset user state
      currentUser = null;
      isAuthenticated = false;
      
      // Show login screen
      showLoginScreen();
      
      // Show success toast
      showToast('Successfully logged out');
    } else {
      showToast('Logout failed. Please try again.', true);
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed due to a network error', true);
  }
}

// Helper function to show toast notifications
function showToast(message, isError = false) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = isError ? 'toast toast-error' : 'toast';
  toast.textContent = message;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after animation completes
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
}

// Tab functions
function initializeTabs() {
  console.log('Initializing tabs...');
  
  // Use event delegation for tab buttons
  const tabsNav = document.querySelector('.tabs');
  if (!tabsNav) {
    console.error('Tabs navigation container not found');
    return;
  }
  console.log('Found tabs container:', tabsNav);
  
  // Add event listener to the parent container
  tabsNav.addEventListener('click', (event) => {
    // Find the closest tab button if we clicked on a child element
    const tabButton = event.target.closest('.tab');
    if (tabButton) {
      const tabName = tabButton.getAttribute('data-tab');
      console.log('Tab clicked:', tabName);
      switchTab(tabName);
    }
  });
  
  console.log('Tab event delegation set up successfully');
}

function switchTab(tabName) {
  console.log('Switching to tab:', tabName);
  // Validate tab name
  if (!tabName || (tabName !== 'vynaai' && tabName !== 'notepad')) {
    console.error('Invalid tab name:', tabName);
    return;
  }
  
  // Update active tab
  activeTab = tabName;
  
  // Update tab UI - only target tabs in the navigation, not nested tabs in content
  const tabsContainer = document.querySelector('.tabs');
  if (tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('.tab');
    console.log(`Found ${tabs.length} navigation tabs`);
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  } else {
    console.error('Tabs container not found when updating tab UI');
  }
  
  // Update content UI - only select direct children of content container
  const contentContainer = document.querySelector('.content');
  if (contentContainer) {
    const tabContents = contentContainer.querySelectorAll('.tab-content');
    console.log(`Found ${tabContents.length} tab content elements`);
    
    tabContents.forEach(content => {
      if (content.id === `${tabName}-content`) {
        content.classList.add('active');
        console.log(`Activating content: ${content.id}`);
      } else {
        content.classList.remove('active');
      }
    });
  } else {
    console.error('Content container not found when updating content UI');
  }
  
  // Load the content for the active tab
  loadActiveTab();
}

async function loadActiveTab() {
  console.log('Loading active tab:', activeTab);
  
  try {
    // First ensure we have the right content element
    const tabContent = {
      'vynaai': document.getElementById('vynaai-content'),
      'notepad': document.getElementById('notepad-content')
    }[activeTab];
    
    if (!tabContent) {
      console.error(`Content element for tab '${activeTab}' not found`);
      return;
    }
    
    if (activeTab === 'vynaai') {
      console.log('Loading VynaAI chat sessions...');
      // Set a loading state before async call
      tabContent.innerHTML = '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>';
      await loadChatSessions();
    } else if (activeTab === 'notepad') {
      console.log('Loading notepad content...');
      // Set a loading state before async call
      tabContent.innerHTML = '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>';
      await loadNotes();
    } else {
      console.warn('Unknown active tab:', activeTab);
      // Show a message in the tab content area
      const contentElement = document.querySelector('.tab-content.active');
      if (contentElement) {
        contentElement.innerHTML = `<div class="p-4 text-center text-red-400">Unknown tab: ${activeTab}</div>`;
      }
    }
  } catch (error) {
    console.error(`Error loading ${activeTab} tab:`, error);
    // Show error in the tab content area
    let contentElement = null;
    // First try to find the active tab content in the content container
    const contentContainer = document.querySelector('.content');
    if (contentContainer) {
      contentElement = contentContainer.querySelector('.tab-content.active');
    }
    // Fallback to the current tab's content by ID if we couldn't find the active one
    if (!contentElement) {
      contentElement = document.getElementById(`${activeTab}-content`);
    }
    // Last resort fallbacks
    if (!contentElement) {
      contentElement = document.getElementById('vynaai-content') || 
                       document.getElementById('notepad-content');
    }
      
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="p-4 text-center">
          <div class="text-red-400 mb-2">Error loading content</div>
          <div class="text-zinc-400 text-sm">${error.message || 'Unknown error'}</div>
          <button id="retryLoadTab" class="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
            Retry
          </button>
        </div>
      `;
      
      // Add retry button functionality with a timeout to ensure DOM is ready
      setTimeout(() => {
        const retryButton = document.getElementById('retryLoadTab');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            console.log('Retrying to load tab...');
            loadActiveTab();
          });
        }
      }, 100);
    }
  }
}

// VynaAI functions
async function loadChatSessions() {
  if (!isAuthenticated || !currentUser) return;
  
  try {
    const vynaaiContent = document.getElementById('vynaai-content');
    
    // Start with a loading state
    vynaaiContent.innerHTML = '<div class="loading">Loading chat sessions...</div>';
    
    // Fetch the chat sessions
    const response = await fetch(`${API_BASE_URL}/api/ai-chat-sessions/${currentUser.id}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const sessionsData = await response.json();
      chatSessions = sessionsData;
      
      // Get the chat sessions template and clone it
      const chatSessionsTemplate = getTemplate('chat-sessions-template');
      const chatSessionsContent = document.importNode(chatSessionsTemplate.content, true);
      
      // Clear the content area and append the template
      vynaaiContent.innerHTML = '';
      vynaaiContent.appendChild(chatSessionsContent);
      
      // Populate the chat list
      const chatList = document.querySelector('.chat-list');
      if (chatSessions.length > 0) {
        chatSessions.forEach(session => {
          const sessionItem = createChatSessionItem(session);
          chatList.appendChild(sessionItem);
        });
      } else {
        chatList.innerHTML = '<div class="empty-chats-message">No recent chats. Start a new conversation.</div>';
      }
      
      // Add event listener to new chat button
      document.getElementById('newChatButton').addEventListener('click', startNewChat);
    } else {
      vynaaiContent.innerHTML = '<div class="error">Failed to load chat sessions</div>';
    }
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    document.getElementById('vynaai-content').innerHTML = '<div class="error">Error loading chat sessions</div>';
  }
}

function createChatSessionItem(session) {
  // Get the chat session item template and clone it
  const chatSessionItemTemplate = getTemplate('chat-session-item-template');
  const chatSessionItem = document.importNode(chatSessionItemTemplate.content, true);
  
  // Set session title
  const titleElement = chatSessionItem.querySelector('.chat-session-title');
  titleElement.textContent = session.title || `Chat from ${new Date(session.createdAt).toLocaleString()}`;
  
  // Add event listener to session item
  const sessionElement = chatSessionItem.querySelector('.chat-session');
  sessionElement.addEventListener('click', () => openChatSession(session.id));
  
  return chatSessionItem;
}

async function startNewChat() {
  currentChatSessionId = null;
  showChatInterface();
}

async function openChatSession(sessionId) {
  currentChatSessionId = sessionId;
  await showChatInterface();
}

async function showChatInterface() {
  try {
    const vynaaiContent = document.getElementById('vynaai-content');
    
    // Get the chat interface template and clone it
    const chatInterfaceTemplate = getTemplate('chat-interface-template');
    const chatInterfaceContent = document.importNode(chatInterfaceTemplate.content, true);
    
    // Clear the content area and append the template
    vynaaiContent.innerHTML = '';
    vynaaiContent.appendChild(chatInterfaceContent);
    
    // Add event listeners
    document.getElementById('backToSessions').addEventListener('click', () => loadChatSessions());
    const sendButton = document.getElementById('sendButton');
    const chatInput = document.getElementById('chatInput');
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', handleChatInputKeyDown);
    
    // Enable/disable send button based on input
    chatInput.addEventListener('input', () => {
      sendButton.disabled = chatInput.value.trim() === '';
    });
    
    // Add event listeners for file inputs
    document.getElementById('docButton').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('imageButton').addEventListener('click', () => document.getElementById('imageInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    
    // Set up commentary style selection
    const commentaryOptions = document.querySelectorAll('.commentary-option');
    commentaryOptions.forEach(option => {
      const style = option.getAttribute('data-style');
      option.classList.toggle('active', style === commentaryStyle);
      
      option.addEventListener('click', () => {
        commentaryStyle = style;
        commentaryOptions.forEach(opt => {
          opt.classList.toggle('active', opt.getAttribute('data-style') === style);
        });
      });
    });
    
    // If opening an existing session, load messages
    if (currentChatSessionId) {
      await loadChatMessages(currentChatSessionId);
    }
  } catch (error) {
    console.error('Error showing chat interface:', error);
  }
}

async function loadChatMessages(sessionId) {
  try {
    const messagesContainer = document.getElementById('messagesContainer');
    const emptyState = document.getElementById('chatEmptyState');
    
    // Start with a loading state
    messagesContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    emptyState.style.display = 'none';
    
    // Fetch the messages
    const response = await fetch(`${API_BASE_URL}/api/ai-chat-messages/${sessionId}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const messagesData = await response.json();
      
      // Clear the messages container
      messagesContainer.innerHTML = '';
      
      if (messagesData.length > 0) {
        // Add messages to the container
        messagesData.forEach(message => {
          const messageElement = createMessageElement(message);
          messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        // Show empty state
        emptyState.style.display = 'flex';
      }
    } else {
      messagesContainer.innerHTML = '<div class="error-message">Failed to load messages</div>';
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    document.getElementById('messagesContainer').innerHTML = '<div class="error-message">Error loading messages</div>';
  }
}

function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Process message content
  if (message.content.includes('{"type":"infoGraphic"')) {
    try {
      // This is a message with an info graphic
      const infoGraphicData = JSON.parse(message.content);
      
      // Add the text content
      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.textContent = infoGraphicData.text || 'No text content';
      contentDiv.appendChild(textDiv);
      
      // Add the info graphic if present
      if (infoGraphicData.graphic) {
        const graphicDiv = document.createElement('div');
        graphicDiv.className = 'info-graphic';
        graphicDiv.innerHTML = infoGraphicData.graphic;
        contentDiv.appendChild(graphicDiv);
      }
    } catch (e) {
      // Fallback to treating as regular text if JSON parsing fails
      contentDiv.textContent = message.content;
    }
  } else {
    // Regular text message
    contentDiv.textContent = message.content;
  }
  
  messageDiv.appendChild(contentDiv);
  
  // Add message metadata
  const metaDiv = document.createElement('div');
  metaDiv.className = 'message-meta';
  metaDiv.textContent = new Date(message.createdAt).toLocaleTimeString();
  messageDiv.appendChild(metaDiv);
  
  return messageDiv;
}

async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Clear the input
  chatInput.value = '';
  
  // Disable send button
  document.getElementById('sendButton').disabled = true;
  
  // Get the messages container
  const messagesContainer = document.getElementById('messagesContainer');
  const emptyState = document.getElementById('chatEmptyState');
  
  // Hide empty state if visible
  emptyState.style.display = 'none';
  
  // Create and add user message element
  const userMessageElement = document.createElement('div');
  userMessageElement.className = 'message user-message';
  
  const userContentDiv = document.createElement('div');
  userContentDiv.className = 'message-content';
  userContentDiv.textContent = message;
  userMessageElement.appendChild(userContentDiv);
  
  const userMetaDiv = document.createElement('div');
  userMetaDiv.className = 'message-meta';
  userMetaDiv.textContent = new Date().toLocaleTimeString();
  userMessageElement.appendChild(userMetaDiv);
  
  messagesContainer.appendChild(userMessageElement);
  
  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add loading indicator for AI response
  const loadingElement = document.createElement('div');
  loadingElement.className = 'message ai-message loading';
  loadingElement.innerHTML = `
    <div class="message-content">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(loadingElement);
  
  // Scroll to the bottom again
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    // Send the message to the server
    let response;
    
    if (currentChatSessionId) {
      // Add to existing session
      response = await fetch(`${API_BASE_URL}/api/ai-chat-messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentChatSessionId,
          content: message,
          role: 'user',
          commentaryStyle
        })
      });
    } else {
      // Create new session
      response = await fetch(`${API_BASE_URL}/api/ai-chat-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          title: `Chat ${new Date().toLocaleString()}`,
          initialMessage: message,
          commentaryStyle
        })
      });
    }
    
    if (response.ok) {
      const responseData = await response.json();
      
      // Remove loading indicator
      messagesContainer.removeChild(loadingElement);
      
      if (currentChatSessionId === null) {
        // New session was created
        currentChatSessionId = responseData.sessionId;
        
        // Add AI response
        const aiMessageElement = createMessageElement(responseData.message);
        messagesContainer.appendChild(aiMessageElement);
      } else {
        // Add AI response to existing session
        const aiMessageElement = createMessageElement(responseData);
        messagesContainer.appendChild(aiMessageElement);
      }
      
      // Scroll to the bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      // Handle error
      messagesContainer.removeChild(loadingElement);
      
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'Failed to get AI response. Please try again.';
      messagesContainer.appendChild(errorElement);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Remove loading indicator
    messagesContainer.removeChild(loadingElement);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = 'Error sending message. Please check your connection and try again.';
    messagesContainer.appendChild(errorElement);
  } finally {
    // Re-enable send button
    document.getElementById('sendButton').disabled = false;
    document.getElementById('chatInput').focus();
  }
}

function handleChatInputKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (response.ok) {
      const fileData = await response.json();
      
      // Add a message about the uploaded file
      const chatInput = document.getElementById('chatInput');
      chatInput.value = `I've uploaded a document: ${file.name}. Please analyze it.`;
      chatInput.focus();
      document.getElementById('sendButton').disabled = false;
    } else {
      showToast('Failed to upload file', true);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    showToast('Error uploading file', true);
  }
  
  // Clear the input
  event.target.value = '';
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', true);
    event.target.value = '';
    return;
  }
  
  try {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the image
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (response.ok) {
      const fileData = await response.json();
      
      // Add a message about the uploaded image
      const chatInput = document.getElementById('chatInput');
      chatInput.value = `I've uploaded an image: ${file.name}. Please analyze it.`;
      chatInput.focus();
      document.getElementById('sendButton').disabled = false;
    } else {
      showToast('Failed to upload image', true);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    showToast('Error uploading image', true);
  }
  
  // Clear the input
  event.target.value = '';
}

// Begin notepad implementation
// Notepad functions
async function loadNotes() {
  console.log('Loading notes...');
  
  // Make sure we have the notepad content element
  const notepadContent = document.getElementById('notepad-content');
  if (!notepadContent) {
    console.error('Cannot load notes: notepad-content element not found');
    return;
  }
  
  // Check authentication status first
  if (!isAuthenticated || !currentUser) {
    console.error('Cannot load notes: User not authenticated');
    // Try to re-authenticate
    const authStatus = await checkAuthentication();
    if (!authStatus.isAuthenticated) {
      // Show error with login option
      notepadContent.innerHTML = `
        <div class="p-4 text-center">
          <div class="text-red-400 mb-2">Authentication required to load notes</div>
          <div class="text-zinc-400 text-sm">Please sign in to access your notes</div>
          <button id="loginFromNotes" class="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
            Sign in
          </button>
        </div>
      `;
      
      // Add login button functionality with a timeout to ensure DOM is ready
      setTimeout(() => {
        const loginButton = document.getElementById('loginFromNotes');
        if (loginButton) {
          loginButton.addEventListener('click', () => {
            showLoginScreen();
          });
        }
      }, 100);
      return;
    } else {
      // Authentication succeeded, store user data
      currentUser = authStatus.user;
      isAuthenticated = true;
    }
  }
  
  try {
    const notepadContent = document.getElementById('notepad-content');
    notepadContent.innerHTML = '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>';
    
    // Print detailed request information for debugging
    console.log(`Fetching notes from: ${API_BASE_URL}/api/notepads/${currentUser.id}`);
    console.log('Using credentials include for CORS support');
    console.log('Current user ID:', currentUser.id);
    
    // Make the API request with credentials included
    const response = await fetch(`${API_BASE_URL}/api/notepads/${currentUser.id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Notes response status:', response.status, response.statusText);
    
    if (response.ok) {
      // Parse the JSON response
      const notes = await response.json();
      console.log(`Successfully loaded ${notes.length} notes:`, notes);
      savedNotes = notes;
      
      // Get the notes list template and populate it
      const template = getTemplate('notepad-list-template');
      if (!template) {
        console.error('Notepad list template not found');
        notepadContent.innerHTML = '<div class="p-4 text-center text-red-400">Template error: Could not find notepad list template</div>';
        return;
      }
      
      const content = document.importNode(template.content, true);
      
      // Clear the notepad content and append our template
      notepadContent.innerHTML = '';
      notepadContent.appendChild(content);
      
      // Check if there are notes
      if (notes && notes.length > 0) {
        // Show notes list
        const notesList = document.getElementById('notes-list');
        if (!notesList) {
          console.error('Notes list element not found in template');
          return;
        }
        
        notesList.innerHTML = '';
        
        // Use event delegation for note items
        notesList.addEventListener('click', (event) => {
          // Find the clicked note item or its parent
          const noteItem = event.target.closest('.note-item');
          if (noteItem) {
            const noteId = noteItem.getAttribute('data-note-id');
            if (noteId) {
              // Find the note in the saved notes
              const note = savedNotes.find(n => n.id === parseInt(noteId) || n.id === noteId);
              if (note) {
                console.log('Note item clicked via delegation, triggering handleViewNote for note ID:', noteId);
                handleViewNote(note);
              }
            }
          }
        });
        
        // Create and append note items
        notes.forEach(note => {
          const noteItem = createNoteItem(note);
          notesList.appendChild(noteItem);
        });
        
        // Hide empty state
        const emptyNotes = document.getElementById('empty-notes');
        if (emptyNotes) {
          emptyNotes.style.display = 'none';
        }
      } else {
        // Show empty state
        const notesList = document.getElementById('notes-list');
        if (notesList) {
          notesList.innerHTML = '';
        }
        
        const emptyNotes = document.getElementById('empty-notes');
        if (emptyNotes) {
          emptyNotes.style.display = 'flex';
        }
      }
      
      // Add event listeners
      const newNoteButton = document.getElementById('newNoteButton');
      if (newNoteButton) {
        newNoteButton.addEventListener('click', handleNewNote);
      }
      
      const emptyNewButton = document.getElementById('empty-new-note-button');
      if (emptyNewButton) {
        emptyNewButton.addEventListener('click', () => {
          // Get the input value from the empty state input
          const emptyNoteInput = document.querySelector('#empty-notes input');
          if (emptyNoteInput && emptyNoteInput.value.trim()) {
            // Create a new note with the input value
            noteLines = [emptyNoteInput.value.trim()];
            handleNewNote();
          } else {
            // Just create an empty note if no input
            handleNewNote();
          }
        });
      }
      
      // Add event listener to the input field for Enter key
      const emptyNoteInput = document.querySelector('#empty-notes input');
      if (emptyNoteInput) {
        emptyNoteInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && emptyNoteInput.value.trim()) {
            event.preventDefault();
            noteLines = [emptyNoteInput.value.trim()];
            handleNewNote();
          }
        });
      }
      
    } else if (response.status === 401) {
      // Unauthorized - session may have expired
      console.error('Unauthorized: Session may have expired');
      isAuthenticated = false;
      currentUser = null;
      
      notepadContent.innerHTML = `
        <div class="p-4 text-center">
          <div class="text-red-400 mb-2">Session expired</div>
          <div class="text-zinc-400 text-sm">Please sign in again to access your notes</div>
          <button id="reLoginButton" class="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
            Sign in
          </button>
        </div>
      `;
      
      // Add login button functionality with a timeout to ensure DOM is ready
      setTimeout(() => {
        const reLoginButton = document.getElementById('reLoginButton');
        if (reLoginButton) {
          reLoginButton.addEventListener('click', () => {
            showLoginScreen();
          });
        }
      }, 100);
    } else {
      // Other server error
      console.error('Failed to load notes:', response.status);
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || '';
        console.error('Server error details:', errorDetails);
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      notepadContent.innerHTML = `
        <div class="p-4 text-center">
          <div class="text-red-400 mb-2">Failed to load notes (${response.status})</div>
          ${errorDetails ? `<div class="text-zinc-400 text-sm">${errorDetails}</div>` : ''}
          <button id="retryNotesButton" class="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
            Retry
          </button>
        </div>
      `;
      
      // Add retry button functionality with a timeout to ensure DOM is ready
      setTimeout(() => {
        const retryButton = document.getElementById('retryNotesButton');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            console.log('Retrying to load notes...');
            loadNotes();
          });
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error loading notes:', error);
    
    // More detailed error message
    let errorMessage = 'Error loading notes';
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    // Provide more helpful suggestions based on common issues
    let helpText = '';
    if (error.message && error.message.includes('NetworkError')) {
      helpText = 'Check your internet connection or server availability';
    } else if (error.message && error.message.includes('SyntaxError')) {
      helpText = 'Server response could not be parsed as JSON';
    } else if (error.message && error.message.includes('Failed to fetch')) {
      helpText = 'Could not connect to the server. The API URL might be incorrect or the server is down.';
    }
    
    const notepadContent = document.getElementById('notepad-content');
    if (notepadContent) {
      notepadContent.innerHTML = `
        <div class="p-4 text-center">
          <div class="text-red-400 mb-2">${errorMessage}</div>
          ${helpText ? `<div class="text-zinc-400 text-sm">${helpText}</div>` : ''}
          <div class="text-zinc-400 text-xs mt-2">API URL: ${API_BASE_URL}</div>
          <button id="retryNotesButton" class="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">
            Retry Loading Notes
          </button>
        </div>
      `;
      
      // Add retry button functionality with a timeout to ensure DOM is ready
      setTimeout(() => {
        const retryButton = document.getElementById('retryNotesButton');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            console.log('Retrying to load notes...');
            loadNotes();
          });
        }
      }, 100);
    }
  }
}

// Create a note item element for the list
function createNoteItem(note) {
  console.log('Creating note item for note:', note);
  if (!note || !note.id) {
    console.error('Invalid note object:', note);
    return document.createElement('div'); // Return empty div to prevent errors
  }
  
  // Use the template for consistent UI
  const template = getTemplate('note-item-template');
  if (!template) {
    console.error('Note item template not found');
    return document.createElement('div');
  }
  
  const content = document.importNode(template.content, true);
  const noteItem = content.querySelector('.note-item');
  
  // Set note ID
  noteItem.setAttribute('data-note-id', note.id);
  
  // We're now using event delegation in the parent notes list container
  // instead of adding a click listener to each individual note item
  
  // Set title
  const titleElement = noteItem.querySelector('.note-title');
  if (titleElement) {
    titleElement.textContent = note.title || 'Untitled Note';
  }
  
  // Set preview text
  const previewElement = noteItem.querySelector('.note-preview');
  if (previewElement) {
    previewElement.textContent = note.content || 'Empty note';
  }
  
  // Set date
  const dateElement = noteItem.querySelector('.note-date');
  if (dateElement && (note.updatedAt || note.createdAt)) {
    const date = new Date(note.updatedAt || note.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    dateElement.textContent = formattedDate;
  }
  
  return noteItem;
}

// Handle creating a new note
function handleNewNote() {
  console.log('Creating new note');
  // Reset state
  noteLines = [];
  currentNoteId = null;
  
  // Show the note editor
  const notepadContent = document.getElementById('notepad-content');
  
  // Get the note editor template
  const template = getTemplate('note-editor-template');
  const content = document.importNode(template.content, true);
  
  // Clear the notepad content and append our template
  notepadContent.innerHTML = '';
  notepadContent.appendChild(content);
  
  // Add event listeners
  setupNoteEditorEventListeners();
  
  // Focus on the input field
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.focus();
  }
}

// Handle viewing a note
function handleViewNote(note) {
  console.log('Viewing note:', note.id, note);
  // Validate we have a valid note object
  if (!note || !note.id) {
    console.error('Invalid note object:', note);
    return;
  }
  
  const notepadContent = document.getElementById('notepad-content');
  if (!notepadContent) {
    console.error('notepad-content element not found');
    return;
  }
  
  // Get the note viewer template
  const template = getTemplate('note-viewer-template');
  const content = document.importNode(template.content, true);
  
  // Clear the notepad content and append our template
  notepadContent.innerHTML = '';
  notepadContent.appendChild(content);
  
  // Set the note title and content
  document.getElementById('note-view-title').textContent = note.title || 'Untitled Note';
  const noteContent = document.getElementById('note-view-content');
  
  // Create paragraph elements for each line
  if (note.content) {
    note.content.split('\n').forEach(line => {
      const p = document.createElement('p');
      p.className = 'mb-2';
      p.textContent = line;
      noteContent.appendChild(p);
    });
  } else {
    noteContent.textContent = 'No content';
  }
  
  // Add event listeners using event delegation for safety
  const noteViewerContainer = document.getElementById('note-view-container');
  if (noteViewerContainer) {
    noteViewerContainer.addEventListener('click', (event) => {
      // Check if the clicked element is the back button or a parent of it has the class
      if (event.target.classList.contains('back-button') || 
          event.target.closest('.back-button')) {
        loadNotes();
        return;
      }
      
      // Check if the clicked element is the edit button or a parent of it has the ID
      if (event.target.id === 'editNoteButton' || 
          event.target.closest('#editNoteButton')) {
        handleEditNote(note);
        return;
      }
    });
  } else {
    console.error('Note viewer container not found');
  }
}

// Handle editing a note
function handleEditNote(note) {
  console.log('Editing note:', note.id, note);
  // Validate we have a valid note object
  if (!note || !note.id) {
    console.error('Invalid note object:', note);
    return;
  }
  
  // Set current note ID
  currentNoteId = note.id;
  
  // Split the content into lines
  console.log('Note content before splitting:', note.content);
  noteLines = note.content ? note.content.split('\n') : [];
  console.log('Note lines after splitting:', noteLines);
  
  // Show the note editor
  const notepadContent = document.getElementById('notepad-content');
  
  // Get the note editor template
  const template = getTemplate('note-editor-template');
  const content = document.importNode(template.content, true);
  
  // Clear the notepad content and append our template
  notepadContent.innerHTML = '';
  notepadContent.appendChild(content);
  
  // Add event listeners
  setupNoteEditorEventListeners();
  
  // Render existing lines
  refreshNoteLines();
  
  // Focus on the input field
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.focus();
  }
}

// Set up event listeners for the note editor
function setupNoteEditorEventListeners() {
  console.log('Setting up note editor event listeners');
  
  // Use a single parent element and event delegation for most of the buttons
  const noteEditorContainer = document.getElementById('note-editor-container');
  if (!noteEditorContainer) {
    console.error('Note editor container not found');
    return;
  }
  
  // Set up event delegation for the note editor container
  noteEditorContainer.addEventListener('click', (event) => {
    // Back button
    if (event.target.classList.contains('back-button') || 
        event.target.closest('.back-button')) {
      console.log('Back button clicked, returning to notes list');
      loadNotes();
      return;
    }
    
    // Save button
    if (event.target.id === 'saveNoteButton' || 
        event.target.closest('#saveNoteButton')) {
      if (event.target.closest('button').disabled) return;
      console.log('Save button clicked');
      handleSaveNote();
      return;
    }
    
    // Add line button
    if (event.target.id === 'addLineButton' || 
        event.target.closest('#addLineButton')) {
      if (event.target.closest('button').disabled) return;
      console.log('Add line button clicked');
      handleAddNoteLine();
      return;
    }
  });
  
  // Set initial state for save button
  const saveButton = document.getElementById('saveNoteButton');
  if (saveButton) {
    saveButton.disabled = noteLines.length === 0;
    console.log('Save button initial state:', saveButton.disabled ? 'disabled' : 'enabled');
  }
  
  // Add line button initial state
  const addLineButton = document.getElementById('addLineButton');
  if (addLineButton) {
    addLineButton.disabled = true;
  }
  
  // Input field events need direct attachment
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('input', () => {
      const addLineButton = document.getElementById('addLineButton');
      if (addLineButton) {
        addLineButton.disabled = !noteInput.value.trim();
      }
    });
    
    noteInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        console.log('Enter key pressed in note input');
        event.preventDefault();
        handleAddNoteLine();
      }
    });
    
    // Focus on the input
    setTimeout(() => noteInput.focus(), 100);
  } else {
    console.error('Note input field not found in the note editor');
  }
  
  console.log('All note editor event listeners set up successfully');
}

// Refresh the display of note lines
function refreshNoteLines() {
  console.log('Refreshing note lines display:', noteLines);
  const linesContainer = document.getElementById('note-lines');
  if (!linesContainer) {
    console.error('Note lines container not found');
    return;
  }
  
  // Clear the container
  linesContainer.innerHTML = '';
  console.log('Cleared lines container');
  
  // Add each line as a div with the new styling
  noteLines.forEach((line, index) => {
    const lineElement = document.createElement('div');
    lineElement.className = 'flex items-start group mb-4';
    lineElement.setAttribute('data-line-index', index);
    
    const textContainer = document.createElement('div');
    textContainer.className = 'flex-1 bg-zinc-800/50 text-white rounded-lg p-3 break-words';
    textContainer.textContent = line;
    
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'ml-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-2';
    
    // Edit button
    const editButton = document.createElement('button');
    editButton.className = 'text-zinc-400 hover:text-white';
    editButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editButton.addEventListener('click', () => {
      // Edit functionality could be added here
      console.log('Edit button clicked for line index:', index);
    });
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-zinc-400 hover:text-red-400';
    deleteButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteButton.addEventListener('click', () => {
      // Remove this line from the array
      noteLines.splice(index, 1);
      refreshNoteLines();
    });
    
    actionsContainer.appendChild(editButton);
    actionsContainer.appendChild(deleteButton);
    
    lineElement.appendChild(textContainer);
    lineElement.appendChild(actionsContainer);
    linesContainer.appendChild(lineElement);
  });
  
  console.log(`Added ${noteLines.length} lines to the display`);
  
  // Update title field with first line if available
  const titleField = document.getElementById('noteTitle');
  if (titleField && noteLines.length > 0) {
    if (!titleField.value) {
      titleField.value = noteLines[0].substring(0, 50) + (noteLines[0].length > 50 ? '...' : '');
    }
  }
  
  // Update add button state
  const addLineButton = document.getElementById('addLineButton');
  if (addLineButton) {
    const noteInput = document.getElementById('noteInput');
    addLineButton.disabled = !noteInput || !noteInput.value.trim();
  }
  
  // Update save button state
  const saveButton = document.getElementById('saveNoteButton');
  if (saveButton) {
    const newDisabledState = noteLines.length === 0;
    saveButton.disabled = newDisabledState;
    saveButton.classList.toggle('bg-zinc-600', newDisabledState);
    saveButton.classList.toggle('text-zinc-300', newDisabledState);
    saveButton.classList.toggle('bg-white', !newDisabledState);
    saveButton.classList.toggle('text-black', !newDisabledState);
    console.log('Updated save button state:', newDisabledState ? 'disabled' : 'enabled');
  } else {
    console.error('Save button not found when updating state');
  }
}

// Handle adding a line to the note
function handleAddNoteLine() {
  console.log('Handling add note line');
  const noteInput = document.getElementById('noteInput');
  if (!noteInput) {
    console.error('Note input field not found when trying to add line');
    return;
  }
  
  const line = noteInput.value.trim();
  if (!line) {
    console.log('Empty line, not adding');
    return;
  }
  
  // Add the line to our array
  console.log('Adding line to noteLines array:', line);
  noteLines.push(line);
  console.log('Current noteLines array:', noteLines);
  
  // Clear the input field
  noteInput.value = '';
  
  // Refresh the line display
  console.log('Refreshing line display after adding line');
  refreshNoteLines();
  
  // Focus back on the input
  noteInput.focus();
  console.log('Focus returned to input field');
}

// Handle saving the note
async function handleSaveNote() {
  console.log('Handling save note, current state:', { noteLines, currentNoteId });
  
  // Validate we have content
  if (noteLines.length === 0) {
    console.error('Cannot save note: Note content is empty');
    showToast('Note content cannot be empty', true);
    return;
  }
  
  // Validate user is authenticated
  if (!isAuthenticated || !currentUser) {
    console.error('Cannot save note: User not authenticated');
    showToast('You must be logged in to save notes', true);
    return;
  }
  
  console.log('Authentication and content validation passed');
  
  // Disable the save button
  const saveButton = document.getElementById('saveNoteButton');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';
  
  try {
    // Prepare the note data
    const content = noteLines.join('\n');
    const title = noteLines[0].substring(0, 50) + (noteLines[0].length > 50 ? '...' : '');
    
    let response;
    const requestData = {
      hostId: currentUser.id,
      title,
      content,
    };
    
    console.log('Preparing request data:', requestData);
    
    if (currentNoteId) {
      // Update existing note
      console.log(`Updating note ${currentNoteId}`);
      const apiUrl = `${API_BASE_URL}/api/notepads/note/${currentNoteId}`;
      console.log('API URL for update:', apiUrl);
      
      try {
        response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        });
        console.log('Update note response status:', response.status);
      } catch (fetchError) {
        console.error('Fetch error during note update:', fetchError);
        throw fetchError;
      }
    } else {
      // Create new note
      console.log('Creating new note');
      const apiUrl = `${API_BASE_URL}/api/notepads`;
      console.log('API URL for create:', apiUrl);
      
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        });
        console.log('Create note response status:', response.status);
      } catch (fetchError) {
        console.error('Fetch error during note creation:', fetchError);
        throw fetchError;
      }
    }
    
    if (response.ok) {
      const savedNote = await response.json();
      console.log('Note saved successfully:', savedNote);
      
      showToast(currentNoteId ? 'Note updated' : 'Note saved');
      
      // Reset state and go back to the notes list
      noteLines = [];
      currentNoteId = null;
      loadNotes();
    } else {
      console.error('Failed to save note:', response.status);
      showToast(`Failed to save note: ${response.status}`, true);
    }
  } catch (error) {
    console.error('Error saving note:', error);
    showToast('Error saving note', true);
  } finally {
    // Re-enable the save button
    saveButton.disabled = false;
    saveButton.textContent = 'Save';
  }
}

// Add keyboard shortcut for saving
document.addEventListener('keydown', (event) => {
  // Detect Ctrl+S or Cmd+S while in note editor
  if ((event.ctrlKey || event.metaKey) && event.key === 's' && 
      document.getElementById('noteInput')) {
    event.preventDefault();
    handleSaveNote();
  }
});