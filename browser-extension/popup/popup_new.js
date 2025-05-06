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
  searchQuery: '',
  commentaryStyle: null // 'play-by-play' or 'color' or null
};

// Audio recording variables
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingDuration = 0;
let recordingTab = null;

// DOM Elements will be initialized when document is loaded
let app;
let loginTemplate;
let appTemplate;
let messageTemplate;
let chatSessionTemplate;
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
    renderLogin(); // Fallback to login
  }
}

// Load user data including chat sessions and notes
async function loadUserData() {
  try {
    // Load AI chat sessions
    const chatSessionsResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat-sessions',
        method: 'GET'
      }
    });
    
    if (chatSessionsResponse.success) {
      state.chatSessions = chatSessionsResponse.data.map(session => ({
        id: session.id.toString(),
        title: session.title || 'Untitled Chat',
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
      
      renderChatSessions();
    }
    
    // Load notes
    const notesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'GET'
      }
    });
    
    if (notesResponse.success) {
      state.notes = notesResponse.data.map(note => ({
        id: note.id.toString(),
        title: note.title || 'Untitled Note',
        content: note.content || '',
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
      
      collectAllTags();
      renderNotes();
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
      
      // Clear message container
      const messagesContainer = document.getElementById('messages-container');
      messagesContainer.innerHTML = '';
      
      // Set title
      document.getElementById('current-chat-title').textContent = state.chatSessions.find(s => s.id === sessionId)?.title || 'Chat';
      
      // Render messages
      state.messages.forEach(message => renderChatMessage(message));
      
      // Set current session
      state.currentSession = sessionId;
      
      // Show conversation view
      document.getElementById('sessions-list-view').classList.add('hidden');
      document.getElementById('chat-conversation-view').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading chat session:', error);
    showErrorToast('Failed to load chat messages');
  }
}

// Create a new chat session
async function createNewChatSession() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat-sessions',
        method: 'POST',
        body: {
          title: 'New Chat'
        }
      }
    });
    
    if (response.success) {
      const newSession = {
        id: response.data.id.toString(),
        title: response.data.title,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
      
      state.chatSessions.unshift(newSession);
      state.currentSession = newSession.id;
      state.messages = [];
      
      // Set title
      document.getElementById('current-chat-title').textContent = 'New Chat';
      
      // Clear message container
      const messagesContainer = document.getElementById('messages-container');
      messagesContainer.innerHTML = '';
      
      // Show conversation view
      document.getElementById('sessions-list-view').classList.add('hidden');
      document.getElementById('chat-conversation-view').classList.remove('hidden');
      
      // Focus the input
      document.getElementById('chat-input').focus();
    }
  } catch (error) {
    console.error('Error creating new chat session:', error);
    showErrorToast('Failed to create a new chat');
  }
}

