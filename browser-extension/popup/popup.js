// Popup script for Vyna.live extension

// State
let state = {
  isAuthenticated: false,
  currentTab: 'vynaai',
  user: null,
  messages: [],
  notes: [],
  chatSessions: [],
  currentSession: null,
  currentNote: null,
  noteLines: [],
  noteTags: [],
  filterTag: null,
  searchQuery: ''
};

// DOM Elements will be initialized when document is loaded
let app;
let loginTemplate;
let appTemplate;
let messageTemplate;
let noteItemTemplate;
let noteTagTemplate;

// Initialize popup
async function initPopup() {
  try {
    // Get authentication state from background script
    const authState = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    state.isAuthenticated = authState.isAuthenticated;
    state.user = authState.user;
    
    if (state.isAuthenticated) {
      renderApp();
      await loadUserData();
    } else {
      renderLogin();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    renderLogin();
  }
}

// Load user data if authenticated
async function loadUserData() {
  try {
    // Show loading state
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading';
    loadingEl.innerHTML = '<div class="spinner"></div>';
    
    if (!state.user || !state.user.id) {
      console.error('User ID not available for loading data');
      return;
    }
    
    const hostId = state.user.id;
    
    // Load notes
    const notesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/notepads/${hostId}`,
        method: 'GET'
      }
    });
    
    if (notesResponse.success) {
      state.notes = notesResponse.data;
      // Render notes in the UI
      renderAllNotes();
    }
    
    // Load AI chat sessions
    const chatSessionsResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/ai-chat-sessions/${hostId}`,
        method: 'GET'
      }
    });
    
    if (chatSessionsResponse.success) {
      state.chatSessions = chatSessionsResponse.data;
      // If there are chat sessions, load the most recent one
      if (state.chatSessions && state.chatSessions.length > 0) {
        await loadChatSession(state.chatSessions[0].id);
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Load a specific chat session
async function loadChatSession(sessionId) {
  try {
    const messagesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/ai-chat-messages/${sessionId}`,
        method: 'GET'
      }
    });
    
    if (messagesResponse.success) {
      state.messages = messagesResponse.data.map(msg => ({
        id: msg.id.toString(),
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: msg.createdAt
      }));
      
      // Render messages
      state.messages.forEach(message => renderChatMessage(message));
    }
  } catch (error) {
    console.error('Error loading chat session:', error);
  }
}

// Extract and collect tags from all notes
function collectAllTags() {
  state.noteTags = [];
  
  if (!state.notes || state.notes.length === 0) return;
  
  // Extract tags from all notes
  state.notes.forEach(note => {
    // Extract tags from content using hashtag pattern
    const content = note.content || '';
    const tagMatches = content.match(/#\w+/g) || [];
    
    // Process and add unique tags
    tagMatches.forEach(tag => {
      const cleanTag = tag.substring(1).toLowerCase(); // Remove # and lowercase
      if (!state.noteTags.includes(cleanTag)) {
        state.noteTags.push(cleanTag);
      }
    });
  });
  
  // Sort tags alphabetically
  state.noteTags.sort();
}

// Extract tags from a single note
function extractNoteTags(note) {
  const content = note.content || '';
  const tagMatches = content.match(/#\w+/g) || [];
  return tagMatches.map(tag => tag.substring(1).toLowerCase());
}

// Render all notes
function renderAllNotes(searchQuery = '') {
  const notesList = document.getElementById('notes-list');
  clearElement(notesList);
  
  // Update state
  state.searchQuery = searchQuery;
  
  // Collect all tags
  collectAllTags();
  
  // Add tag filters if we have tags
  if (state.noteTags.length > 0) {
    const tagFiltersContainer = document.createElement('div');
    tagFiltersContainer.className = 'note-tag-filters';
    
    // Add "All" filter
    const allTagChip = document.createElement('div');
    allTagChip.className = `note-tag-filter ${!state.filterTag ? 'active' : ''}`;
    allTagChip.textContent = 'All';
    allTagChip.addEventListener('click', () => {
      state.filterTag = null;
      renderAllNotes(state.searchQuery);
    });
    tagFiltersContainer.appendChild(allTagChip);
    
    // Add tag filters
    state.noteTags.forEach(tag => {
      const tagChip = document.createElement('div');
      tagChip.className = `note-tag-filter ${state.filterTag === tag ? 'active' : ''}`;
      tagChip.textContent = `#${tag}`;
      tagChip.addEventListener('click', () => {
        state.filterTag = tag;
        renderAllNotes(state.searchQuery);
      });
      tagFiltersContainer.appendChild(tagChip);
    });
    
    notesList.appendChild(tagFiltersContainer);
  }
  
  if (state.notes && state.notes.length > 0) {
    // Filter notes by tag and search query
    let filteredNotes = state.notes;
    
    // Filter by tag if a tag filter is selected
    if (state.filterTag) {
      filteredNotes = filteredNotes.filter(note => {
        const noteTags = extractNoteTags(note);
        return noteTags.includes(state.filterTag);
      });
    }
    
    // Filter by search query if provided
    if (searchQuery) {
      filteredNotes = filteredNotes.filter(note => {
        const content = (note.content || '').toLowerCase();
        const title = (note.title || '').toLowerCase();
        return content.includes(searchQuery.toLowerCase()) || title.includes(searchQuery.toLowerCase());
      });
    }
    
    if (filteredNotes.length === 0) {
      // Show empty state for search/filter
      const emptyState = document.createElement('div');
      emptyState.className = 'notes-empty-state';
      emptyState.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No matches found</h3>
        <p>${state.filterTag ? `No notes with tag #${state.filterTag}` : `We couldn't find any notes matching "${searchQuery}"`}</p>
      `;
      notesList.appendChild(emptyState);
    } else {
      // Create notes container
      const notesContainer = document.createElement('div');
      notesContainer.className = 'notes-container';
      
      // Render filtered notes
      filteredNotes.forEach(note => {
        renderNote(note, notesContainer);
      });
      
      notesList.appendChild(notesContainer);
    }
  } else {
    // Show empty state for no notes
    const emptyState = document.createElement('div');
    emptyState.className = 'notes-empty-state';
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <h3>No notes yet</h3>
      <p>Start adding notes by typing in the input field below</p>
    `;
    notesList.appendChild(emptyState);
  }
}

// Render login page
function renderLogin() {
  clearElement(app);
  const loginNode = document.importNode(loginTemplate.content, true);
  app.appendChild(loginNode);
  
  // Add event listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('google-btn').addEventListener('click', handleGoogleAuth);
  
  // Setup tab switching
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // Remove active class from all triggers
      tabTriggers.forEach(t => t.classList.remove('active'));
      // Add active class to clicked trigger
      trigger.classList.add('active');
      
      // Update tab content visibility
      const tabName = trigger.dataset.tab;
      document.querySelectorAll('.auth-tabs .tab-content').forEach(content => {
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Clear error messages when switching tabs
      document.getElementById('auth-error').style.display = 'none';
    });
  });
}

