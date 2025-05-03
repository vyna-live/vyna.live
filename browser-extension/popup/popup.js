// Main popup script

// State management
let state = {
  isAuthenticated: false,
  user: null,
  activeTab: 'vynaai',
  chatSessions: [],
  currentChatSession: null,
  messages: [],
  notes: [],
  currentNote: null,
  noteLines: [],
  isLoading: false,
  commentaryStyle: 'color' // Default to color commentary
};

// DOM references
const app = document.getElementById('app');
const mainInterface = document.querySelector('.main-interface');

// Templates
const loginTemplate = document.getElementById('login-template');
const registerTemplate = document.getElementById('register-template');
const chatSessionsTemplate = document.getElementById('chat-sessions-template');
const chatInterfaceTemplate = document.getElementById('chat-interface-template');
const messageTemplate = document.getElementById('message-template');
const notepadListTemplate = document.getElementById('notepad-list-template');
const noteEditorTemplate = document.getElementById('note-editor-template');
const loadingTemplate = document.getElementById('loading-template');

// Tab content containers
const vynaaiContent = document.getElementById('vynaai-content');
const notepadContent = document.getElementById('notepad-content');

// Initialize the popup
async function initializePopup() {
  // Check authentication state
  state.isLoading = true;
  renderLoading(app);
  
  try {
    const authState = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    state.isAuthenticated = authState.isAuthenticated;
    state.user = authState.user;
    
    if (state.isAuthenticated) {
      await loadInitialData();
      renderMainInterface();
    } else {
      renderLogin();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    renderLogin();
  } finally {
    state.isLoading = false;
  }
}

// Load initial data for authenticated users
async function loadInitialData() {
  try {
    // Load chat sessions
    const chatSessionsResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/ai-chat-sessions/${state.user.id}`,
        method: 'GET'
      }
    });
    
    if (chatSessionsResponse.success) {
      state.chatSessions = chatSessionsResponse.data;
    }
    
    // Load notes
    const notesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/notepads/${state.user.id}`,
        method: 'GET'
      }
    });
    
    if (notesResponse.success) {
      state.notes = notesResponse.data;
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

// Render functions
function renderLogin() {
  clearElement(app);
  const loginNode = document.importNode(loginTemplate.content, true);
  app.appendChild(loginNode);
  
  // Add event listeners
  document.getElementById('loginButton').addEventListener('click', handleLogin);
  document.getElementById('switchToRegister').addEventListener('click', renderRegister);
}

function renderRegister() {
  clearElement(app);
  const registerNode = document.importNode(registerTemplate.content, true);
  app.appendChild(registerNode);
  
  // Add event listeners
  document.getElementById('registerButton').addEventListener('click', handleRegister);
  document.getElementById('switchToLogin').addEventListener('click', renderLogin);
}

function renderMainInterface() {
  clearElement(app);
  mainInterface.style.display = 'flex';
  app.appendChild(mainInterface);
  
  // Update user profile
  if (state.user) {
    document.getElementById('username').textContent = state.user.displayName || state.user.username;
    if (state.user.avatarUrl) {
      document.getElementById('userAvatar').src = state.user.avatarUrl;
    }
  }
  
  // Add tab click handlers
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // User profile dropdown
  document.getElementById('userProfile').addEventListener('click', handleLogout);
  
  // Render initial tab content
  renderVynaAITab();
  renderNotepadTab();
}

function renderVynaAITab() {
  clearElement(vynaaiContent);
  
  if (state.currentChatSession) {
    renderChatInterface();
  } else {
    renderChatSessionsList();
  }
}

function renderChatSessionsList() {
  const sessionsNode = document.importNode(chatSessionsTemplate.content, true);
  vynaaiContent.appendChild(sessionsNode);
  
  const chatList = vynaaiContent.querySelector('.chat-list');
  const sessionItemTemplate = document.getElementById('chat-session-item-template');
  
  // Render chat sessions
  if (state.chatSessions && state.chatSessions.length > 0) {
    state.chatSessions.forEach(session => {
      const sessionNode = document.importNode(sessionItemTemplate.content, true);
      const sessionItem = sessionNode.querySelector('.chat-session');
      
      sessionItem.dataset.id = session.id;
      sessionItem.querySelector('.chat-session-title').textContent = 
        session.title || `Chat from ${new Date(session.createdAt).toLocaleString()}`;
      
      sessionItem.addEventListener('click', () => selectChatSession(session));
      chatList.appendChild(sessionNode);
    });
  } else {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center p-4 text-muted';
    emptyMessage.textContent = 'No chat sessions yet';
    chatList.appendChild(emptyMessage);
  }
  
  // New chat button
  vynaaiContent.querySelector('#newChatButton').addEventListener('click', createNewChat);
}

function renderChatInterface() {
  const chatNode = document.importNode(chatInterfaceTemplate.content, true);
  vynaaiContent.appendChild(chatNode);
  
  // Set chat title
  const chatTitle = vynaaiContent.querySelector('#chatTitle');
  if (state.currentChatSession && state.currentChatSession.title) {
    chatTitle.textContent = state.currentChatSession.title;
  } else {
    chatTitle.textContent = 'New Chat';
  }
  
  // Set commentary style
  const commentaryOptions = vynaaiContent.querySelectorAll('.commentary-option');
  commentaryOptions.forEach(option => {
    if (option.dataset.style === state.commentaryStyle) {
      option.classList.add('active');
    }
    
    option.addEventListener('click', () => {
      commentaryOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      state.commentaryStyle = option.dataset.style;
    });
  });
  
  // Render messages
  const messagesContainer = vynaaiContent.querySelector('#messagesContainer');
  const emptyState = vynaaiContent.querySelector('#chatEmptyState');
  
  if (state.messages.length > 0) {
    emptyState.style.display = 'none';
    renderMessages(messagesContainer);
  } else {
    emptyState.style.display = 'flex';
  }
  
  // Add event listeners
  vynaaiContent.querySelector('#backToSessions').addEventListener('click', backToChatSessions);
  vynaaiContent.querySelector('#sendButton').addEventListener('click', sendMessage);
  
  // File upload handlers
  setupFileUploadHandlers();
  
  // Input handlers
  const chatInput = vynaaiContent.querySelector('#chatInput');
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

function renderMessages(container) {
  // Clear existing messages
  container.querySelectorAll('.message').forEach(el => el.remove());
  
  state.messages.forEach(message => {
    const messageNode = document.importNode(messageTemplate.content, true);
    const messageEl = messageNode.querySelector('.message');
    
    messageEl.classList.add(message.role);
    messageEl.querySelector('.message-content').textContent = message.content;
    
    // Show avatar only for assistant messages
    if (message.role === 'assistant') {
      const avatar = messageEl.querySelector('.avatar');
      avatar.style.display = 'block';
      avatar.querySelector('img').src = '../assets/vyna-icon.png';
      avatar.querySelector('img').alt = 'VynaAI';
    }
    
    container.appendChild(messageNode);
  });
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function renderNotepadTab() {
  clearElement(notepadContent);
  
  if (state.currentNote) {
    renderNoteEditor();
  } else {
    renderNotesList();
  }
}

function renderNotesList() {
  const notesNode = document.importNode(notepadListTemplate.content, true);
  notepadContent.appendChild(notesNode);
  
  const notesList = notepadContent.querySelector('#notesList');
  const noteItemTemplate = document.getElementById('note-item-template');
  
  // Render notes
  if (state.notes && state.notes.length > 0) {
    state.notes.forEach(note => {
      const noteNode = document.importNode(noteItemTemplate.content, true);
      const noteItem = noteNode.querySelector('.note-item');
      
      noteItem.dataset.id = note.id;
      noteItem.querySelector('.note-title').textContent = note.title || 'Untitled Note';
      noteItem.querySelector('.note-preview').textContent = note.content?.substring(0, 50) + '...';
      
      noteItem.addEventListener('click', () => selectNote(note));
      notesList.appendChild(noteNode);
    });
  } else {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center p-4 text-muted';
    emptyMessage.textContent = 'No notes yet';
    notesList.appendChild(emptyMessage);
  }
  
  // New note button
  notepadContent.querySelector('#newNoteButton').addEventListener('click', createNewNote);
}

function renderNoteEditor() {
  const editorNode = document.importNode(noteEditorTemplate.content, true);
  notepadContent.appendChild(editorNode);
  
  // Set editor title
  const editorTitle = notepadContent.querySelector('#noteEditorTitle');
  if (state.currentNote && state.currentNote.id) {
    editorTitle.textContent = 'Edit Note';
  } else {
    editorTitle.textContent = 'New Note';
  }
  
  // Render note paragraphs
  const paragraphsContainer = notepadContent.querySelector('#noteParagraphs');
  renderNoteParagraphs(paragraphsContainer);
  
  // Add event listeners
  notepadContent.querySelector('#backToNotes').addEventListener('click', backToNotesList);
  notepadContent.querySelector('#saveNoteButton').addEventListener('click', saveNote);
  notepadContent.querySelector('#addLineButton').addEventListener('click', addNoteLine);
  
  // Input handlers
  const noteInput = notepadContent.querySelector('#noteInput');
  noteInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteLine();
    }
  });
}

