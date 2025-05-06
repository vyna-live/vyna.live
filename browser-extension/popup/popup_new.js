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
  commentaryStyle: null, // 'play-by-play' or 'color' or null
  hasLoadedDemoNotes: false
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
    console.log('Creating new chat session...');
    
    // Get the user's ID
    const userId = state.user?.id;
    if (!userId) {
      console.error('User ID not found, cannot create chat session');
      showErrorToast('Please log in to create a new chat');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat-sessions',
        method: 'POST',
        data: {
          title: 'New Chat',
          hostId: userId
        }
      }
    });
    
    console.log('Create chat session response:', response);
    
    if (response.success) {
      const newSession = {
        id: response.data.id.toString(),
        title: response.data.title || 'New Chat',
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
      
      console.log('Created new session:', newSession);
      
      // Add to the beginning of sessions list
      state.chatSessions.unshift(newSession);
      state.currentSession = newSession.id;
      state.messages = [];
      
      // Set title
      const titleElement = document.getElementById('current-chat-title');
      if (titleElement) {
        titleElement.textContent = 'New Chat';
      }
      
      // Clear message container
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
      
      // Show conversation view
      const sessionsListView = document.getElementById('sessions-list-view');
      const chatConversationView = document.getElementById('chat-conversation-view');
      
      if (sessionsListView && chatConversationView) {
        sessionsListView.classList.add('hidden');
        chatConversationView.classList.remove('hidden');
        
        // Focus the input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.focus();
        }
      } else {
        console.error('Required view elements not found');
      }
      
      // Show success toast
      showSuccessToast('New chat created');
    } else {
      console.error('API returned success: false when creating chat session');
      showErrorToast(response.error || 'Failed to create a new chat');
    }
  } catch (error) {
    console.error('Error creating new chat session:', error);
    showErrorToast('Failed to create a new chat: ' + (error.message || 'Unknown error'));
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
        data: {
          sessionId: state.currentSession,
          content: message,
          role: 'user',
          hostId: state.user?.id
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
          data: {
            sessionId: state.currentSession,
            message,
            hostId: state.user?.id
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
              data: {
                title: suggestedTitle,
                hostId: state.user?.id
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
    if (tab.classList.contains('back-btn')) {
      // Handle back button
      tab.addEventListener('click', () => {
        // Go back to main view (equivalent to clicking home)
        window.close(); // Simple approach to "go back" - just close the popup
      });
    } else if (tab.dataset.tab) {
      // Handle main tabs
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update state
        state.currentTab = tabName;
        
        // Update active tab visual
        document.querySelectorAll('.nav-tab').forEach(t => {
          if (t.dataset.tab) t.classList.remove('active');
        });
        
        tab.classList.add('active');
        
        // Hide all and show the selected tab
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`${tabName}-content`).classList.remove('hidden');
      });
    }
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
  
  // Set up file upload for chat
  const chatFileInput = document.getElementById('file-input');
  const chatAttachmentBtn = document.getElementById('attachment-btn');
  if (chatFileInput && chatAttachmentBtn) {
    chatAttachmentBtn.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', handleFileUpload);
  }
  
  // Set up image upload for chat
  const chatImageInput = document.getElementById('image-input');
  const chatImageBtn = document.getElementById('image-btn');
  if (chatImageInput && chatImageBtn) {
    chatImageBtn.addEventListener('click', () => chatImageInput.click());
    chatImageInput.addEventListener('change', handleImageUpload);
  }
  
  // Set up audio recording for chat
  const chatMicBtn = document.getElementById('mic-btn');
  if (chatMicBtn) {
    chatMicBtn.addEventListener('click', toggleAudioRecording);
  }
  
  // Set up notes functionality
  const notesListView = document.getElementById('notes-list-view');
  const notesList = document.getElementById('notes-list');
  const notepadInput = document.getElementById('notepad-input');
  const addNoteButton = document.getElementById('add-note-button');
  const noteTextarea = document.getElementById('note-editor-textarea');
  
  // Handle the quick add note button
  if (addNoteButton) {
    addNoteButton.addEventListener('click', () => {
      addQuickNote();
    });
  }
  
  // Handle notepad input enter key press
  if (notepadInput) {
    notepadInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addQuickNote();
      }
    });
    
    // Focus on notepad input when typing
    notepadInput.addEventListener('focus', () => {
      // If there's text, show the add note button
      if (notepadInput.value.trim()) {
        addNoteButton.style.display = 'block';
      }
    });
    
    // Show/hide add note button based on input content
    notepadInput.addEventListener('input', () => {
      if (notepadInput.value.trim()) {
        addNoteButton.style.display = 'block';
      } else {
        addNoteButton.style.display = 'none';
      }
    });
  }
  
  // Set up new note button
  const newNoteButton = document.getElementById('new-note-button');
  if (newNoteButton) {
    newNoteButton.addEventListener('click', () => {
      createNewNote();
    });
  }
  
  // Set up attachment, mic, and image buttons for notepad
  const notepadAttachmentBtn = document.getElementById('attachment-btn');
  const notepadMicBtn = document.getElementById('mic-btn');
  const notepadImageBtn = document.getElementById('image-btn');
  
  if (notepadAttachmentBtn) {
    notepadAttachmentBtn.addEventListener('click', () => {
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.click();
    });
  }
  
  if (notepadMicBtn) {
    notepadMicBtn.addEventListener('click', () => {
      toggleAudioRecording();
      recordingTab = 'notepad';
    });
  }
  
  if (notepadImageBtn) {
    notepadImageBtn.addEventListener('click', () => {
      const imageInput = document.getElementById('image-input');
      if (imageInput) imageInput.click();
    });
  }
  
  // Set up note textarea auto-resize
  if (noteTextarea) {
    noteTextarea.addEventListener('input', autoResizeTextarea);
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
    // Add sample notes for demo if we need to populate the UI for testing
    // This would be replaced with actual notes from server
    if (filteredNotes.length === 0 && !state.hasLoadedDemoNotes) {
      // Create some sample notes for demonstration (only if user has no notes)
      for (let i = 0; i < 6; i++) {
        filteredNotes.push({
          id: `demo-${i}`,
          title: "Who is the best CODM gamer in Nigeria as of March 2025?",
          content: "I don't have information about who was the best Call of Duty Mobile player in Nigeria as of March 2025, as my knowledge cutoff is before that date.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      state.hasLoadedDemoNotes = true;
    }
    
    // Render filtered notes
    filteredNotes.forEach(note => {
      const noteElement = noteItemTemplate.content.cloneNode(true);
      const noteItem = noteElement.querySelector('.note-item');
      const titleElement = noteElement.querySelector('.note-item-title');
      const previewElement = noteElement.querySelector('.note-item-preview');
      const optionsButton = noteElement.querySelector('.note-options-button');
      
      noteItem.dataset.noteId = note.id;
      titleElement.textContent = note.title;
      
      // Generate preview (first 100 characters)
      const preview = note.content.length > 100
        ? note.content.substring(0, 100) + '...'
        : note.content;
      previewElement.textContent = preview;
      
      // Add click handler to open note
      noteItem.addEventListener('click', (e) => {
        if (e.target !== optionsButton && !optionsButton.contains(e.target)) {
          loadNote(note.id);
        }
      });
      
      // Add click handler to options button (three dots menu)
      optionsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Create and show options menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'note-options-menu';
        optionsMenu.innerHTML = `
          <div class="note-option" data-action="edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit</span>
          </div>
          <div class="note-option" data-action="delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </div>
        `;
        
        // Position the menu
        const rect = optionsButton.getBoundingClientRect();
        optionsMenu.style.top = `${rect.bottom + 5}px`;
        optionsMenu.style.right = `${window.innerWidth - rect.right}px`;
        
        // Add to DOM
        document.body.appendChild(optionsMenu);
        
        // Add click handlers to menu options
        optionsMenu.querySelector('[data-action="edit"]').addEventListener('click', () => {
          loadNote(note.id);
          document.body.removeChild(optionsMenu);
        });
        
        optionsMenu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
            try {
              // Send delete request to API
              const response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: `/api/notepads/${note.id}`,
                  method: 'DELETE'
                }
              });
              
              if (response.success) {
                // Remove from state
                state.notes = state.notes.filter(n => n.id !== note.id);
                // Re-render notes
                renderNotes();
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              showErrorToast('Failed to delete note');
            }
          }
          document.body.removeChild(optionsMenu);
        });
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
          if (!optionsMenu.contains(e.target) && e.target !== optionsButton) {
            document.body.removeChild(optionsMenu);
            document.removeEventListener('click', closeMenu);
          }
        };
        
        // Add delay to prevent immediate closing
        setTimeout(() => {
          document.addEventListener('click', closeMenu);
        }, 100);
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