// Render main app
function renderApp() {
  clearElement(app);
  const appNode = document.importNode(appTemplate.content, true);
  app.appendChild(appNode);
  
  // Add tab switching event listeners
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });
  
  // Create and add sessions list
  const chatSessionsListEl = document.createElement('div');
  chatSessionsListEl.id = 'chat-sessions-list';
  chatSessionsListEl.className = 'sessions-list';
  const vynaaiContent = document.getElementById('vynaai-content');
  vynaaiContent.insertBefore(chatSessionsListEl, vynaaiContent.firstChild);
  
  // Create and add style selection
  const styleSelectionEl = document.createElement('div');
  styleSelectionEl.className = 'style-selection';
  styleSelectionEl.innerHTML = `
    <div class="style-chip tooltip" data-style="play-by-play">
      <span>PP</span>
      <span class="tooltip-text">Play-by-Play: Quick, action-oriented responses</span>
    </div>
    <div class="style-chip tooltip active" data-style="color">
      <span>CC</span>
      <span class="tooltip-text">Color Commentary: Detailed, insightful responses</span>
    </div>
  `;
  
  // Add style selection before the input container
  const chatInputContainer = document.querySelector('#vynaai-content .input-container');
  vynaaiContent.insertBefore(styleSelectionEl, chatInputContainer);
  
  // Add event listeners for style chips
  const styleChips = document.querySelectorAll('.style-chip');
  styleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Remove active class from all chips
      styleChips.forEach(c => c.classList.remove('active'));
      // Add active class to clicked chip
      chip.classList.add('active');
    });
  });
  
  // Add event listeners for the chat input
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  
  // Add send button event listener
  const sendButton = document.getElementById('send-btn');
  if (sendButton) {
    sendButton.addEventListener('click', sendChatMessage);
  }
  
  // Add event listeners for file uploads
  setupFileUploadHandlers();
  
  // Add event listener for adding notes
  document.getElementById('add-note-btn').addEventListener('click', addNote);
  document.getElementById('note-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  });
  
  // Add event listener for note search
  const notesSearchInput = document.getElementById('notes-search');
  notesSearchInput.addEventListener('input', (e) => {
    const searchQuery = e.target.value.trim();
    renderAllNotes(searchQuery);
  });
  
  // Add debounce to search input
  let searchTimeout;
  notesSearchInput.addEventListener('keyup', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchQuery = e.target.value.trim();
      renderAllNotes(searchQuery);
    }, 300);
  });
  
  // Render sessions list
  renderSessionsList();
}