// Send a chat message
async function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  // If no message, or if we're in empty state and don't have a session yet
  if (!message) return;
  
  // Create a new session if needed
  if (!state.currentSession) {
    await createNewChatSession();
  }
  
  // Add commentary style if selected
  const commentaryParams = state.commentaryStyle ? `?style=${state.commentaryStyle}` : '';
  
  try {
    // Create a temporary message ID for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    
    // Clear input
    chatInput.value = '';
    autoResizeTextarea.call(chatInput);
    
    // Render user message immediately (optimistic UI)
    const userMessage = {
      id: tempId,
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    renderChatMessage(userMessage);
    
    // Send message to server
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/ai-chat-messages${commentaryParams}`,
        method: 'POST',
        body: {
          sessionId: state.currentSession,
          content: message,
          role: 'user'
        }
      }
    });
    
    if (response.success) {
      // Update the message with real ID
      const userMessageElement = document.querySelector(`[data-message-id="${tempId}"]`);
      if (userMessageElement) {
        userMessageElement.dataset.messageId = response.data.id.toString();
      }
      
      // Show typing indicator
      showTypingIndicator();
      
      // Get AI response
      const aiResponse = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: `/api/ai-chat/process${commentaryParams}`,
          method: 'POST',
          body: {
            sessionId: state.currentSession,
            message
          }
        }
      });
      
      // Hide typing indicator
      hideTypingIndicator();
      
      if (aiResponse.success) {
        // Render AI message
        const assistantMessage = {
          id: aiResponse.data.id.toString(),
          content: aiResponse.data.content,
          sender: 'assistant',
          timestamp: new Date().toISOString()
        };
        renderChatMessage(assistantMessage);
        
        // Update session title if it's still the default
        const currentSession = state.chatSessions.find(s => s.id === state.currentSession);
        if (currentSession && currentSession.title === 'New Chat') {
          const suggestedTitle = generateTitleFromMessage(message);
          
          // Update title in UI
          document.getElementById('current-chat-title').textContent = suggestedTitle;
          
          // Update title in state
          currentSession.title = suggestedTitle;
          
          // Update session title on server
          chrome.runtime.sendMessage({
            type: 'API_REQUEST',
            data: {
              endpoint: `/api/ai-chat-sessions/${state.currentSession}`,
              method: 'PATCH',
              body: {
                title: suggestedTitle
              }
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    hideTypingIndicator();
    showErrorToast('Failed to send message');
  }
}

// Generate a title from the first message
function generateTitleFromMessage(message) {
  if (!message) return 'New Chat';
  
  // Use first 3-5 words or 30 characters
  const words = message.split(' ');
  if (words.length <= 5) return message;
  
  const shortTitle = words.slice(0, 4).join(' ');
  return shortTitle.length > 30 ? shortTitle.substring(0, 30) + '...' : shortTitle + '...';
}

// Show typing indicator
function showTypingIndicator() {
  const messagesContainer = document.getElementById('messages-container');
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = `
    <div class="typing-indicator-bubble">
      <div class="typing-indicator-dot"></div>
      <div class="typing-indicator-dot"></div>
      <div class="typing-indicator-dot"></div>
    </div>
  `;
  messagesContainer.appendChild(typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
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
}

// Extract tags from a note
function extractNoteTags(note) {
  const content = note.content || '';
  const tagMatches = content.match(/#\w+/g) || [];
  return tagMatches.map(tag => tag.substring(1).toLowerCase());
}

/* DOM RENDERING FUNCTIONS */

// Render login screen
function renderLogin() {
  app.innerHTML = '';
  app.appendChild(loginTemplate.content.cloneNode(true));
  
  // Set up login form
  const loginForm = document.getElementById('login-form');
  const loginUsernameOrEmail = document.getElementById('usernameOrEmail');
  const loginPassword = document.getElementById('password');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate
    if (!loginUsernameOrEmail.value || !loginPassword.value) {
      displayAuthError('Please fill in all fields.');
      return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    const originalBtnHtml = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = `<svg class="button-icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 12a4 4 0 1 1-8 0"></path></svg><span>Signing in...</span>`;
    
    try {
      console.log('Sending login request');
      const response = await chrome.runtime.sendMessage({
        type: 'LOGIN',
        data: {
          usernameOrEmail: loginUsernameOrEmail.value.trim(),
          password: loginPassword.value,
        }
      });
      
      if (response.success) {
        state.isAuthenticated = true;
        state.user = response.user;
        renderApp();
        await loadUserData();
      } else {
        console.error('Login failed:', response.error);
        displayAuthError(response.error || 'Authentication failed. Please check your credentials.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnHtml;
      }
    } catch (error) {
      console.error('Login error:', error);
      displayAuthError('An unexpected error occurred. Please try again.');
      loginBtn.disabled = false;
      loginBtn.innerHTML = originalBtnHtml;
    }
  });
  
  // Set up register form
  const registerForm = document.getElementById('register-form');
  const registerUsername = document.getElementById('register-username');
  const registerEmail = document.getElementById('register-email');
  const registerPassword = document.getElementById('register-password');
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate
    if (!registerUsername.value || !registerEmail.value || !registerPassword.value) {
      displayAuthError('Please fill in all fields.');
      return;
    }
    
    // Show loading state
    const registerBtn = document.getElementById('register-btn');
    const originalBtnHtml = registerBtn.innerHTML;
    registerBtn.disabled = true;
    registerBtn.innerHTML = `<svg class="button-icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 12a4 4 0 1 1-8 0"></path></svg><span>Creating account...</span>`;
    
    try {
      console.log('Sending register request');
      const response = await chrome.runtime.sendMessage({
        type: 'REGISTER',
        data: {
          username: registerUsername.value.trim(),
          email: registerEmail.value.trim(),
          password: registerPassword.value,
        }
      });
      
      if (response.success) {
        state.isAuthenticated = true;
        state.user = response.user;
        renderApp();
        await loadUserData();
      } else {
        console.error('Registration failed:', response.error);
        displayAuthError(response.error || 'Registration failed. Please try a different username or email.');
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalBtnHtml;
      }
    } catch (error) {
      console.error('Registration error:', error);
      displayAuthError('An unexpected error occurred. Please try again.');
      registerBtn.disabled = false;
      registerBtn.innerHTML = originalBtnHtml;
    }
  });
  
  // Set up tab switching
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // Get tab target
      const targetTab = trigger.dataset.tab;
      
      // Toggle active state on triggers
      tabTriggers.forEach(t => t.classList.remove('active'));
      trigger.classList.add('active');
      
      // Toggle visible content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // Clear error message
      hideAuthError();
    });
  });
}

// Render main app UI
function renderApp() {
  app.innerHTML = '';
  app.appendChild(appTemplate.content.cloneNode(true));
  
  // Setup user profile info
  const userDisplayName = document.getElementById('user-display-name');
  const userAvatarImg = document.getElementById('user-avatar-img');
  
  if (state.user) {
    userDisplayName.textContent = state.user.displayName || state.user.username;
    // If user has avatar, use it
    if (state.user.avatarUrl) {
      userAvatarImg.src = state.user.avatarUrl;
    }
  }
  
  // Setup logout on user profile click
  const userProfile = document.getElementById('user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({ type: 'LOGOUT' });
        state.isAuthenticated = false;
        state.user = null;
        renderLogin();
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
  
  // Get elements to set up handlers
  const navTabs = document.querySelectorAll('.nav-tab');
  
  // Handle tab switching
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update state
      state.currentTab = tabName;
      
      // Update active tab visual
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tabName}-content`).classList.add('active');
    });
  });
  
  // Set up chat sessions list
  const sessionsListView = document.getElementById('sessions-list-view');
  const chatSessionsList = document.getElementById('chat-sessions-list');
  const newChatButton = document.getElementById('new-chat-button');
  
  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      // Create a new chat session and show chat view
      createNewChatSession();
    });
  }
  
  // Set up chat conversation functionality
  const chatConversationView = document.getElementById('chat-conversation-view');
  const backToSessionsButton = document.getElementById('back-to-sessions-button');
  const chatInput = document.getElementById('chat-input');
  
  if (backToSessionsButton) {
    backToSessionsButton.addEventListener('click', () => {
      // Show sessions list view, hide conversation view
      sessionsListView.classList.remove('hidden');
      chatConversationView.classList.add('hidden');
    });
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
    
    chatInput.addEventListener('input', autoResizeTextarea);
  }
  
  // Handle empty state view - allow clicking anywhere to focus on input
  const chatEmptyState = document.getElementById('chat-empty-state');
  if (chatEmptyState) {
    chatEmptyState.addEventListener('click', () => {
      if (chatInput) {
        chatInput.focus();
      }
    });
  }
  
  // Set up commentary style chips
  const ppChip = document.querySelector('.pp-chip');
  const ccChip = document.querySelector('.cc-chip');
  
  if (ppChip && ccChip) {
    ppChip.addEventListener('click', () => {
      ppChip.classList.toggle('selected');
      if (ppChip.classList.contains('selected')) {
        ccChip.classList.remove('selected');
        state.commentaryStyle = 'play-by-play';
      } else {
        state.commentaryStyle = null;
      }
    });
    
    ccChip.addEventListener('click', () => {
      ccChip.classList.toggle('selected');
      if (ccChip.classList.contains('selected')) {
        ppChip.classList.remove('selected');
        state.commentaryStyle = 'color';
      } else {
        state.commentaryStyle = null;
      }
    });
  }
  
  // Set up file upload
  const fileInput = document.getElementById('file-input');
  const attachmentBtn = document.getElementById('attachment-btn');
  if (fileInput && attachmentBtn) {
    attachmentBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
  }
  
  // Set up image upload
  const imageInput = document.getElementById('image-input');
  const imageBtn = document.getElementById('image-btn');
  if (imageInput && imageBtn) {
    imageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
  }
  
  // Set up audio recording
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) {
    micBtn.addEventListener('click', toggleAudioRecording);
  }
  
  // Set up notes functionality
  const notesListView = document.getElementById('notes-list-view');
  const notesList = document.getElementById('notes-list');
  const newNoteButton = document.getElementById('new-note-button');
  const notesSearch = document.getElementById('notes-search');
  
  if (newNoteButton) {
    newNoteButton.addEventListener('click', () => {
      // Create a new note and show editor
      createNewNote();
    });
  }
  
  if (notesSearch) {
    notesSearch.addEventListener('input', debounce(handleNoteSearch, 300));
  }
}