// Show success toast notification
function showSuccessToast(message) {
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
  toast.className = 'toast success';
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
  const inputElement = document.getElementById(isNotepad ? 'note-editor-textarea' : 'chat-input');
  
  if (inputElement) {
    inputElement.value += ' [Audio Recording]';
    autoResizeTextarea.call(inputElement);
  }
}

// Add a quick note from input field
async function addQuickNote() {
  try {
    const noteInput = document.getElementById('notepad-input');
    if (!noteInput || !noteInput.value.trim()) {
      return;
    }
    
    const noteContent = noteInput.value.trim();
    
    // Create a temporary title based on content (first 30 chars)
    const title = noteContent.length > 30 
      ? noteContent.substring(0, 30) + '...'
      : noteContent;
    
    // Create the note data
    const noteData = {
      title: title,
      content: noteContent
    };
    
    // Send request to create note
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/notepads',
          method: 'POST',
          body: noteData
        }
      });
      
      if (response.success) {
        // Add to the state
        state.notes.unshift(response.data);
        
        // Clear input
        noteInput.value = '';
        
        // Re-render notes
        renderNotes();
      }
    } catch (error) {
      console.error('Error adding quick note:', error);
      showErrorToast('Failed to add note');
    }
  } catch (error) {
    console.error('Error in add quick note:', error);
    showErrorToast('Failed to add note');
  }
}

