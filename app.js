const BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com/';

// Interface Elements
const homeScreen = document.getElementById('homeScreen');
const chatDashboardZone = document.getElementById('chatDashboardZone');
const startChatBtn = document.getElementById('startChatBtn');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

// SCREEN TRANSITION LOGIC
if (startChatBtn) {
    startChatBtn.addEventListener('click', () => {
        if (homeScreen) homeScreen.style.display = 'none';
        if (chatDashboardZone) chatDashboardZone.style.display = 'block';
    });
}

// RENDER MESSAGE IN WINDOW
function appendMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.style.padding = "10px 14px";
    msgDiv.style.borderRadius = "8px";
    msgDiv.style.maxWidth = "75%";
    msgDiv.style.fontSize = "15px";
    msgDiv.style.lineHeight = "1.5";

    if (sender === 'user') {
        msgDiv.style.alignSelf = "flex-end";
        msgDiv.style.background = "#007acc";
        msgDiv.style.color = "white";
    } else {
        msgDiv.style.alignSelf = "flex-start";
        msgDiv.style.background = "#252525";
        msgDiv.style.color = "#fff";
        msgDiv.style.border = "1px solid #333";
    }

    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll down
}

// SEND MESSAGE ROUTINE
async function sendMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    chatInput.value = '';

    try {
        const response = await fetch(`${BACKEND_SERVER_URL}chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText })
        });

        const data = await response.json();
        
        if (data && data.reply) {
            appendMessage(data.reply, 'bot');
        } else if (data && data.message) {
            appendMessage(data.message, 'bot');
        } else {
            appendMessage("No response from system context pipelines.", 'bot');
        }
    } catch (error) {
        console.error("Transmission error:", error);
        // User-friendly sleeping server message
        appendMessage("System offline. Check connection metrics or wait one minute for the server to wake up.", 'bot');
    }
}

// EVENTS TRIGGERS
if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