// Switch between tabs
function switchTab(tabId) {
  state.currentTab = tabId;
  
  // Update tab UI
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update content UI
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    if (content.id === `${tabId}-content`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  const usernameOrEmail = document.getElementById('usernameOrEmail').value;
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('auth-error');
  const errorMessageElement = document.getElementById('error-message');
  
  // Clear existing errors
  errorElement.style.display = 'none';
  document.getElementById('usernameOrEmail-error').textContent = '';
  document.getElementById('password-error').textContent = '';
  
  // Validate inputs
  let hasErrors = false;
  if (!usernameOrEmail) {
    document.getElementById('usernameOrEmail-error').textContent = 'Username or email is required';
    hasErrors = true;
  }
  
  if (!password) {
    document.getElementById('password-error').textContent = 'Password is required';
    hasErrors = true;
  }
  
  if (hasErrors) {
    return;
  }
  
  try {
    const loginBtn = document.getElementById('login-btn');
    const originalBtnContent = loginBtn.innerHTML;
    
    // Show loading state
    loginBtn.innerHTML = `<span class="loading-indicator"></span> Signing in...`;
    loginBtn.disabled = true;
    
    const result = await chrome.runtime.sendMessage({
      type: 'LOGIN',
      data: { usernameOrEmail, password }
    });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      renderApp();
      await loadUserData();
    } else {
      // Show error message
      errorMessageElement.textContent = result.error || 'Login failed. Please try again.';
      errorElement.style.display = 'flex';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessageElement.textContent = 'An error occurred during login. Please try again.';
    errorElement.style.display = 'flex';
  } finally {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.innerHTML = `
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        <span>Sign in</span>
      `;
      loginBtn.disabled = false;
    }
  }
}

// Handle registration form submission
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const errorElement = document.getElementById('auth-error');
  const errorMessageElement = document.getElementById('error-message');
  
  // Clear existing errors
  errorElement.style.display = 'none';
  document.getElementById('register-username-error').textContent = '';
  document.getElementById('register-email-error').textContent = '';
  document.getElementById('register-password-error').textContent = '';
  
  // Validate inputs
  let hasErrors = false;
  if (!username) {
    document.getElementById('register-username-error').textContent = 'Username is required';
    hasErrors = true;
  } else if (username.length < 3) {
    document.getElementById('register-username-error').textContent = 'Username must be at least 3 characters';
    hasErrors = true;
  }
  
  if (!email) {
    document.getElementById('register-email-error').textContent = 'Email is required';
    hasErrors = true;
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    document.getElementById('register-email-error').textContent = 'Invalid email address';
    hasErrors = true;
  }
  
  if (!password) {
    document.getElementById('register-password-error').textContent = 'Password is required';
    hasErrors = true;
  } else if (password.length < 8) {
    document.getElementById('register-password-error').textContent = 'Password must be at least 8 characters';
    hasErrors = true;
  }
  
  if (hasErrors) {
    return;
  }
  
  try {
    const registerBtn = document.getElementById('register-btn');
    const originalBtnContent = registerBtn.innerHTML;
    
    // Show loading state
    registerBtn.innerHTML = `<span class="loading-indicator"></span> Creating account...`;
    registerBtn.disabled = true;
    
    const result = await chrome.runtime.sendMessage({
      type: 'REGISTER',
      data: { username, email, password }
    });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      renderApp();
      await loadUserData();
    } else {
      // Show error message
      errorMessageElement.textContent = result.error || 'Registration failed. Please try again.';
      errorElement.style.display = 'flex';
    }
  } catch (error) {
    console.error('Registration error:', error);
    errorMessageElement.textContent = 'An error occurred during registration. Please try again.';
    errorElement.style.display = 'flex';
  } finally {
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      registerBtn.innerHTML = `
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        <span>Create account</span>
      `;
      registerBtn.disabled = false;
    }
  }
}

// Handle Google authentication
async function handleGoogleAuth() {
  try {
    const googleBtn = document.getElementById('google-btn');
    const originalBtnContent = googleBtn.innerHTML;
    const errorElement = document.getElementById('auth-error');
    const errorMessageElement = document.getElementById('error-message');
    
    // Clear existing errors
    errorElement.style.display = 'none';
    
    // Show loading state
    googleBtn.innerHTML = `<span class="loading-indicator"></span> Connecting...`;
    googleBtn.disabled = true;
    
    const result = await chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH' });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      renderApp();
      await loadUserData();
    } else {
      // Show error message
      errorMessageElement.textContent = result.error || 'Google authentication failed. Please try again.';
      errorElement.style.display = 'flex';
    }
  } catch (error) {
    console.error('Google auth error:', error);
    const errorElement = document.getElementById('auth-error');
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = 'An error occurred during Google authentication. Please try again.';
    errorElement.style.display = 'flex';
  } finally {
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
      googleBtn.innerHTML = '<img src="../assets/google-icon.svg" alt="Google" class="google-icon"><span>Continue with Google</span>';
      googleBtn.disabled = false;
    }
  }
}

