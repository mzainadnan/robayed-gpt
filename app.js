// Replace the text inside the quotes with your actual keys from this screen!

const SUPABASE_URL = 'https://zkqkboyagxxybkncyzbl.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_R07X_l1i89LyDE6eQwXbBA_wzIvoRFn';

const BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com';
// Define the secure live backend link 
var BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com';

// Grab existing frontend chat layout elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput') || document.querySelector('input[type="text"]:not(#usernameInput)');
const sendBtn = document.getElementById('sendBtn') || document.querySelector('button:not(.nav-link-btn)');

// Grab our secure login elements
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const welcomeGatewayZone = document.getElementById('welcomeGatewayZone');
const welcomeMessage = document.getElementById('welcomeMessage');

// Authentication status variables
let isAuthenticated = false;
let activeUserId = ""; 

// --- SECURE LOGIN INTERACTION LOGIC ---
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
        const enteredUser = usernameInput.value.trim();
        const enteredPass = passwordInput.value;

        if (!enteredUser || !enteredPass) {
            alert("Please enter both username and password.");
            return;
        }

        try {
            // Send input variables directly to your Render backend API endpoint
            const response = await fetch(`${BACKEND_SERVER_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: enteredUser, password: enteredPass })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                isAuthenticated = true;
                activeUserId = enteredUser; // Set user identifier for messaging logs
                
                alert("Login successful! Chat unlocked.");
                
                // Hides the login panel layout
                if (welcomeGatewayZone) {
                    welcomeGatewayZone.style.display = 'none';
                }
                
                // Displays greeting banner
                if (welcomeMessage) {
                    welcomeMessage.textContent = `Welcome, ${enteredUser}!`;
                    welcomeMessage.style.display = 'inline';
                }

                // Unfreeze text entry element controls
                if (chatInput) {
                    chatInput.disabled = false;
                    chatInput.placeholder = "Type your message here...";
                }
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.background = "#007acc"; 
                    sendBtn.style.color = "white";
                }
            } else {
                alert(data.message || "Incorrect username or password. Access denied.");
            }
        } catch (error) {
            console.error("Login verification error:", error);
            alert("Unable to reach the secure authentication backend.");
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
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll update
}

async function sendMessage() {
    if (!isAuthenticated) {
        alert("Please login first using the form above.");
        return;
    }

    const messageText = chatInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    chatInput.value = '';

    try {
        // Post content alongside session parameters to your Node server
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
