// Popup script for Vyna.live browser extension

// DOM elements
const loginScreen = document.getElementById('login-screen');
const mainInterface = document.getElementById('main-interface');
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const aiMessageInput = document.getElementById('ai-message-input');
const noteInput = document.getElementById('note-input');
const addNoteButton = document.getElementById('add-note-button');

// File upload elements
const attachmentButton = document.getElementById('attachment-button');
const micButton = document.getElementById('mic-button');
const cameraButton = document.getElementById('camera-button');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');

const noteAttachmentButton = document.getElementById('note-attachment-button');
const noteMicButton = document.getElementById('note-mic-button');
const noteCameraButton = document.getElementById('note-camera-button');
const noteFileInput = document.getElementById('note-file-input');
const noteImageInput = document.getElementById('note-image-input');

// State management
let state = {
  isAuthenticated: false,
  user: null,
  activeTab: 'vynaai',
  messages: [],
  notes: []
};

// Audio recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Initialize the extension
async function initializeExtension() {
  try {
    // Check authentication state
    const authResponse = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    
    if (authResponse.isAuthenticated) {
      state.isAuthenticated = true;
      state.user = authResponse.user;
      showMainInterface();
      loadUserData();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showLoginScreen();
  }
}

// Load user data
async function loadUserData() {
  try {
    // Load messages
    const messagesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chats/' + state.user.id,
        method: 'GET'
      }
    });
    
    if (messagesResponse.success) {
      state.messages = messagesResponse.data;
    }
    
    // Load notes
    const notesResponse = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads/' + state.user.id,
        method: 'GET'
      }
    });
    
    if (notesResponse.success) {
      state.notes = notesResponse.data;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Show login screen
function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  mainInterface.classList.add('hidden');
}

// Show main interface
function showMainInterface() {
  loginScreen.classList.add('hidden');
  mainInterface.classList.remove('hidden');
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'LOGIN',
      data: { email, password }
    });
    
    if (response.success) {
      state.isAuthenticated = true;
      state.user = response.user;
      showMainInterface();
      loadUserData();
    } else {
      showError(response.error || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    showError('Login failed: ' + error.message);
  }
}

// Handle Google login
async function handleGoogleLogin() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'LOGIN_WITH_GOOGLE'
    });
    
    if (response.success) {
      state.isAuthenticated = true;
      state.user = response.user;
      showMainInterface();
      loadUserData();
    } else {
      showError(response.error || 'Google login failed.');
    }
  } catch (error) {
    showError('Google login failed: ' + error.message);
  }
}

// Show error message
function showError(message) {
  // Create and show an error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  // Insert before the login button
  loginForm.insertBefore(errorDiv, document.getElementById('login-button'));
  
  // Remove after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

// Switch tabs
function switchTab(tabId) {
  // Update active tab in state
  state.activeTab = tabId;
  
  // Update tab UI
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update content UI
  tabContents.forEach(content => {
    if (content.id === tabId + '-content') {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Send message to VynaAI
async function sendAiMessage() {
  const message = aiMessageInput.value.trim();
  
  if (!message) return;
  
  // Clear the input field
  aiMessageInput.value = '';
  
  try {
    // Send message to API
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/ai-chat',
        method: 'POST',
        data: {
          hostId: state.user.id,
          message: message,
          commentaryStyle: 'color' // Default to color commentary
        }
      }
    });
    
    if (response.success) {
      // Add to state
      state.messages.push({
        message: message,
        response: response.data.response || response.data.aiMessage?.content,
        createdAt: new Date().toISOString()
      });
      
      // Update UI (could implement a chat interface here)
      // For now just clear the VynaAI tab and show empty state
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Add a new note
async function addNote() {
  const noteText = noteInput.value.trim();
  
  if (!noteText) return;
  
  // Clear the input field
  noteInput.value = '';
  
  try {
    // Send note to API
    const response = await chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      data: {
        endpoint: '/api/notepads',
        method: 'POST',
        data: {
          hostId: state.user.id,
          title: noteText.split('\n')[0] || 'Untitled Note',
          content: noteText
        }
      }
    });
    
    if (response.success) {
      // Add to state
      state.notes.push({
        id: response.data.id,
        title: response.data.title,
        content: response.data.content,
        createdAt: new Date().toISOString()
      });
      
      // Update UI (could implement a notes list here)
      // For now just keep the empty state
    }
  } catch (error) {
    console.error('Error adding note:', error);
  }
}

// Handle file attachments
function handleAttachment() {
  fileInput.click();
}

function handleNoteAttachment() {
  noteFileInput.click();
}

// Handle microphone recording
async function toggleRecording(context) {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording(context);
  }
}

async function startRecording(context) {
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
          const response = await chrome.runtime.sendMessage({
            type: 'UPLOAD_FILE',
            data: {
              fileData,
              fileName: 'recording.wav',
              fileType: 'audio'
            }
          });
          
          if (response.success) {
            // Add reference to input field
            if (context === 'ai') {
              aiMessageInput.value += ` [Audio: ${response.data.url || 'recording.wav'}]`;
            } else if (context === 'note') {
              noteInput.value += ` [Audio: ${response.data.url || 'recording.wav'}]`;
            }
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
    const button = context === 'ai' ? micButton : noteMicButton;
    button.classList.add('recording');
  } catch (error) {
    console.error('Error starting recording:', error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Update UI
    micButton.classList.remove('recording');
    noteMicButton.classList.remove('recording');
  }
}

// Handle camera image capture
function handleCamera() {
  imageInput.click();
}

function handleNoteCamera() {
  noteImageInput.click();
}

// Handle file upload change
async function handleFileChange(e, context) {
  const file = e.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = async function(e) {
    try {
      const fileData = e.target.result;
      
      // Upload file
      const response = await chrome.runtime.sendMessage({
        type: 'UPLOAD_FILE',
        data: {
          fileData,
          fileName: file.name,
          fileType: file.type.includes('image/') ? 'image' : 'document'
        }
      });
      
      if (response.success) {
        // Add reference to input field
        if (context === 'ai') {
          aiMessageInput.value += ` [File: ${file.name} - ${response.data.url || ''}]`;
        } else if (context === 'note') {
          noteInput.value += ` [File: ${file.name} - ${response.data.url || ''}]`;
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  fileReader.readAsDataURL(file);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the extension
  initializeExtension();
  
  // Login form submission
  loginForm.addEventListener('submit', handleLogin);
  
  // Google login
  googleLoginButton.addEventListener('click', handleGoogleLogin);
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
  
  // AI message input
  aiMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
  });
  
  // Note input
  addNoteButton.addEventListener('click', addNote);
  noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      addNote();
    }
  });
  
  // File attachments
  attachmentButton.addEventListener('click', handleAttachment);
  noteAttachmentButton.addEventListener('click', handleNoteAttachment);
  
  fileInput.addEventListener('change', (e) => handleFileChange(e, 'ai'));
  noteFileInput.addEventListener('change', (e) => handleFileChange(e, 'note'));
  
  // Microphone
  micButton.addEventListener('click', () => toggleRecording('ai'));
  noteMicButton.addEventListener('click', () => toggleRecording('note'));
  
  // Camera
  cameraButton.addEventListener('click', handleCamera);
  noteCameraButton.addEventListener('click', handleNoteCamera);
  
  imageInput.addEventListener('change', (e) => handleFileChange(e, 'ai'));
  noteImageInput.addEventListener('change', (e) => handleFileChange(e, 'note'));
});
