// Popup script for Vyna.live extension

// State
let state = {
  isAuthenticated: false,
  currentTab: 'vynaai',
  user: null,
  messages: [],
  notes: []
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
    }
    
    // Load AI chat information if needed
    // This would be implemented according to your API structure
  } catch (error) {
    console.error('Error loading user data:', error);
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
  
  // Add event listeners for the chat input
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  
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

// Send a chat message
async function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  try {
    chatInput.value = '';
    
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
    
    // Send message to API
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat',
        method: 'POST',
        data: {
          message,
          // Add any other required data
        }
      }
    });
    
    if (response.success) {
      // Create AI response message
      const aiMessage = {
        id: Date.now().toString(),
        content: response.data.content || response.data.message,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      // Add to messages array
      state.messages.push(aiMessage);
      
      // Render message
      renderChatMessage(aiMessage);
    } else {
      console.error('Error sending message:', response.error);
    }
  } catch (error) {
    console.error('Error sending message:', error);
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
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`;
  messageEl.innerHTML = `
    <div class="message-content">
      ${message.content}
    </div>
  `;
  
  // Append to container
  chatContainer.appendChild(messageEl);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
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
  
  // Create note element
  const noteEl = document.createElement('div');
  noteEl.className = 'note-item';
  noteEl.dataset.id = note.id;
  noteEl.innerHTML = `
    <div class="note-item-title">${note.title}</div>
    <div class="note-item-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
  `;
  
  // Add click event
  noteEl.addEventListener('click', () => openNote(note));
  
  // Append to list
  notesList.appendChild(noteEl);
}

// Open a note for editing
function openNote(note) {
  // This would be implemented based on your application's requirements
  console.log('Opening note:', note);
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
  
  const file = event.target.files[0];
  console.log('Uploading file:', file.name);
  
  // Reset the input value so the same file can be selected again
  event.target.value = '';
  
  // Implement file upload logic based on your API requirements
}

// Handle image upload
async function handleImageUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  
  const file = event.target.files[0];
  console.log('Uploading image:', file.name);
  
  // Reset the input value so the same file can be selected again
  event.target.value = '';
  
  // Implement image upload logic based on your API requirements
}

// Handle audio recording
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
    
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });
    
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      console.log('Audio recording finished:', audioBlob.size, 'bytes');
      
      // Implement audio upload logic based on your API requirements
    });
    
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    const micBtn = document.getElementById('mic-btn');
    micBtn.classList.add('recording');
    
    const noteMicBtn = document.getElementById('note-mic-btn');
    noteMicBtn.classList.add('recording');
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Could not access microphone. Please check your permissions.');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Update UI
    const micBtn = document.getElementById('mic-btn');
    micBtn.classList.remove('recording');
    
    const noteMicBtn = document.getElementById('note-mic-btn');
    noteMicBtn.classList.remove('recording');
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