// Create a new chat session
async function createNewChatSession() {
  try {
    // Clear messages
    state.messages = [];
    const chatContainer = document.getElementById('chat-container');
    clearElement(chatContainer);
    
    // Show empty state
    const emptyState = document.getElementById('vynaai-empty-state');
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
    
    // Create new session
    if (!state.user || !state.user.id) {
      console.error('User ID not available for creating new chat session');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat-sessions',
        method: 'POST',
        data: {
          hostId: state.user.id,
          title: 'New Session',
        }
      }
    });
    
    if (response.success) {
      state.currentSession = response.data;
      
      // Add to sessions list
      state.chatSessions.unshift(response.data);
      
      // Update session list UI
      renderSessionsList();
    } else {
      console.error('Error creating new session:', response.error);
    }
  } catch (error) {
    console.error('Error creating new session:', error);
  }
}

// Render the list of chat sessions
function renderSessionsList() {
  const sessionsListEl = document.getElementById('chat-sessions-list');
  if (!sessionsListEl) return;
  
  clearElement(sessionsListEl);
  
  // Create new chat button
  const newChatBtn = document.createElement('div');
  newChatBtn.className = 'session-item new-chat';
  newChatBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>New Chat</span>
  `;
  newChatBtn.addEventListener('click', createNewChatSession);
  sessionsListEl.appendChild(newChatBtn);
  
  // Add separator
  const separator = document.createElement('div');
  separator.className = 'sessions-separator';
  sessionsListEl.appendChild(separator);
  
  // Add existing sessions
  if (state.chatSessions && state.chatSessions.length > 0) {
    state.chatSessions.forEach(session => {
      const sessionEl = document.createElement('div');
      sessionEl.className = `session-item${state.currentSession && state.currentSession.id === session.id ? ' active' : ''}`;
      sessionEl.dataset.id = session.id;
      sessionEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${session.title || 'Untitled Chat'}</span>
      `;
      sessionEl.addEventListener('click', () => loadChatSession(session.id));
      sessionsListEl.appendChild(sessionEl);
    });
  }
}

