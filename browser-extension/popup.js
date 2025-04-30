// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and its content
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

// Notepad functionality
const notepadContent = document.getElementById('notepad-content');
const saveNoteBtn = document.getElementById('save-note');
const clearNoteBtn = document.getElementById('clear-note');

// Load saved notes when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['notes'], (result) => {
    if (result.notes) {
      notepadContent.value = result.notes;
    }
  });
  
  // Load chat history
  loadChatHistory();
});

// Save notes
saveNoteBtn.addEventListener('click', () => {
  const notes = notepadContent.value;
  chrome.storage.local.set({ 'notes': notes }, () => {
    // Show save indicator
    saveNoteBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveNoteBtn.textContent = 'Save';
    }, 1500);
  });
});

// Clear notes
clearNoteBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear your notes?')) {
    notepadContent.value = '';
    chrome.storage.local.remove('notes');
  }
});

// AI Chat functionality
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');

// Load chat history
function loadChatHistory() {
  chrome.storage.local.get(['chatHistory'], (result) => {
    if (result.chatHistory && result.chatHistory.length > 0) {
      chatMessages.innerHTML = '';
      result.chatHistory.forEach(msg => {
        addMessageToChat(msg.content, msg.sender);
      });
    }
  });
}

// Add message to chat
function addMessageToChat(content, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = content;
  
  messageElement.appendChild(messageContent);
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Save to history
  saveMessageToHistory(content, sender);
}

// Save message to history
function saveMessageToHistory(content, sender) {
  chrome.storage.local.get(['chatHistory'], (result) => {
    const history = result.chatHistory || [];
    history.push({ content, sender });
    
    // Keep only last 50 messages
    if (history.length > 50) {
      history.shift();
    }
    
    chrome.storage.local.set({ 'chatHistory': history });
  });
}

// Send message to AI
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  // Add user message to chat
  addMessageToChat(message, 'user');
  messageInput.value = '';
  
  // Show loading indicator
  const loadingMsg = 'Connecting to AI...';
  addMessageToChat(loadingMsg, 'ai');
  
  // Connect to the Vyna backend for AI response
  fetchAIResponse(message)
    .then(response => {
      // Remove loading message
      chatMessages.removeChild(chatMessages.lastChild);
      
      // Add AI response
      addMessageToChat(response, 'ai');
    })
    .catch(error => {
      // Remove loading message
      chatMessages.removeChild(chatMessages.lastChild);
      
      // Add error message
      addMessageToChat('Sorry, I could not connect to the AI service. Please try again later.', 'ai');
      console.error('Error fetching AI response:', error);
    });
}

// Fetch AI response from Vyna backend
async function fetchAIResponse(message) {
  try {
    // First try to connect to Vyna live API
    const response = await fetch('https://vyna.live/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to connect to Vyna API');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    // Fallback to localhost if deployed site isn't available
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to local API');
      }
      
      const data = await response.json();
      return data.response;
    } catch (localError) {
      // If both fail, return a default response
      console.error('Failed to connect to both APIs:', error, localError);
      return "I'm currently offline. Please use the web app at vyna.live for full AI functionality.";
    }
  }
}