function renderNoteParagraphs(container) {
  clearElement(container);
  
  if (state.noteLines && state.noteLines.length > 0) {
    const paragraphTemplate = document.getElementById('note-paragraph-template');
    
    state.noteLines.forEach(line => {
      const paragraphNode = document.importNode(paragraphTemplate.content, true);
      const paragraph = paragraphNode.querySelector('.note-paragraph');
      paragraph.textContent = line;
      container.appendChild(paragraphNode);
    });
  }
}

function renderLoading(container) {
  clearElement(container);
  const loadingNode = document.importNode(loadingTemplate.content, true);
  container.appendChild(loadingNode);
}

// Event handlers
async function handleLogin() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  if (!username || !password) {
    errorElement.textContent = 'Please enter both username and password';
    errorElement.style.display = 'block';
    return;
  }
  
  try {
    const loginButton = document.getElementById('loginButton');
    loginButton.disabled = true;
    loginButton.textContent = 'Signing in...';
    
    const result = await chrome.runtime.sendMessage({
      type: 'LOGIN',
      data: { username, password }
    });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      await loadInitialData();
      renderMainInterface();
    } else {
      errorElement.textContent = result.error || 'Login failed';
      errorElement.style.display = 'block';
    }
  } catch (error) {
    errorElement.textContent = error.message || 'Login failed';
    errorElement.style.display = 'block';
  } finally {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = 'Sign In';
    }
  }
}