// Show AI is typing indicator
function showTypingIndicator() {
  const chatContainer = document.getElementById('chat-container');
  const loadingEl = document.createElement('div');
  loadingEl.className = 'message-loading';
  loadingEl.id = 'typing-indicator';
  loadingEl.innerHTML = `
    <span class="loading-dot"></span>
    <span>Vyna is thinking...</span>
  `;
  chatContainer.appendChild(loadingEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send a chat message
async function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  try {
    // Create a new session if no current session
    if (!state.currentSession) {
      await createNewChatSession();
    }
    
    chatInput.value = '';
    chatInput.disabled = true;
    
    // Create message object
    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    // Add to messages array
    state.messages.push(newMessage);
    
    // Render message
    renderChatMessage(newMessage);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Get selected commentary style
    const commentaryStyle = document.querySelector('.style-chip.active')?.dataset.style || 'color';
    
    // Send message to API
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat',
        method: 'POST',
        data: {
          message,
          sessionId: state.currentSession.id,
          commentaryStyle
        }
      }
    });
    
    // Remove typing indicator
    removeTypingIndicator();
    
    if (response.success) {
      // Create AI response message
      const aiMessage = {
        id: Date.now().toString(),
        content: response.data.content || response.data.message,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      // Add to messages array
      state.messages.push(aiMessage);
      
      // Render message
      renderChatMessage(aiMessage);
      
      // Update session title if it's new
      if (state.currentSession && state.currentSession.title === 'New Session') {
        // Generate title based on first message
        const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        
        // Update session in state
        state.currentSession.title = title;
        
        // Update session in sessions list
        const sessionIndex = state.chatSessions.findIndex(s => s.id === state.currentSession.id);
        if (sessionIndex !== -1) {
          state.chatSessions[sessionIndex].title = title;
        }
        
        // Update session title in API
        await chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          data: {
            endpoint: `/api/ai-chat-sessions/${state.currentSession.id}`,
            method: 'PUT',
            data: { title }
          }
        });
        
        // Re-render sessions list
        renderSessionsList();
      }
    } else {
      console.error('Error sending message:', response.error);
      // Show error message in chat
      const errorMessage = {
        id: Date.now().toString(),
        content: `<div class="error-message">Error: ${response.error || 'Failed to get response from Vyna'}</div>`,
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      state.messages.push(errorMessage);
      renderChatMessage(errorMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    // Show error message in chat
    removeTypingIndicator();
    const errorMessage = {
      id: Date.now().toString(),
      content: `<div class="error-message">Error: ${error.message || 'Failed to communicate with the server'}</div>`,
      sender: 'system',
      timestamp: new Date().toISOString()
    };
    state.messages.push(errorMessage);
    renderChatMessage(errorMessage);
  } finally {
    // Re-enable input
    chatInput.disabled = false;
    chatInput.focus();
  }
}

// Render a chat message
function renderChatMessage(message) {
  try {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
      console.error('Chat container not found');
      return;
    }
    
    // If empty state is visible, hide it
    const emptyState = document.getElementById('vynaai-empty-state');
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    
    // Make chat container visible
    chatContainer.classList.remove('hidden');
    
    // Use the globally stored messageTemplate variable
    if (!messageTemplate) {
      // Fallback to get it directly if the global one isn't initialized yet
      console.log('Using fallback to get message template');
      const templateEl = document.getElementById('message-template');
      if (!templateEl) {
        console.error('Message template not found');
        return;
      }
      messageTemplate = templateEl;
    }
    
    const messageNode = document.importNode(messageTemplate.content, true);
    const messageEl = messageNode.querySelector('.message');
    
    // Set message class based on sender
    messageEl.classList.add(message.sender);
    
    // Set message content
    messageEl.querySelector('.message-content').innerHTML = message.content;
    
    // Add message actions for AI responses
    if (message.sender === 'assistant') {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'message-actions';
      
      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'message-action-btn copy-btn';
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener('click', () => copyMessageToClipboard(message));
      
      // Save to note button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'message-action-btn save-btn';
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save to Notes</span>
      `;
      saveBtn.addEventListener('click', () => saveMessageAsNote(message));
      
      actionsContainer.appendChild(copyBtn);
      actionsContainer.appendChild(saveBtn);
      messageEl.appendChild(actionsContainer);
    }
    
    // Append to container
    chatContainer.appendChild(messageNode);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (error) {
    console.error('Error rendering chat message:', error);
  }
}

// Copy message content to clipboard
async function copyMessageToClipboard(message) {
  try {
    // Extract text content from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    await navigator.clipboard.writeText(textContent);
    
    // Show copied notification
    const copyBtn = document.querySelector('.copy-btn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span>Copied!</span>';
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy message:', error);
  }
}

// Save message as a note
async function saveMessageAsNote(message) {
  try {
    // Extract text content from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Generate a title from the first line
    const firstLine = textContent.split('\n')[0];
    const title = firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '');
    
    if (!state.user || !state.user.id) {
      console.error('User ID not available for saving note');
      return;
    }
    
    // Create note
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'POST',
        data: {
          hostId: state.user.id,
          content: textContent,
          title
        }
      }
    });
    
    if (response.success) {
      // Add to notes array
      state.notes.push(response.data);
      
      // Show saved notification
      const saveBtn = document.querySelector('.save-btn');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<span>Saved!</span>';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
      }, 2000);
      
      // Switch to notes tab to show the newly created note
      switchTab('notepad');
      renderAllNotes();
    } else {
      console.error('Error creating note:', response.error);
    }
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Add a note
async function addNote() {
  const noteInput = document.getElementById('note-input');
  const noteText = noteInput.value.trim();
  
  if (!noteText) return;
  
  if (!state.user || !state.user.id) {
    console.error('User ID not available for saving note');
    return;
  }
  
  try {
    noteInput.value = '';
    
    // Send note to API with hostId
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'POST',
        data: {
          hostId: state.user.id,
          content: noteText,
          title: noteText.substring(0, 30) + (noteText.length > 30 ? '...' : '')
        }
      }
    });
    
    if (response.success) {
      // Add to notes array
      state.notes.push(response.data);
      
      // Render note
      renderNote(response.data);
    } else {
      console.error('Error creating note:', response.error);
    }
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

// Delete a note
async function deleteNote(noteId, event) {
  if (event) {
    event.stopPropagation(); // Prevent opening the note editor when clicking delete
  }
  
  // Ask for confirmation
  if (!confirm('Are you sure you want to delete this note?')) {
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/notepads/${noteId}`,
        method: 'DELETE'
      }
    });
    
    if (response.success) {
      // Remove from state
      state.notes = state.notes.filter(note => note.id !== noteId);
      
      // If this was the current note, clear current note
      if (state.currentNote && state.currentNote.id === noteId) {
        state.currentNote = null;
        state.noteLines = [];
        closeNoteEditor();
      }
      
      // Re-render notes list
      renderAllNotes();
    } else {
      console.error('Error deleting note:', response.error);
      alert('Error deleting note. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    alert('Error deleting note. Please try again.');
  }
}

