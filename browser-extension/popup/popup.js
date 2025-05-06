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
  noteLines: []
};

// DOM Elements
const app = document.getElementById('app');

// Templates
const loginTemplate = document.getElementById('login-template');
const appTemplate = document.getElementById('app-template');

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
    
    // Load notes
    const notesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
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
        endpoint: '/api/ai-chat-sessions',
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

// Render all notes
function renderAllNotes() {
  const notesList = document.getElementById('notes-list');
  clearElement(notesList);
  
  if (state.notes && state.notes.length > 0) {
    state.notes.forEach(note => renderNote(note));
  } else {
    // Show empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="icon-circle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <h3 class="empty-state-title">No Notes Yet</h3>
      <p class="empty-state-subtitle">Create a new note to see it here</p>
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
  document.getElementById('google-btn').addEventListener('click', handleGoogleAuth);
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
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  try {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    const result = await chrome.runtime.sendMessage({
      type: 'LOGIN',
      data: { username: email, password }
    });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      renderApp();
      await loadUserData();
    } else {
      alert(result.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  } finally {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;
    }
  }
}

// Handle Google authentication
async function handleGoogleAuth() {
  try {
    const googleBtn = document.getElementById('google-btn');
    googleBtn.textContent = 'Connecting...';
    googleBtn.disabled = true;
    
    const result = await chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH' });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      renderApp();
      await loadUserData();
    } else {
      alert(result.error || 'Google authentication failed. Please try again.');
    }
  } catch (error) {
    console.error('Google auth error:', error);
    alert('An error occurred during Google authentication. Please try again.');
  } finally {
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
      googleBtn.innerHTML = '<img src="../assets/google-icon.svg" alt="Google" class="google-icon"> Sign up with Google';
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
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat-sessions',
        method: 'POST',
        data: {
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
  const chatContainer = document.getElementById('chat-container');
  
  // If empty state is visible, hide it
  const emptyState = document.getElementById('vynaai-empty-state');
  if (emptyState) {
    emptyState.classList.add('hidden');
  }
  
  // Make chat container visible
  chatContainer.classList.remove('hidden');
  
  // Get message template
  const messageTemplate = document.getElementById('message-template');
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
    
    // Create note
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'POST',
        data: {
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
  
  try {
    noteInput.value = '';
    
    // Send note to API
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'POST',
        data: {
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

// Render a note in the notes list
function renderNote(note) {
  const notesList = document.getElementById('notes-list');
  
  // Get note template
  const noteItemTemplate = document.getElementById('note-item-template');
  const noteNode = document.importNode(noteItemTemplate.content, true);
  const noteEl = noteNode.querySelector('.note-item');
  
  // Set note data
  noteEl.dataset.id = note.id;
  noteEl.querySelector('.note-item-title').textContent = note.title || 'Untitled Note';
  noteEl.querySelector('.note-item-preview').textContent = note.content?.substring(0, 50) + (note.content?.length > 50 ? '...' : '');
  
  // Add click event
  noteEl.addEventListener('click', () => openNote(note));
  
  // Append to list
  notesList.appendChild(noteNode);
}

// Open a note for editing
function openNote(note) {
  // Update state
  state.currentNote = note;
  state.noteLines = note.content.split('\n');
  
  // Hide notes list and show note editor
  const notesList = document.getElementById('notes-list');
  notesList.style.display = 'none';
  
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
        ${state.noteLines.map(line => `<p class="note-paragraph">${line}</p>`).join('')}
      </div>
      
      <div class="note-input-container">
        <textarea class="input-area" id="note-edit-input" placeholder="Add to your note"></textarea>
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
  newParagraph.textContent = line;
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
document.addEventListener('DOMContentLoaded', initPopup);
