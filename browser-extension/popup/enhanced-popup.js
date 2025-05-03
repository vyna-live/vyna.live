// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vyna-live.replit.app';

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
let savedNotes = [];
let currentNoteId = null;
let commentaryStyle = 'color'; // Default to color commentary

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
      initializeTabs();
      loadActiveTab();
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
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usernameOrEmail: username, // Make sure this matches the server's expected parameter name
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
  // Add event listeners to the tab buttons
  const tabButtons = document.querySelectorAll('.tab');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update active tab
  activeTab = tabName;
  
  // Update tab UI
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update content UI
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    if (content.id === `${tabName}-content`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // Load the content for the active tab
  loadActiveTab();
}

async function loadActiveTab() {
  if (activeTab === 'vynaai') {
    await loadChatSessions();
  } else if (activeTab === 'notepad') {
    await loadNotes();
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

// Notepad functions
async function loadNotes() {
  if (!isAuthenticated || !currentUser) return;
  
  try {
    const notepadContent = document.getElementById('notepad-content');
    
    // Start with a loading state
    notepadContent.innerHTML = '<div class="loading">Loading notes...</div>';
    
    // Fetch the notes
    const response = await fetch(`${API_BASE_URL}/api/notepads/${currentUser.id}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const notesData = await response.json();
      savedNotes = notesData;
      
      // Get the notes list template and clone it
      const notesListTemplate = getTemplate('notepad-list-template'); // Using the cache to get template
      const notesListContent = document.importNode(notesListTemplate.content, true);
      
      // Clear the content area and append the template
      notepadContent.innerHTML = '';
      notepadContent.appendChild(notesListContent);
      
      // Populate the notes list
      const notesList = document.querySelector('.notes-list');
      if (savedNotes.length > 0) {
        savedNotes.forEach(note => {
          const noteItem = createNoteItem(note);
          notesList.appendChild(noteItem);
        });
      } else {
        notesList.innerHTML = '<div class="empty-notes-message">No saved notes. Create a new note to get started.</div>';
      }
      
      // Add event listener to new note button
      document.getElementById('newNoteButton').addEventListener('click', createNewNote);
    } else {
      notepadContent.innerHTML = '<div class="error">Failed to load notes</div>';
    }
  } catch (error) {
    console.error('Error loading notes:', error);
    document.getElementById('notepad-content').innerHTML = '<div class="error">Error loading notes</div>';
  }
}

function createNoteItem(note) {
  // Get the note item template and clone it
  const noteItemTemplate = getTemplate('note-item-template');
  const noteItem = document.importNode(noteItemTemplate.content, true);
  
  // Set note title and preview
  const titleElement = noteItem.querySelector('.note-title');
  titleElement.textContent = note.title || 'Untitled Note';
  
  const previewElement = noteItem.querySelector('.note-preview');
  previewElement.textContent = note.content ? note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '') : 'Empty note';
  
  // Set date
  const dateElement = noteItem.querySelector('.note-date');
  dateElement.textContent = new Date(note.updatedAt || note.createdAt).toLocaleDateString();
  
  // Add event listener to note item
  const noteElement = noteItem.querySelector('.note');
  noteElement.addEventListener('click', () => viewNote(note.id));
  
  return noteItem;
}

function createNewNote() {
  currentNoteId = null;
  showNoteEditor();
}

async function viewNote(noteId) {
  try {
    const notepadContent = document.getElementById('notepad-content');
    
    // Start with a loading state
    notepadContent.innerHTML = '<div class="loading">Loading note...</div>';
    
    // Fetch the note
    const response = await fetch(`${API_BASE_URL}/api/notepads/note/${noteId}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const noteData = await response.json();
      currentNoteId = noteData.id;
      showNoteViewer(noteData);
    } else {
      notepadContent.innerHTML = '<div class="error">Failed to load note</div>';
    }
  } catch (error) {
    console.error('Error loading note:', error);
    document.getElementById('notepad-content').innerHTML = '<div class="error">Error loading note</div>';
  }
}

function showNoteEditor(existingNote = null) {
  const notepadContent = document.getElementById('notepad-content');
  
  // Get the note editor template and clone it
  const noteEditorTemplate = getTemplate('note-editor-template');
  const noteEditorContent = document.importNode(noteEditorTemplate.content, true);
  
  // Clear the content area and append the template
  notepadContent.innerHTML = '';
  notepadContent.appendChild(noteEditorContent);
  
  // Add event listeners
  document.getElementById('backToNotes').addEventListener('click', () => loadNotes());
  document.getElementById('saveNoteButton').addEventListener('click', saveNote);
  const addLineButton = document.getElementById('addLineButton');
  addLineButton.addEventListener('click', addNoteLine);
  
  // Make sure add line button is always enabled
  addLineButton.disabled = false;
  
  const noteInput = document.getElementById('noteInput');
  const saveNoteButton = document.getElementById('saveNoteButton');
  const noteTitle = document.getElementById('noteTitle');
  
  // Add keydown handler
  noteInput.addEventListener('keydown', handleNoteInputKeyDown);
  
  // Enable/disable save button based on input
  const updateSaveButtonState = () => {
    saveNoteButton.disabled = noteInput.value.trim() === '' && noteTitle.value.trim() === '';
  };
  
  noteInput.addEventListener('input', updateSaveButtonState);
  noteTitle.addEventListener('input', updateSaveButtonState);
  
  // Initialize button state
  updateSaveButtonState();
  
  // If editing existing note, populate the fields
  if (existingNote) {
    document.getElementById('noteTitle').value = existingNote.title || '';
    document.getElementById('noteInput').value = existingNote.content || '';
    
    // Ensure save button is updated with the loaded content
    updateSaveButtonState();
  }
  
  // Focus on title if empty, otherwise on content
  if (!existingNote || !existingNote.title) {
    document.getElementById('noteTitle').focus();
  } else {
    document.getElementById('noteInput').focus();
  }
}

function showNoteViewer(note) {
  const notepadContent = document.getElementById('notepad-content');
  
  // Get the note viewer template and clone it
  const noteViewerTemplate = getTemplate('note-viewer-template');
  const noteViewerContent = document.importNode(noteViewerTemplate.content, true);
  
  // Clear the content area and append the template
  notepadContent.innerHTML = '';
  notepadContent.appendChild(noteViewerContent);
  
  // Add event listeners
  document.getElementById('backToNotes').addEventListener('click', () => loadNotes());
  document.getElementById('editNoteButton').addEventListener('click', () => showNoteEditor(note));
  
  // Populate note details
  document.getElementById('noteViewTitle').textContent = note.title || 'Untitled Note';
  document.getElementById('noteViewContent').textContent = note.content || 'No content';
  document.getElementById('noteViewDate').textContent = `Last updated: ${new Date(note.updatedAt || note.createdAt).toLocaleString()}`;
}

function addNoteLine() {
  const noteInput = document.getElementById('noteInput');
  const currentValue = noteInput.value;
  
  // Add a proper new line with bullet point
  // If there's no content yet, don't add a leading newline
  if (currentValue.trim() === '') {
    noteInput.value = '- ';
  } else {
    // If the content doesn't end with a newline, add one
    if (!currentValue.endsWith('\n')) {
      noteInput.value = currentValue + '\n- ';
    } else {
      noteInput.value = currentValue + '- ';
    }
  }
  
  noteInput.focus();
  
  // Move cursor to the end
  noteInput.selectionStart = noteInput.selectionEnd = noteInput.value.length;
  
  // Manually trigger input event to update save button state
  noteInput.dispatchEvent(new Event('input'));
}

async function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteInput').value.trim();
  
  console.log('Attempting to save note:', { title, content, isAuthenticated, currentUser });
  
  if (!title && !content) {
    showToast('Please enter a title or some content', true);
    return;
  }
  
  // Verify we have user credentials
  if (!isAuthenticated || !currentUser) {
    console.error('Cannot save note: User not authenticated');
    showToast('You must be logged in to save notes', true);
    return;
  }
  
  try {
    let response;
    
    if (currentNoteId) {
      // Update existing note
      response = await fetch(`${API_BASE_URL}/api/notepads/note/${currentNoteId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content
        })
      });
    } else {
      // Create new note
      response = await fetch(`${API_BASE_URL}/api/notepads`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: currentUser.id,
          title: title || 'Untitled Note',
          content
        })
      });
    }
    
    if (response.ok) {
      const noteData = await response.json();
      currentNoteId = noteData.id;
      
      console.log('Note saved successfully:', noteData);
      showToast('Note saved successfully');
      showNoteViewer(noteData);
    } else {
      // Try to get more detailed error information
      try {
        const errorData = await response.json();
        console.error('Failed to save note:', { status: response.status, error: errorData });
        showToast(`Failed to save note: ${errorData.error || 'Unknown error'}`, true);
      } catch (parseError) {
        console.error('Failed to save note (could not parse error):', { status: response.status });
        showToast(`Failed to save note: Server returned ${response.status}`, true);
      }
    }
  } catch (error) {
    console.error('Error saving note:', error);
    showToast('Error saving note', true);
  }
}

function handleNoteInputKeyDown(event) {
  // Detect Ctrl+S or Cmd+S
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    saveNote();
  }
}