// Render a note in the notes list
function renderNote(note, container = null) {
  try {
    const noteContainer = container || document.getElementById('notes-list');
    if (!noteContainer) {
      console.error('Notes container not found');
      return;
    }
    
    // Use the globally stored noteItemTemplate variable
    if (!noteItemTemplate) {
      // Fallback to get it directly if the global one isn't initialized yet
      console.log('Using fallback to get note item template');
      const templateEl = document.getElementById('note-item-template');
      if (!templateEl) {
        console.error('Note item template not found');
        return;
      }
      noteItemTemplate = templateEl;
    }
    
    const noteNode = document.importNode(noteItemTemplate.content, true);
    const noteEl = noteNode.querySelector('.note-item');
  
  // Set note data
  noteEl.dataset.id = note.id;
  noteEl.querySelector('.note-item-title').textContent = note.title || 'Untitled Note';
  noteEl.querySelector('.note-item-preview').textContent = note.content?.substring(0, 50) + (note.content?.length > 50 ? '...' : '');
  
  // Render tags
  const tagsContainer = noteEl.querySelector('.note-item-tags');
  const noteTags = extractNoteTags(note);
  
  if (noteTags.length > 0) {
    noteTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'note-tag';
      tagEl.textContent = `#${tag}`;
      tagEl.addEventListener('click', (e) => {
        e.stopPropagation();
        state.filterTag = tag;
        renderAllNotes(state.searchQuery);
      });
      tagsContainer.appendChild(tagEl);
    });
  }
  
  // Create actions container
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'note-item-actions';
  
  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'note-item-action delete-note';
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', (e) => deleteNote(note.id, e));
  
  // Create export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'note-item-action export-note';
  exportBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `;
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Export note as text file
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'untitled'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  // Add buttons to actions container
  actionsContainer.appendChild(exportBtn);
  actionsContainer.appendChild(deleteBtn);
  
  // Add actions container to note item
  noteEl.appendChild(actionsContainer);
  
  // Add click event for opening note
  noteEl.addEventListener('click', () => openNote(note));
  
  // Append to list
  noteContainer.appendChild(noteNode);
  } catch (error) {
    console.error('Error rendering note:', error);
  }
}

// Helper function to process line text and highlight tags
function processLineWithTags(line) {
  const tagRegex = /#\w+/g;
  return line.replace(tagRegex, match => {
    return `<span class="inline-tag">${match}</span>`;
  });
}

// Open a note for editing
function openNote(note) {
  // Update state
  state.currentNote = note;
  state.noteLines = note.content.split('\n');
  
  // Hide notes list and show note editor
  const notesList = document.getElementById('notes-list');
  notesList.style.display = 'none';
  
  // Process lines to highlight tags
  const processedLines = state.noteLines.map(line => {
    const processedLine = processLineWithTags(line);
    return `<p class="note-paragraph">${processedLine}</p>`;
  }).join('');
  
  // Create note editor interface
  const noteEditor = document.createElement('div');
  noteEditor.className = 'note-editor';
  noteEditor.id = 'note-editor';
  noteEditor.innerHTML = `
    <div class="note-editor-header">
      <div class="note-editor-back" id="back-to-notes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18L9 12L15 6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="note-editor-title">${note.title || 'Untitled Note'}</div>
      <button class="note-editor-save" id="save-edited-note">Save</button>
    </div>
    
    <div class="note-editor-content">
      <div class="note-paragraphs" id="note-paragraphs">
        ${processedLines}
      </div>
      
      <div class="note-input-container">
        <textarea class="input-area" id="note-edit-input" placeholder="Add to your note (use #tag for categorization)"></textarea>
        <button class="add-note-btn" id="add-note-line">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add line
        </button>
      </div>
    </div>
  `;
  
  // Add to DOM
  const notepadContent = document.getElementById('notepad-content');
  notepadContent.appendChild(noteEditor);
  
  // Add event listeners
  document.getElementById('back-to-notes').addEventListener('click', closeNoteEditor);
  document.getElementById('save-edited-note').addEventListener('click', saveEditedNote);
  document.getElementById('add-note-line').addEventListener('click', addNoteLineToEditor);
  
  const noteEditInput = document.getElementById('note-edit-input');
  noteEditInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteLineToEditor();
    }
  });
}

// Close note editor and return to notes list
function closeNoteEditor() {
  // Remove editor
  const noteEditor = document.getElementById('note-editor');
  if (noteEditor) {
    noteEditor.remove();
  }
  
  // Show notes list
  const notesList = document.getElementById('notes-list');
  notesList.style.display = 'block';
  
  // Reset state
  state.currentNote = null;
  state.noteLines = [];
}

// Add a line to the open note
function addNoteLineToEditor() {
  const noteEditInput = document.getElementById('note-edit-input');
  const line = noteEditInput.value.trim();
  
  if (!line) return;
  
  // Add to state
  state.noteLines.push(line);
  
  // Add to UI
  const noteParagraphs = document.getElementById('note-paragraphs');
  const newParagraph = document.createElement('p');
  newParagraph.className = 'note-paragraph';
  
  // Check for tags in the line and highlight them
  const tagRegex = /#\w+/g;
  const lineWithHighlightedTags = line.replace(tagRegex, match => {
    return `<span class="inline-tag">${match}</span>`;
  });
  
  // Use innerHTML to render the tags as styled spans
  newParagraph.innerHTML = lineWithHighlightedTags;
  noteParagraphs.appendChild(newParagraph);
  
  // Clear input
  noteEditInput.value = '';
  
  // Scroll to bottom
  const noteEditorContent = document.querySelector('.note-editor-content');
  noteEditorContent.scrollTop = noteEditorContent.scrollHeight;
}

// Save edited note
async function saveEditedNote() {
  if (!state.currentNote) return;
  
  try {
    // Update note content
    const content = state.noteLines.join('\n');
    const title = state.noteLines[0]?.substring(0, 50) + (state.noteLines[0]?.length > 50 ? '...' : '') || 'Untitled Note';
    
    // Send to server
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/notepads/${state.currentNote.id}`,
        method: 'PUT',
        data: {
          hostId: state.user.id,
          title,
          content
        }
      }
    });
    
    if (response.success) {
      // Update local state
      const noteIndex = state.notes.findIndex(n => n.id === state.currentNote.id);
      if (noteIndex !== -1) {
        state.notes[noteIndex] = { ...state.currentNote, title, content };
      }
      
      // Close editor and return to list
      closeNoteEditor();
      
      // Re-render notes list to show updated note
      renderAllNotes();
    } else {
      console.error('Error saving note:', response.error);
    }
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Set up file upload handlers
function setupFileUploadHandlers() {
  // Document upload
  const attachmentBtn = document.getElementById('attachment-btn');
  const fileInput = document.getElementById('file-input');
  
  attachmentBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileUpload);
  
  // Image upload
  const imageBtn = document.getElementById('image-btn');
  const imageInput = document.getElementById('image-input');
  
  imageBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
  
  // Audio recording
  const micBtn = document.getElementById('mic-btn');
  micBtn.addEventListener('click', handleAudioRecording);
  
  // Set up the same for the notepad tab
  const noteAttachmentBtn = document.getElementById('note-attachment-btn');
  noteAttachmentBtn.addEventListener('click', () => fileInput.click());
  
  const noteMicBtn = document.getElementById('note-mic-btn');
  noteMicBtn.addEventListener('click', handleAudioRecording);
  
  const noteImageBtn = document.getElementById('note-image-btn');
  noteImageBtn.addEventListener('click', () => imageInput.click());
}