async function handleRegister() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const errorElement = document.getElementById('registerError');
  
  if (!username || !email || !password || !confirmPassword) {
    errorElement.textContent = 'Please fill in all fields';
    errorElement.style.display = 'block';
    return;
  }
  
  if (password !== confirmPassword) {
    errorElement.textContent = 'Passwords do not match';
    errorElement.style.display = 'block';
    return;
  }
  
  try {
    const registerButton = document.getElementById('registerButton');
    registerButton.disabled = true;
    registerButton.textContent = 'Signing up...';
    
    const result = await chrome.runtime.sendMessage({
      type: 'REGISTER',
      data: { username, email, password, displayName: username }
    });
    
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      await loadInitialData();
      renderMainInterface();
    } else {
      errorElement.textContent = result.error || 'Registration failed';
      errorElement.style.display = 'block';
    }
  } catch (error) {
    errorElement.textContent = error.message || 'Registration failed';
    errorElement.style.display = 'block';
  } finally {
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
      registerButton.disabled = false;
      registerButton.textContent = 'Sign Up';
    }
  }
}

async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    state.isAuthenticated = false;
    state.user = null;
    state.chatSessions = [];
    state.currentChatSession = null;
    state.messages = [];
    state.notes = [];
    state.currentNote = null;
    state.noteLines = [];
    renderLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function switchTab(tabId) {
  if (state.activeTab === tabId) return;
  
  // Update active tab
  state.activeTab = tabId;
  
  // Update UI
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === `${tabId}-content`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

async function selectChatSession(session) {
  state.currentChatSession = session;
  state.isLoading = true;
  renderLoading(vynaaiContent);
  
  try {
    // Load messages for this session
    const messagesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: `/api/ai-chat-messages/${session.id}`,
        method: 'GET'
      }
    });
    
    if (messagesResponse.success) {
      state.messages = messagesResponse.data.map(msg => ({
        id: msg.id.toString(),
        content: msg.content,
        role: msg.role
      }));
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    state.messages = [];
  } finally {
    state.isLoading = false;
    renderVynaAITab();
  }
}