// Create a new note and open the full editor
async function createNewNote() {
  try {
    // Get input from notepad input if any
    const noteInput = document.getElementById('notepad-input');
    const initialContent = noteInput ? noteInput.value.trim() : '';
    
    // Create a temporary note for optimistic UI
    const tempNote = {
      id: `temp-${Date.now()}`,
      title: 'About solana',
      content: initialContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to state for UI rendering
    state.currentNote = tempNote;
    
    // Show note editor view
    const notesListView = document.getElementById('notes-list-view');
    const noteEditorView = document.getElementById('note-editor-view');
    
    if (notesListView && noteEditorView) {
      notesListView.classList.add('hidden');
      noteEditorView.classList.remove('hidden');
      
      // Set up title display
      const titleDisplay = document.getElementById('note-title-display');
      if (titleDisplay) {
        titleDisplay.textContent = tempNote.title;
      }
      
      // Set up editor content
      const contentTextarea = document.getElementById('note-editor-textarea');
      if (contentTextarea) {
        contentTextarea.value = initialContent;
        
        // Focus and place cursor at end
        contentTextarea.focus();
        contentTextarea.selectionStart = contentTextarea.value.length;
        contentTextarea.selectionEnd = contentTextarea.value.length;
        
        // Resize the textarea
        autoResizeTextarea.call(contentTextarea);
      }
      
      // Set up back button
      const backButton = document.getElementById('back-to-notes-button');
      if (backButton) {
        backButton.onclick = () => {
          // If input had content, clear it
          if (noteInput && initialContent) {
            noteInput.value = '';
          }
          
          notesListView.classList.remove('hidden');
          noteEditorView.classList.add('hidden');
        };
      }
      
      // Set up teleprompt button
      const telepromptButton = document.getElementById('teleprompt-button');
      if (telepromptButton) {
        telepromptButton.onclick = async () => {
          // Save note and send to teleprompt
          try {
            if (!contentTextarea.value.trim()) {
              contentTextarea.focus();
              return;
            }
            
            const noteData = {
              title: tempNote.title,
              content: contentTextarea.value.trim()
            };
            
            let response;
            
            if (state.currentNote.id.startsWith('temp-')) {
              // Create new note
              response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: '/api/notepads',
                  method: 'POST',
                  body: noteData
                }
              });
            } else {
              // Update existing note
              response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: `/api/notepads/${state.currentNote.id}`,
                  method: 'PATCH',
                  body: noteData
                }
              });
            }
            
            if (response.success) {
              // Show success message
              showSuccessToast('Note sent to teleprompt');
              
              // Update note in state
              const noteIndex = state.notes.findIndex(n => n.id === state.currentNote.id);
              
              if (noteIndex >= 0) {
                state.notes[noteIndex] = response.data;
              } else {
                state.notes.unshift(response.data);
              }
              
              // Reset current note and go back to list
              state.currentNote = null;
              notesListView.classList.remove('hidden');
              noteEditorView.classList.add('hidden');
              
              // Re-render notes
              renderNotes();
            }
          } catch (error) {
            console.error('Error sending to teleprompt:', error);
            showErrorToast('Failed to send to teleprompt');
          }
        };
      }
      
      // Set up more options button
      const moreOptionsButton = document.getElementById('more-options-button');
      if (moreOptionsButton) {
        moreOptionsButton.onclick = (e) => {
          // Create and show options menu
          const optionsMenu = document.createElement('div');
          optionsMenu.className = 'note-options-menu';
          optionsMenu.innerHTML = `
            <div class="note-option" data-action="save">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Save</span>
            </div>
            <div class="note-option" data-action="delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </div>
          `;
          
          // Position the menu
          const rect = moreOptionsButton.getBoundingClientRect();
          optionsMenu.style.top = `${rect.bottom + 5}px`;
          optionsMenu.style.right = `${window.innerWidth - rect.right}px`;
          
          // Add to DOM
          document.body.appendChild(optionsMenu);
          
          // Add click handlers
          optionsMenu.querySelector('[data-action="save"]').addEventListener('click', async () => {
            // Save the note
            try {
              if (!contentTextarea.value.trim()) {
                contentTextarea.focus();
                return;
              }
              
              const noteData = {
                title: tempNote.title,
                content: contentTextarea.value.trim()
              };
              
              let response;
              
              if (state.currentNote.id.startsWith('temp-')) {
                // Create new note
                response = await chrome.runtime.sendMessage({
                  type: 'API_REQUEST',
                  data: {
                    endpoint: '/api/notepads',
                    method: 'POST',
                    body: noteData
                  }
                });
              } else {
                // Update existing note
                response = await chrome.runtime.sendMessage({
                  type: 'API_REQUEST',
                  data: {
                    endpoint: `/api/notepads/${state.currentNote.id}`,
                    method: 'PATCH',
                    body: noteData
                  }
                });
              }
              
              if (response.success) {
                // Show success message
                showSuccessToast('Note saved');
                
                // Update note in state
                const noteIndex = state.notes.findIndex(n => n.id === state.currentNote.id);
                
                if (noteIndex >= 0) {
                  state.notes[noteIndex] = response.data;
                } else {
                  state.notes.unshift(response.data);
                }
                
                // Update current note
                state.currentNote = response.data;
              }
            } catch (error) {
              console.error('Error saving note:', error);
              showErrorToast('Failed to save note');
            }
            
            document.body.removeChild(optionsMenu);
          });
          
          optionsMenu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete this note?`)) {
              try {
                // Only try to delete from server if it's not a temporary note
                if (!state.currentNote.id.startsWith('temp-')) {
                  const response = await chrome.runtime.sendMessage({
                    type: 'API_REQUEST',
                    data: {
                      endpoint: `/api/notepads/${state.currentNote.id}`,
                      method: 'DELETE'
                    }
                  });
                  
                  if (!response.success) {
                    throw new Error('Failed to delete note');
                  }
                }
                
                // Remove from state
                state.notes = state.notes.filter(n => n.id !== state.currentNote.id);
                
                // Reset current note
                state.currentNote = null;
                
                // Go back to list view
                notesListView.classList.remove('hidden');
                noteEditorView.classList.add('hidden');
                
                // Re-render notes
                renderNotes();
              } catch (error) {
                console.error('Error deleting note:', error);
                showErrorToast('Failed to delete note');
              }
            }
            
            document.body.removeChild(optionsMenu);
          });
          
          // Close menu when clicking outside
          const closeMenu = (event) => {
            if (!optionsMenu.contains(event.target) && event.target !== moreOptionsButton) {
              document.body.removeChild(optionsMenu);
              document.removeEventListener('click', closeMenu);
            }
          };
          
          // Add delay to prevent immediate closing
          setTimeout(() => {
            document.addEventListener('click', closeMenu);
          }, 100);
        };
      }
    }
  } catch (error) {
    console.error('Error creating new note:', error);
    showErrorToast('Failed to create a new note');
  }
}

// Create a new note
async function createNewNote() {
  try {
    console.log('Creating new note...');
    
    // Get the user's ID
    const userId = state.user?.id;
    if (!userId) {
      console.error('User ID not found, cannot create note');
      showErrorToast('Please log in to create a new note');
      return;
    }
    
    // Create a temporary note
    const tempNote = {
      id: `temp-${Date.now()}`,
      title: 'New Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Set as current note
    state.currentNote = tempNote;
    
    // Show note editor view
    const notesListView = document.getElementById('notes-list-view');
    const noteEditorView = document.getElementById('note-editor-view');
    
    if (notesListView && noteEditorView) {
      notesListView.classList.add('hidden');
      noteEditorView.classList.remove('hidden');
      
      // Set up title display
      const titleDisplay = document.getElementById('note-title-display');
      if (titleDisplay) {
        titleDisplay.textContent = tempNote.title;
      }
      
      // Set up editor content
      const contentTextarea = document.getElementById('note-editor-textarea');
      if (contentTextarea) {
        contentTextarea.value = tempNote.content;
        
        // Focus the textarea for immediate typing
        contentTextarea.focus();
      }
      
      // Set up back button with save functionality
      const backButton = document.getElementById('back-to-notes-button');
      if (backButton) {
        backButton.onclick = async () => {
          // Save note to server if content exists
          const content = contentTextarea.value.trim();
          if (content) {
            try {
              const response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: '/api/notepads',
                  method: 'POST',
                  data: {
                    title: 'New Note', // This will be improved later
                    content: content,
                    hostId: userId
                  }
                }
              });
              
              if (response.success) {
                // Add to notes list
                const newNote = {
                  id: response.data.id.toString(),
                  title: response.data.title || generateTitleFromContent(content),
                  content: content,
                  createdAt: new Date(response.data.createdAt),
                  updatedAt: new Date(response.data.updatedAt)
                };
                
                state.notes.unshift(newNote);
                showSuccessToast('Note saved');
              }
            } catch (error) {
              console.error('Error saving new note:', error);
              showErrorToast('Failed to save note');
            }
          }
          
          // Return to notes list view
          notesListView.classList.remove('hidden');
          noteEditorView.classList.add('hidden');
          
          // Update notes display
          renderNotes();
        };
      }
    }
  } catch (error) {
    console.error('Error creating new note:', error);
    showErrorToast('Failed to create new note');
  }
}

// Generate a title from note content
function generateTitleFromContent(content) {
  if (!content) return 'New Note';
  
  // Use first 3-5 words or 30 characters
  const words = content.split(' ');
  if (words.length <= 5) return content;
  
  const shortTitle = words.slice(0, 4).join(' ');
  return shortTitle.length > 30 ? shortTitle.substring(0, 30) + '...' : shortTitle + '...';
}

// Load a note for editing
async function loadNote(noteId) {
  try {
    // Find note in state
    const note = state.notes.find(n => n.id === noteId);
    
    if (!note) {
      console.error('Note not found:', noteId);
      showErrorToast('Note not found');
      return;
    }
    
    // Set current note
    state.currentNote = note;
    
    // Show note editor view
    const notesListView = document.getElementById('notes-list-view');
    const noteEditorView = document.getElementById('note-editor-view');
    
    if (notesListView && noteEditorView) {
      notesListView.classList.add('hidden');
      noteEditorView.classList.remove('hidden');
      
      // Set up title display
      const titleDisplay = document.getElementById('note-title-display');
      if (titleDisplay) {
        titleDisplay.textContent = note.title || '';
      }
      
      // Set up editor content
      const contentTextarea = document.getElementById('note-editor-textarea');
      if (contentTextarea) {
        contentTextarea.value = note.content || '';
        
        // Resize the textarea
        autoResizeTextarea.call(contentTextarea);
      }
      
      // Set up back button
      const backButton = document.getElementById('back-to-notes-button');
      if (backButton) {
        backButton.onclick = () => {
          notesListView.classList.remove('hidden');
          noteEditorView.classList.add('hidden');
        };
      }
      
      // Set up teleprompt button
      const telepromptButton = document.getElementById('teleprompt-button');
      if (telepromptButton) {
        telepromptButton.onclick = async () => {
          try {
            // Show success message - in a real implementation this would send to the teleprompter
            showSuccessToast('Note sent to teleprompt');
            
            // Go back to list view
            notesListView.classList.remove('hidden');
            noteEditorView.classList.add('hidden');
          } catch (error) {
            console.error('Error sending to teleprompt:', error);
            showErrorToast('Failed to send to teleprompt');
          }
        };
      }
      
      // Set up more options button - this is set up with the same handler as in createNewNote
      const moreOptionsButton = document.getElementById('more-options-button');
      if (moreOptionsButton) {
        moreOptionsButton.onclick = (e) => {
          // Create and show options menu
          const optionsMenu = document.createElement('div');
          optionsMenu.className = 'note-options-menu';
          optionsMenu.innerHTML = `
            <div class="note-option" data-action="save">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Save</span>
            </div>
            <div class="note-option" data-action="delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </div>
          `;
          
          // Position the menu
          const rect = moreOptionsButton.getBoundingClientRect();
          optionsMenu.style.top = `${rect.bottom + 5}px`;
          optionsMenu.style.right = `${window.innerWidth - rect.right}px`;
          
          // Add to DOM
          document.body.appendChild(optionsMenu);
          
          // Add click handlers
          optionsMenu.querySelector('[data-action="save"]').addEventListener('click', async () => {
            // Save the note
            try {
              if (!contentTextarea.value.trim()) {
                contentTextarea.focus();
                return;
              }
              
              const noteData = {
                title: note.title,
                content: contentTextarea.value.trim()
              };
              
              const response = await chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                data: {
                  endpoint: `/api/notepads/${state.currentNote.id}`,
                  method: 'PATCH',
                  body: noteData
                }
              });
              
              if (response.success) {
                // Show success message
                showSuccessToast('Note saved');
                
                // Update note in state
                const noteIndex = state.notes.findIndex(n => n.id === state.currentNote.id);
                if (noteIndex >= 0) {
                  state.notes[noteIndex] = response.data;
                }
                
                // Update current note
                state.currentNote = response.data;
              }
            } catch (error) {
              console.error('Error saving note:', error);
              showErrorToast('Failed to save note');
            }
            
            document.body.removeChild(optionsMenu);
          });
          
          optionsMenu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
              try {
                const response = await chrome.runtime.sendMessage({
                  type: 'API_REQUEST',
                  data: {
                    endpoint: `/api/notepads/${state.currentNote.id}`,
                    method: 'DELETE'
                  }
                });
                
                if (response.success) {
                  // Remove from state
                  state.notes = state.notes.filter(n => n.id !== state.currentNote.id);
                  
                  // Reset current note
                  state.currentNote = null;
                  
                  // Go back to list view
                  notesListView.classList.remove('hidden');
                  noteEditorView.classList.add('hidden');
                  
                  // Re-render notes
                  renderNotes();
                }
              } catch (error) {
                console.error('Error deleting note:', error);
                showErrorToast('Failed to delete note');
              }
            }
            
            document.body.removeChild(optionsMenu);
          });
          
          // Close menu when clicking outside
          const closeMenu = (event) => {
            if (!optionsMenu.contains(event.target) && event.target !== moreOptionsButton) {
              document.body.removeChild(optionsMenu);
              document.removeEventListener('click', closeMenu);
            }
          };
          
          // Add delay to prevent immediate closing
          setTimeout(() => {
            document.addEventListener('click', closeMenu);
          }, 100);
        };
      }
    }
  } catch (error) {
    console.error('Error loading note:', error);
    showErrorToast('Failed to load note');
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