// Handle file upload
async function handleFileUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  
  try {
    const file = event.target.files[0];
    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      alert(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    
    // Show uploading indicator
    const chatInput = document.getElementById('chat-input');
    chatInput.placeholder = 'Uploading document...';
    chatInput.disabled = true;
    
    // Create file form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Send file to API through background script
    const response = await chrome.runtime.sendMessage({
      type: 'UPLOAD_FILE',
      data: {
        endpoint: '/api/files/upload',
        file: file
      }
    });
    
    if (response.success) {
      // Create a user message about the file
      const fileMessage = {
        id: Date.now().toString(),
        content: `[Uploaded document: ${file.name}]`,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Add to messages array and render
      state.messages.push(fileMessage);
      renderChatMessage(fileMessage);
      
      // Create a new session if needed
      if (!state.currentSession) {
        await createNewChatSession();
      }
      
      // Send file to AI for analysis
      const aiResponse = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/ai-chat/analyze-file',
          method: 'POST',
          data: {
            fileId: response.data.id,
            sessionId: state.currentSession.id
          }
        }
      });
      
      if (aiResponse.success) {
        // Create AI response message
        const aiMessage = {
          id: Date.now().toString(),
          content: aiResponse.data.content || aiResponse.data.message,
          sender: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        // Add to messages array
        state.messages.push(aiMessage);
        
        // Render message
        renderChatMessage(aiMessage);
      }
    } else {
      alert('Error uploading file: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Error uploading file. Please try again.');
  } finally {
    // Reset the input
    event.target.value = '';
    
    // Reset chat input
    const chatInput = document.getElementById('chat-input');
    chatInput.placeholder = 'Ask Vyna anything...';
    chatInput.disabled = false;
  }
}

