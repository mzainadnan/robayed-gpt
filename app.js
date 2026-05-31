// Define the secure live backend link 
var BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com';

// Grab existing frontend elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput') || document.querySelector('input[type="text"]:not(#usernameInput)');
const sendBtn = document.getElementById('sendBtn') || document.querySelector('button:not(.nav-link-btn)');

// Grab our brand new local login elements from the navbar
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const loginFormContainer = document.getElementById('loginFormContainer');
const welcomeMessage = document.getElementById('welcomeMessage');

// Set your desired credentials here
const CORRECT_USERNAME = "zain";
const CORRECT_PASSWORD = "robayed_gpt";

// Authentication status variables
let isAuthenticated = false;
let activeUserId = ""; 

// --- LOGIN INTERACTION LOGIC ---
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', () => {
        const enteredUser = usernameInput.value.trim();
        const enteredPass = passwordInput.value;

        if (enteredUser === CORRECT_USERNAME && enteredPass === CORRECT_PASSWORD) {
            isAuthenticated = true;
            activeUserId = enteredUser; // Set username for backend payload
            
            alert("Login successful! Chat unlocked.");
            
            // Hide credentials container and show welcome string
            if (loginFormContainer) loginFormContainer.style.display = 'none';
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${enteredUser}!`;
                welcomeMessage.style.display = 'inline';
            }

            // Unfreeze the main messaging field & button
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = "Type your message here...";
            }
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        } else {
            alert("Incorrect username or password. Access denied.");
        }
    });
}

// --- STANDARD MESSAGE HANDLING ---
function appendMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    if (!isAuthenticated) {
        alert("Please login first.");
        return;
    }

    const messageText = chatInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    chatInput.value = '';

    try {
        // Send message and access identifier payload straight to Render
        const response = await fetch(`${BACKEND_SERVER_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: messageText,
                githubId: activeUserId 
            })
        });

        const data = await response.json();
        if (data && data.reply) {
            appendMessage(data.reply, 'bot');
        } else {
            appendMessage("No response from AI.", 'bot');
        }
    } catch (error) {
        console.error("Error communicating with backend server:", error);
        appendMessage("Error reaching the AI backend server.", 'bot');
    }
}

// Bind messaging execution triggers
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