function createNewChat() {
  state.currentChatSession = { id: null, title: 'New Chat' };
  state.messages = [];
  renderVynaAITab();
}

function backToChatSessions() {
  state.currentChatSession = null;
  renderVynaAITab();
}

async function sendMessage() {
  const chatInput = vynaaiContent.querySelector('#chatInput');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Clear input
  chatInput.value = '';
  
  // Add user message to state
  const userMessage = {
    id: Date.now().toString(),
    content: message,
    role: 'user'
  };
  
  state.messages.push(userMessage);
  
  // Update UI
  const messagesContainer = vynaaiContent.querySelector('#messagesContainer');
  const emptyState = vynaaiContent.querySelector('#chatEmptyState');
  emptyState.style.display = 'none';
  renderMessages(messagesContainer);
  
  // Show loading indicator
  const sendButton = vynaaiContent.querySelector('#sendButton');
  sendButton.disabled = true;
  sendButton.innerHTML = '<div class="spinner" style="width: 16px; height: 16px;"></div>';
  
  try {
    // Send message to backend
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat',
        method: 'POST',
        data: {
          hostId: state.user.id,
          message: message,
          sessionId: state.currentChatSession?.id || null,
          commentaryStyle: state.commentaryStyle
        }
      }
    });
    
    if (response.success) {
      // Add AI response
      const aiMessage = {
        id: Date.now().toString(),
        content: response.data.aiMessage?.content || response.data.response,
        role: 'assistant'
      };
      
      state.messages.push(aiMessage);
      
      // Update session if necessary
      if (response.data.isNewSession && response.data.sessionId) {
        // Refresh sessions
        const sessionsResponse = await chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          data: {
            endpoint: `/api/ai-chat-sessions/${state.user.id}`,
            method: 'GET'
          }
        });
        
        if (sessionsResponse.success) {
          state.chatSessions = sessionsResponse.data;
          state.currentChatSession = state.chatSessions.find(s => s.id === response.data.sessionId);
        }
      }
    } else {
      // Add error message
      state.messages.push({
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error processing your request.',
        role: 'assistant'
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Add error message
    state.messages.push({
      id: Date.now().toString(),
      content: 'Sorry, I encountered an error processing your request.',
      role: 'assistant'
    });
  } finally {
    // Update UI
    renderMessages(messagesContainer);
    sendButton.disabled = false;
    sendButton.innerHTML = 'Send <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
  }
}

function setupFileUploadHandlers() {
  // Document upload
  const docButton = vynaaiContent.querySelector('#docButton');
  const fileInput = vynaaiContent.querySelector('#fileInput');
  
  docButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileUpload);
  
  // Image upload
  const imageButton = vynaaiContent.querySelector('#imageButton');
  const imageInput = vynaaiContent.querySelector('#imageInput');
  
  imageButton.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
  
  // Audio recording
  const audioButton = vynaaiContent.querySelector('#audioButton');
  audioButton.addEventListener('click', handleAudioRecording);
}

async function handleFileUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  
  const file = event.target.files[0];
  const fileReader = new FileReader();
  
  fileReader.onload = async function(e) {
    try {
      const fileData = e.target.result;
      
      // Upload file
      const result = await chrome.runtime.sendMessage({
        type: 'UPLOAD_FILE',
        data: {
          fileData,
          fileName: file.name,
          hostId: state.user.id
        }
      });
      
      if (result.success) {
        // Add file info to chat input
        const chatInput = vynaaiContent.querySelector('#chatInput');
        chatInput.value += ` [Uploaded file: ${file.name}] ${result.data.url || ''}`;
        chatInput.focus();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      // Reset input
      event.target.value = '';
    }
  };
  
  fileReader.readAsDataURL(file);
}