// Handle image upload
async function handleImageUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  
  try {
    const file = event.target.files[0];
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      alert(`Image too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    
    // Show uploading indicator
    const chatInput = document.getElementById('chat-input');
    chatInput.placeholder = 'Uploading image...';
    chatInput.disabled = true;
    
    // Send image to API through background script
    const response = await chrome.runtime.sendMessage({
      type: 'UPLOAD_FILE',
      data: {
        endpoint: '/api/files/upload',
        file: file
      }
    });
    
    if (response.success) {
      // Create a session if needed
      if (!state.currentSession) {
        await createNewChatSession();
      }
      
      // Create a user message with the image
      const fileUrl = response.data.url || `/api/files/${response.data.id}`;
      const imageMessage = {
        id: Date.now().toString(),
        content: `<div class="message-image-container"><img src="${fileUrl}" alt="Uploaded image" class="message-image" /></div>`,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Add to messages array and render
      state.messages.push(imageMessage);
      renderChatMessage(imageMessage);
      
      // Send image to AI for analysis
      const aiResponse = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/ai-chat/analyze-image',
          method: 'POST',
          data: {
            fileId: response.data.id,
            sessionId: state.currentSession.id
          }
        }
      });
      
      if (aiResponse.success) {
        // Create AI response message
        const aiMessage = {
          id: Date.now().toString(),
          content: aiResponse.data.content || aiResponse.data.message,
          sender: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        // Add to messages array
        state.messages.push(aiMessage);
        
        // Render message
        renderChatMessage(aiMessage);
      }
    } else {
      alert('Error uploading image: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image. Please try again.');
  } finally {
    // Reset the input
    event.target.value = '';
    
    // Reset chat input
    const chatInput = document.getElementById('chat-input');
    chatInput.placeholder = 'Ask Vyna anything...';
    chatInput.disabled = false;
  }
}

// Handle audio recording
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingDuration = 0;
let recordingTab = null; // To track which tab is recording

async function handleAudioRecording(tabId = 'vynaai') {
  recordingTab = tabId;
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recordingDuration = 0;
    
    // Update UI to show recording status
    const micBtn = document.getElementById('mic-btn');
    const noteMicBtn = document.getElementById('note-mic-btn');
    
    if (recordingTab === 'vynaai') {
      micBtn.classList.add('recording');
      micBtn.innerHTML = `<span class="recording-dot"></span> 0:00`;
    } else {
      noteMicBtn.classList.add('recording');
      noteMicBtn.innerHTML = `<span class="recording-dot"></span> 0:00`;
    }
    
    // Start timer
    recordingTimer = setInterval(() => {
      recordingDuration += 1;
      const minutes = Math.floor(recordingDuration / 60);
      const seconds = recordingDuration % 60;
      const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (recordingTab === 'vynaai') {
        micBtn.innerHTML = `<span class="recording-dot"></span> ${timeDisplay}`;
      } else {
        noteMicBtn.innerHTML = `<span class="recording-dot"></span> ${timeDisplay}`;
      }
    }, 1000);
    
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });
    
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      console.log('Audio recording finished:', audioBlob.size, 'bytes');
      
      // Show uploading status
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.placeholder = 'Processing audio...';
        chatInput.disabled = true;
      }
      
      try {
        // Upload audio file
        const response = await chrome.runtime.sendMessage({
          type: 'UPLOAD_AUDIO',
          data: {
            endpoint: '/api/files/upload-audio',
            audioBlob
          }
        });
        
        if (response.success) {
          // Create a session if needed
          if (!state.currentSession && recordingTab === 'vynaai') {
            await createNewChatSession();
          }
          
          if (recordingTab === 'vynaai') {
            // Create user message about the audio
            const audioMessage = {
              id: Date.now().toString(),
              content: `[Audio recording: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}]`,
              sender: 'user',
              timestamp: new Date().toISOString()
            };
            
            // Add to messages and render
            state.messages.push(audioMessage);
            renderChatMessage(audioMessage);
            
            // Send to AI for transcription and analysis
            const aiResponse = await chrome.runtime.sendMessage({
              type: 'API_REQUEST',
              data: {
                endpoint: '/api/ai-chat/analyze-audio',
                method: 'POST',
                data: {
                  fileId: response.data.id,
                  sessionId: state.currentSession.id
                }
              }
            });
            
            if (aiResponse.success) {
              // Create AI response message
              const aiMessage = {
                id: Date.now().toString(),
                content: aiResponse.data.content || aiResponse.data.message,
                sender: 'assistant',
                timestamp: new Date().toISOString()
              };
              
              // Add to messages array
              state.messages.push(aiMessage);
              
              // Render message
              renderChatMessage(aiMessage);
            }
          } else {
            // Add audio content to note
            if (aiResponse.success && aiResponse.data.transcript) {
              const noteEditInput = document.getElementById('note-edit-input');
              if (noteEditInput) {
                noteEditInput.value = aiResponse.data.transcript;
                addNoteLineToEditor();
              } else {
                const noteInput = document.getElementById('note-input');
                if (noteInput) {
                  noteInput.value = aiResponse.data.transcript;
                  addNote();
                }
              }
            }
          }
        } else {
          alert('Error uploading audio: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error processing audio. Please try again.');
      } finally {
        // Reset chat input
        if (chatInput) {
          chatInput.placeholder = 'Ask Vyna anything...';
          chatInput.disabled = false;
        }
      }
    });
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Could not access microphone. Please check your permissions.');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    // Stop the recorder
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Stop the timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
    
    // Reset UI
    const micBtn = document.getElementById('mic-btn');
    const noteMicBtn = document.getElementById('note-mic-btn');
    
    if (recordingTab === 'vynaai') {
      micBtn.classList.remove('recording');
      micBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
    } else {
      noteMicBtn.classList.remove('recording');
      noteMicBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
    }
    
    recordingTab = null;
  }
}

// Utility function to clear an element
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Initialize DOM references
  app = document.getElementById('app');
  loginTemplate = document.getElementById('login-template');
  appTemplate = document.getElementById('app-template');
  messageTemplate = document.getElementById('message-template');
  noteItemTemplate = document.getElementById('note-item-template');
  noteTagTemplate = document.getElementById('note-tag-template');
  
  // Check if templates are loaded properly
  if (!app) {
    console.error('App container not found');
    return;
  }
  
  if (!loginTemplate || !appTemplate) {
    console.error('Templates not found. loginTemplate:', loginTemplate, 'appTemplate:', appTemplate);
    return;
  }
  
  // Initialize the main popup functionality
  initPopup();
});