// Render chat sessions
function renderChatSessions() {
  const chatSessionsList = document.getElementById('chat-sessions-list');
  if (!chatSessionsList) return;
  
  chatSessionsList.innerHTML = '';
  
  if (state.chatSessions.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-sessions';
    emptyState.innerHTML = `
      <p>Your conversations will appear here.</p>
    `;
    chatSessionsList.appendChild(emptyState);
    return;
  }
  
  state.chatSessions.forEach(session => {
    const sessionElement = chatSessionTemplate.content.cloneNode(true);
    const sessionItem = sessionElement.querySelector('.chat-session-item');
    const titleElement = sessionElement.querySelector('.chat-session-title');
    
    sessionItem.dataset.sessionId = session.id;
    titleElement.textContent = session.title;
    
    // Add click handler to open chat
    sessionItem.addEventListener('click', () => {
      loadChatSession(session.id);
    });
    
    chatSessionsList.appendChild(sessionElement);
  });
}

// Render chat message
function renderChatMessage(message) {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;
  
  // Hide empty state if present
  const emptyState = document.getElementById('chat-empty-state');
  if (emptyState) {
    emptyState.classList.add('hidden');
  }
  
  // Clone the message template
  const messageTemplate = document.getElementById('message-template');
  const messageElement = messageTemplate.content.cloneNode(true);
  
  // Get the message container and set classes
  const messageContainer = messageElement.querySelector('.message');
  messageContainer.classList.add(message.sender === 'user' ? 'user-message' : 'assistant-message');
  messageContainer.dataset.messageId = message.id;
  
  // Set avatar image based on sender
  const avatarImg = messageElement.querySelector('.message-avatar img');
  if (message.sender === 'user') {
    // Use user avatar
    if (state.user && state.user.avatarUrl) {
      avatarImg.src = state.user.avatarUrl;
    } else {
      // Use default avatar for user
      avatarImg.src = '../assets/default-avatar.png';
    }
  } else {
    // Use AI avatar
    avatarImg.src = '../assets/ai-avatar.png';
  }
  
  // Set message content
  const messageContent = messageElement.querySelector('.message-content');
  messageContent.innerHTML = formatMessageContent(message.content);
  
  // Show/hide action buttons based on sender
  const messageActions = messageElement.querySelector('.message-actions');
  if (message.sender === 'user') {
    messageActions.remove(); // No action buttons for user messages
  }
  
  // Add to container
  messagesContainer.appendChild(messageElement);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format message content (simple markdown support)
function formatMessageContent(content) {
  if (!content) return '';
  
  // Escape HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Format code blocks
  formatted = formatted.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Format inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Format bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Format italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Convert URLs to links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// Render notes
function renderNotes(searchQuery = '') {
  const notesList = document.getElementById('notes-list');
  if (!notesList) return;
  
  notesList.innerHTML = '';
  
  if (state.notes.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-notes';
    emptyState.innerHTML = `
      <p>Your notes will appear here.</p>
    `;
    notesList.appendChild(emptyState);
    return;
  }
  
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
    // Render filtered notes
    filteredNotes.forEach(note => {
      const noteElement = noteItemTemplate.content.cloneNode(true);
      const noteItem = noteElement.querySelector('.note-item');
      const titleElement = noteElement.querySelector('.note-item-title');
      const previewElement = noteElement.querySelector('.note-item-preview');
      
      noteItem.dataset.noteId = note.id;
      titleElement.textContent = note.title;
      
      // Generate preview (first 100 characters)
      const preview = note.content.length > 100
        ? note.content.substring(0, 100) + '...'
        : note.content;
      previewElement.textContent = preview;
      
      // Add click handler to open note
      noteItem.addEventListener('click', () => {
        loadNote(note.id);
      });
      
      notesList.appendChild(noteElement);
    });
  }
}

/* HELPER FUNCTIONS */

// Display authentication error
function displayAuthError(message) {
  const errorElement = document.getElementById('auth-error');
  const errorMessageElement = document.getElementById('error-message');
  
  if (errorElement && errorMessageElement) {
    errorMessageElement.textContent = message;
    errorElement.style.display = 'flex';
  }
}

// Hide authentication error
function hideAuthError() {
  const errorElement = document.getElementById('auth-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// Show error toast notification
function showErrorToast(message) {
  // Check if toast container exists
  let toastContainer = document.querySelector('.toast-container');
  
  // Create toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast error';
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>${message}</span>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('fadeout');
    setTimeout(() => {
      toast.remove();
      
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 3000);
}

// Auto-resize textarea as user types
function autoResizeTextarea() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
}

// Handle note search
function handleNoteSearch(e) {
  state.searchQuery = e.target.value.trim();
  renderNotes(state.searchQuery);
}

// Debounce function for input handlers
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// File upload handler
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // For now, just display file name in input
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value += ` [File: ${file.name}]`;
    autoResizeTextarea.call(chatInput);
  }
  
  // Reset file input
  e.target.value = '';
}

// Image upload handler
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // For now, just display image name in input
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value += ` [Image: ${file.name}]`;
    autoResizeTextarea.call(chatInput);
  }
  
  // Reset file input
  e.target.value = '';
}