async function handleImageUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  
  const file = event.target.files[0];
  if (!file.type.includes('image/')) {
    console.error('Not an image file');
    event.target.value = '';
    return;
  }
  
  const fileReader = new FileReader();
  
  fileReader.onload = async function(e) {
    try {
      const fileData = e.target.result;
      
      // Upload image
      const result = await chrome.runtime.sendMessage({
        type: 'UPLOAD_FILE',
        data: {
          fileData,
          fileName: file.name,
          hostId: state.user.id,
          fileType: 'image'
        }
      });
      
      if (result.success) {
        // Add image info to chat input
        const chatInput = vynaaiContent.querySelector('#chatInput');
        chatInput.value += ` [Uploaded image: ${file.name}] ${result.data.url || ''}`;
        chatInput.focus();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      // Reset input
      event.target.value = '';
    }
  };
  
  fileReader.readAsDataURL(file);
}

// Audio recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

async function handleAudioRecording() {
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
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const fileReader = new FileReader();
      
      fileReader.onload = async function(e) {
        try {
          const fileData = e.target.result;
          
          // Upload audio
          const result = await chrome.runtime.sendMessage({
            type: 'UPLOAD_FILE',
            data: {
              fileData,
              fileName: 'recording.wav',
              hostId: state.user.id,
              fileType: 'audio'
            }
          });
          
          if (result.success) {
            // Add audio info to chat input
            const chatInput = vynaaiContent.querySelector('#chatInput');
            chatInput.value += ` [Recorded audio] ${result.data.url || ''}`;
            chatInput.focus();
          }
        } catch (error) {
          console.error('Error uploading audio:', error);
        }
      };
      
      fileReader.readAsDataURL(audioBlob);
    };
    
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    const audioButton = vynaaiContent.querySelector('#audioButton');
    audioButton.classList.add('recording');
    audioButton.title = 'Stop recording';
  } catch (error) {
    console.error('Error starting recording:', error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Update UI
    const audioButton = vynaaiContent.querySelector('#audioButton');
    audioButton.classList.remove('recording');
    audioButton.title = 'Record audio';
  }
}

function selectNote(note) {
  state.currentNote = note;
  state.noteLines = note.content.split('\n');
  renderNotepadTab();
}

function createNewNote() {
  state.currentNote = { id: null, title: '', content: '' };
  state.noteLines = [];
  renderNotepadTab();
}

function backToNotesList() {
  state.currentNote = null;
  state.noteLines = [];
  renderNotepadTab();
}

function addNoteLine() {
  const noteInput = notepadContent.querySelector('#noteInput');
  const line = noteInput.value.trim();
  
  if (!line) return;
  
  // Add line to state
  state.noteLines.push(line);
  
  // Clear input
  noteInput.value = '';
  
  // Update UI
  const paragraphsContainer = notepadContent.querySelector('#noteParagraphs');
  renderNoteParagraphs(paragraphsContainer);
}

async function saveNote() {
  if (state.noteLines.length === 0) return;
  
  const content = state.noteLines.join('\n');
  const title = state.noteLines[0].substring(0, 50) + (state.noteLines[0].length > 50 ? '...' : '');
  
  try {
    const saveButton = notepadContent.querySelector('#saveNoteButton');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    // Save note
    let response;
    if (state.currentNote && state.currentNote.id) {
      // Update existing note
      response = await chrome.runtime.sendMessage({
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
    } else {
      // Create new note
      response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: '/api/notepads',
          method: 'POST',
          data: {
            hostId: state.user.id,
            title,
            content
          }
        }
      });
    }
    
    if (response.success) {
      // Refresh notes
      const notesResponse = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        data: {
          endpoint: `/api/notepads/${state.user.id}`,
          method: 'GET'
        }
      });
      
      if (notesResponse.success) {
        state.notes = notesResponse.data;
      }
      
      // Go back to notes list
      state.currentNote = null;
      state.noteLines = [];
      renderNotepadTab();
    }
  } catch (error) {
    console.error('Error saving note:', error);
  } finally {
    const saveButton = notepadContent.querySelector('#saveNoteButton');
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save';
    }
  }
}

// Utility functions
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initializePopup);
