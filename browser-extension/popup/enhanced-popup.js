// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vyna-live.replit.app';

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
    
    if (authStatus.isAuthenticated) {
      // User is authenticated, show main interface
      document.querySelector('.main-interface').style.display = 'flex';
      document.querySelector('#username').textContent = authStatus.user.displayName || authStatus.user.username;
      
      if (authStatus.user.avatarUrl) {
        document.querySelector('#userAvatar').src = authStatus.user.avatarUrl;
      }
      
      // Store user info
      currentUser = authStatus.user;
      isAuthenticated = true;
      
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
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const userData = await response.json();
      return { isAuthenticated: true, user: userData };
    } else {
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    return { isAuthenticated: false, user: null };
  }
}

function showLoginScreen() {
  // Clear the app container
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = '';
  
  // Get the login template and clone it
  const loginTemplate = document.getElementById('login-template');
  const loginContent = document.importNode(loginTemplate.content, true);
  
  // Append to the app container
  appContainer.appendChild(loginContent);
  
  // Add event listeners
  document.getElementById('loginButton').addEventListener('click', handleLogin);
  document.getElementById('switchToRegister').addEventListener('click', showRegisterScreen);
}

function showRegisterScreen() {
  // Clear the app container
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = '';
  
  // Get the register template and clone it
  const registerTemplate = document.getElementById('register-template');
  const registerContent = document.importNode(registerTemplate.content, true);
  
  // Append to the app container
  appContainer.appendChild(registerContent);
  
  // Add event listeners
  document.getElementById('registerButton').addEventListener('click', handleRegister);
  document.getElementById('switchToLogin').addEventListener('click', showLoginScreen);
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
    // Send login request
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
    
    if (response.ok) {
      const userData = await response.json();
      // Store user data
      currentUser = userData;
      isAuthenticated = true;
      
      // Reload the app
      initializeApp();
    } else {
      const errorData = await response.json();
      showError('loginError', errorData.error || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
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
  
  try {
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
      
      // Reload the app
      initializeApp();
    } else {
      const errorData = await response.json();
      showError('registerError', errorData.error || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showError('registerError', 'Registration failed due to a network error. Please try again.');
  }
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = 'block';
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
      const chatSessionsTemplate = document.getElementById('chat-sessions-template');
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
  const chatSessionItemTemplate = document.getElementById('chat-session-item-template');
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
    const chatInterfaceTemplate = document.getElementById('chat-interface-template');
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
      
      // Get the current session
      const session = chatSessions.find(s => s.id === parseInt(sessionId));
      if (session) {
        const chatTitle = document.getElementById('chatTitle');
        chatTitle.textContent = session.title || `Chat from ${new Date(session.createdAt).toLocaleString()}`;
      }
      
      // Clear the messages container
      messagesContainer.innerHTML = '';
      
      if (messagesData.length > 0) {
        // Display the messages
        messagesData.forEach(message => {
          const messageElement = createMessageElement(message);
          messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        // Show empty state if no messages
        emptyState.style.display = 'flex';
      }
    } else {
      messagesContainer.innerHTML = '<div class="error">Failed to load messages</div>';
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    document.getElementById('messagesContainer').innerHTML = '<div class="error">Error loading messages</div>';
  }
}

function createMessageElement(message) {
  // Get the message template and clone it
  const messageTemplate = document.getElementById('message-template');
  const messageElement = document.importNode(messageTemplate.content, true);
  
  // Set message classes based on role
  const messageDiv = messageElement.querySelector('.message');
  messageDiv.classList.add(`message-${message.role}`);
  
  // Avatar is only visible for assistant messages
  const avatarDiv = messageElement.querySelector('.avatar');
  if (message.role === 'assistant') {
    avatarDiv.style.display = 'block';
    const avatarImg = avatarDiv.querySelector('img');
    avatarImg.src = '../assets/ai-avatar.png';
    avatarImg.alt = 'AI';
  }
  
  // Set message content
  const contentDiv = messageElement.querySelector('.message-content');
  
  // For assistant messages, format the text with paragraphs
  if (message.role === 'assistant') {
    message.content.split('\n').forEach(line => {
      // Check if line is a heading (all caps or ends with colon)
      const isHeading = line.trim() === line.trim().toUpperCase() && line.trim().length > 3 || 
                      line.trim().endsWith(':');
                      
      // Check if the line starts with a bullet or number
      const isList = line.trim().match(/^(-|\d+\.)\s.+/);
      
      if (line.trim().length > 0) {
        const p = document.createElement('p');
        p.textContent = line;
        
        if (isHeading) {
          p.classList.add('message-heading');
        } else if (isList) {
          p.classList.add('message-list-item');
        }
        
        contentDiv.appendChild(p);
      } else {
        // Empty line, add some space
        contentDiv.appendChild(document.createElement('br'));
      }
    });
    
    // Add action buttons for assistant messages
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'message-action-button';
    copyButton.title = 'Copy to clipboard';
    copyButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(message.content);
      // Show a tiny toast notification
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = 'Copied!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    });
    
    actionsDiv.appendChild(copyButton);
    contentDiv.appendChild(actionsDiv);
  } else {
    // For user messages, just set the text content
    contentDiv.textContent = message.content;
  }
  
  return messageElement;
}

async function sendMessage() {
  if (!isAuthenticated || !currentUser) {
    return;
  }
  
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message) {
    return;
  }
  
  // Clear the input
  chatInput.value = '';
  
  // Create and display a user message
  const userMessage = { id: Date.now(), role: 'user', content: message };
  const userMessageElement = createMessageElement(userMessage);
  
  const messagesContainer = document.getElementById('messagesContainer');
  const emptyState = document.getElementById('chatEmptyState');
  
  // Remove empty state if showing
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // Add the user message to the container
  messagesContainer.appendChild(userMessageElement);
  
  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Create a loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'message message-assistant loading';
  loadingMessage.innerHTML = `
    <div class="avatar">
      <img src="../assets/ai-avatar.png" alt="AI" width="24" height="24">
    </div>
    <div class="message-content loading-content">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(loadingMessage);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    // Send the message to the server
    const response = await fetch(`${API_BASE_URL}/api/ai-chat`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hostId: currentUser.id,
        message: message,
        sessionId: currentChatSessionId,
        commentaryStyle: commentaryStyle
      })
    });
    
    if (response.ok) {
      const responseData = await response.json();
      
      // Remove the loading message
      messagesContainer.removeChild(loadingMessage);
      
      // Create and display the AI response
      const aiMessage = {
        id: responseData.aiMessage?.id || Date.now(),
        role: 'assistant',
        content: responseData.aiMessage?.content || responseData.response
      };
      
      const aiMessageElement = createMessageElement(aiMessage);
      messagesContainer.appendChild(aiMessageElement);
      
      // Scroll to the bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Update the current session ID if this was a new session
      if (responseData.isNewSession && responseData.sessionId) {
        currentChatSessionId = responseData.sessionId;
        
        // Update the chat title if needed
        const chatTitle = document.getElementById('chatTitle');
        if (chatTitle) {
          // Use the first part of the user message as the title
          chatTitle.textContent = message.length > 30 ? message.substring(0, 27) + '...' : message;
        }
      }
    } else {
      // Remove the loading message
      messagesContainer.removeChild(loadingMessage);
      
      // Show an error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message message-error';
      errorMessage.textContent = 'Failed to get response. Please try again.';
      messagesContainer.appendChild(errorMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Remove the loading message if it still exists
    if (loadingMessage.parentNode) {
      messagesContainer.removeChild(loadingMessage);
    }
    
    // Show an error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message message-error';
    errorMessage.textContent = 'Failed to send message due to a network error. Please try again.';
    messagesContainer.appendChild(errorMessage);
  }
}

function handleChatInputKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function handleFileUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  if (!isAuthenticated || !currentUser) return;
  
  try {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hostId', currentUser.id.toString());
    
    // Show a loading indicator
    const chatInput = document.getElementById('chatInput');
    const originalPlaceholder = chatInput.placeholder;
    chatInput.placeholder = 'Uploading file...';
    chatInput.disabled = true;
    
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Add file info to the chat input
      chatInput.value += `[Uploaded file: ${file.name}] ${data.url ? data.url : ''}`;
      
      // Show a tiny toast notification
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = `${file.name} uploaded!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } else {
      // Show an error message
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'Failed to upload file';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    // Show an error message
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = 'Failed to upload file';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  } finally {
    // Reset the input and placeholder
    const chatInput = document.getElementById('chatInput');
    chatInput.placeholder = 'Type your message here...';
    chatInput.disabled = false;
    chatInput.focus();
    
    // Reset the file input
    event.target.value = '';
  }
}

async function handleImageUpload(event) {
  if (!event.target.files || event.target.files.length === 0) return;
  if (!isAuthenticated || !currentUser) return;
  
  try {
    const file = event.target.files[0];
    
    // Check if file is an image
    if (!file.type.includes('image/')) {
      // Show an error message
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'File must be an image';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hostId', currentUser.id.toString());
    formData.append('fileType', 'image');
    
    // Show a loading indicator
    const chatInput = document.getElementById('chatInput');
    const originalPlaceholder = chatInput.placeholder;
    chatInput.placeholder = 'Uploading image...';
    chatInput.disabled = true;
    
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Add image info to the chat input
      chatInput.value += `[Uploaded image: ${file.name}] ${data.url ? data.url : ''}`;
      
      // Show a tiny toast notification
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = `${file.name} uploaded!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } else {
      // Show an error message
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'Failed to upload image';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    // Show an error message
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = 'Failed to upload image';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  } finally {
    // Reset the input and placeholder
    const chatInput = document.getElementById('chatInput');
    chatInput.placeholder = 'Type your message here...';
    chatInput.disabled = false;
    chatInput.focus();
    
    // Reset the file input
    event.target.value = '';
  }
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
      
      // Get the notepad list template and clone it
      const notepadListTemplate = document.getElementById('notepad-list-template');
      const notepadListContent = document.importNode(notepadListTemplate.content, true);
      
      // Clear the content area and append the template
      notepadContent.innerHTML = '';
      notepadContent.appendChild(notepadListContent);
      
      // Populate the notes list
      const notesList = document.querySelector('.notes-list');
      if (savedNotes.length > 0) {
        savedNotes.forEach(note => {
          const noteItem = createNoteItem(note);
          notesList.appendChild(noteItem);
        });
      } else {
        notesList.innerHTML = '<div class="empty-notes-message">No notes yet. Create a new note to get started.</div>';
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
  const noteItemTemplate = document.getElementById('note-item-template');
  const noteItem = document.importNode(noteItemTemplate.content, true);
  
  // Set note title and preview
  const titleElement = noteItem.querySelector('.note-title');
  titleElement.textContent = note.title;
  
  const previewElement = noteItem.querySelector('.note-preview');
  previewElement.textContent = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
  
  // Add event listener to note item
  const noteElement = noteItem.querySelector('.note-item');
  noteElement.addEventListener('click', () => viewNote(note.id));
  
  return noteItem;
}

function createNewNote() {
  currentNoteId = null;
  showNoteEditor();
}

async function viewNote(noteId) {
  currentNoteId = noteId;
  const note = savedNotes.find(n => n.id === noteId);
  
  if (!note) {
    console.error('Note not found:', noteId);
    return;
  }
  
  showNoteViewer(note);
}

function showNoteEditor(existingNote = null) {
  try {
    const notepadContent = document.getElementById('notepad-content');
    
    // Get the note editor template and clone it
    const noteEditorTemplate = document.getElementById('note-editor-template');
    const noteEditorContent = document.importNode(noteEditorTemplate.content, true);
    
    // Clear the content area and append the template
    notepadContent.innerHTML = '';
    notepadContent.appendChild(noteEditorContent);
    
    // Set up the note lines if editing an existing note
    if (existingNote) {
      const noteLines = existingNote.content.split('\n');
      const noteLinesContainer = document.querySelector('.note-lines');
      
      noteLines.forEach(line => {
        if (line.trim()) {
          const lineElement = document.createElement('div');
          lineElement.className = 'note-line';
          lineElement.textContent = line;
          noteLinesContainer.appendChild(lineElement);
        }
      });
    }
    
    // Add event listeners
    document.getElementById('backToNotes').addEventListener('click', () => loadNotes());
    document.getElementById('saveNoteButton').addEventListener('click', saveNote);
    document.getElementById('addLineButton').addEventListener('click', addNoteLine);
    
    const noteInput = document.getElementById('noteInput');
    const addLineButton = document.getElementById('addLineButton');
    
    // Enable/disable add button based on input
    noteInput.addEventListener('input', () => {
      addLineButton.disabled = noteInput.value.trim() === '';
    });
    
    noteInput.addEventListener('keydown', handleNoteInputKeyDown);
    noteInput.focus();
  } catch (error) {
    console.error('Error showing note editor:', error);
  }
}

function showNoteViewer(note) {
  try {
    const notepadContent = document.getElementById('notepad-content');
    
    // Get the note viewer template and clone it
    const noteViewerTemplate = document.getElementById('note-viewer-template');
    const noteViewerContent = document.importNode(noteViewerTemplate.content, true);
    
    // Clear the content area and append the template
    notepadContent.innerHTML = '';
    notepadContent.appendChild(noteViewerContent);
    
    // Set note title and content
    document.getElementById('noteTitle').textContent = note.title;
    
    const noteContentElement = document.getElementById('noteContent');
    note.content.split('\n').forEach(line => {
      if (line.trim()) {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        noteContentElement.appendChild(paragraph);
      } else {
        noteContentElement.appendChild(document.createElement('br'));
      }
    });
    
    // Add event listeners
    document.getElementById('backToNotes').addEventListener('click', () => loadNotes());
    document.getElementById('editNoteButton').addEventListener('click', () => showNoteEditor(note));
  } catch (error) {
    console.error('Error showing note viewer:', error);
  }
}

function addNoteLine() {
  const noteInput = document.getElementById('noteInput');
  const line = noteInput.value.trim();
  
  if (!line) {
    return;
  }
  
  // Add the line to the note lines
  const noteLinesContainer = document.querySelector('.note-lines');
  const lineElement = document.createElement('div');
  lineElement.className = 'note-line';
  lineElement.textContent = line;
  noteLinesContainer.appendChild(lineElement);
  
  // Clear the input
  noteInput.value = '';
  noteInput.focus();
  
  // Update the save button state
  document.getElementById('saveNoteButton').disabled = false;
}

async function saveNote() {
  if (!isAuthenticated || !currentUser) {
    return;
  }
  
  const noteLines = Array.from(document.querySelectorAll('.note-line')).map(line => line.textContent);
  
  if (noteLines.length === 0) {
    // Show an error message
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = 'Note content cannot be empty';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    return;
  }
  
  const content = noteLines.join('\n');
  const title = noteLines[0].substring(0, 50) + (noteLines[0].length > 50 ? '...' : '');
  
  try {
    let response;
    
    if (currentNoteId) {
      // Update existing note
      response = await fetch(`${API_BASE_URL}/api/notepads/${currentNoteId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostId: currentUser.id,
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
          title,
          content
        })
      });
    }
    
    if (response.ok) {
      // Show a success message
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = currentNoteId ? 'Note updated!' : 'Note saved!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      
      // Go back to the notes list
      await loadNotes();
    } else {
      // Show an error message
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'Failed to save note';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  } catch (error) {
    console.error('Error saving note:', error);
    // Show an error message
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = 'Failed to save note due to a network error';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

function handleNoteInputKeyDown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addNoteLine();
  }
}