// Audio recording handler
function toggleAudioRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Start audio recording
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data.size > 0) {
        audioChunks.push(e.data);
      }
    });
    
    mediaRecorder.addEventListener('stop', () => {
      processAudioRecording();
      clearInterval(recordingTimer);
      recordingDuration = 0;
    });
    
    // Update UI
    isRecording = true;
    recordingTab = state.currentTab;
    
    // Update recording button
    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
      micBtn.classList.add('recording');
    }
    
    // Start recording
    mediaRecorder.start();
    
    // Start timer
    recordingTimer = setInterval(() => {
      recordingDuration += 1;
      updateRecordingIndicator();
    }, 1000);
  } catch (error) {
    console.error('Error starting recording:', error);
    showErrorToast('Microphone access is required to record audio');
  }
}

// Stop audio recording
function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach(track => track.stop());
  
  // Update UI
  isRecording = false;
  
  // Update recording button
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) {
    micBtn.classList.remove('recording');
  }
}

// Update recording indicator
function updateRecordingIndicator() {
  // Format duration
  const minutes = Math.floor(recordingDuration / 60);
  const seconds = recordingDuration % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // For now, just update button title
  const micBtn = document.getElementById(`${recordingTab === 'notepad' ? 'note-' : ''}mic-btn`);
  if (micBtn) {
    micBtn.title = `Recording: ${formattedTime}`;
  }
}

// Process recorded audio
function processAudioRecording() {
  // For now, just mention the recording in the input
  const isNotepad = recordingTab === 'notepad';
  const inputElement = document.getElementById(isNotepad ? 'note-input' : 'chat-input');
  
  if (inputElement) {
    inputElement.value += ' [Audio Recording]';
    autoResizeTextarea.call(inputElement);
  }
}

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get main container
  app = document.getElementById('app');
  
  // Get templates
  loginTemplate = document.getElementById('login-template');
  appTemplate = document.getElementById('app-template');
  messageTemplate = document.getElementById('message-template');
  chatSessionTemplate = document.getElementById('chat-session-template');
  noteItemTemplate = document.getElementById('note-item-template');
  noteTagTemplate = document.getElementById('note-tag-template');
  
  // Initialize popup
  initPopup();
});