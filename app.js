// Paste your third-party Supabase credentials here:
const SUPABASE_URL = 'https://zkqkboyagxxybkncyzbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R07X_l1i89LyDE6eQwXbBA_wzIvoRFn'; // Remember to update this with your publishable key!
const BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com';

// Initialize Supabase Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Containers
const homeScreen = document.getElementById('homeScreen');
const welcomeGatewayZone = document.getElementById('welcomeGatewayZone');
const chatDashboardZone = document.getElementById('chatDashboardZone');

// Click Elements
const startChatBtn = document.getElementById('startChatBtn');
const githubAuthBtn = document.getElementById('githubAuthBtn');
const backToHomeFromAuth = document.getElementById('backToHomeFromAuth');
const logoutBtn = document.getElementById('logoutBtn');
const sendBtn = document.getElementById('sendBtn');

// Display Fields
const authenticatedUserZone = document.getElementById('authenticatedUserZone');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

let activeUserEmail = "";

// --- CHECK SESSION STATUS AUTOMATICALLY ON LOAD ---
async function checkActiveSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session && session.user) {
        activeUserEmail = session.user.email;
        
        // Skip right to the workspace if session handles match
        if (homeScreen) homeScreen.style.display = 'none';
        if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'none';
        if (chatDashboardZone) chatDashboardZone.style.display = 'block';
        
        if (authenticatedUserZone) authenticatedUserZone.style.display = 'flex';
        if (welcomeMessage) welcomeMessage.textContent = `User: ${activeUserEmail}`;
    }
}
checkActiveSession();

// --- ROUTING INTERACTORS ---
if (startChatBtn) {
    startChatBtn.addEventListener('click', () => {
        if (activeUserEmail) {
            homeScreen.style.display = 'none';
            chatDashboardZone.style.display = 'block';
        } else {
            homeScreen.style.display = 'none';
            welcomeGatewayZone.style.display = 'flex';
        }
    });
}

if (backToHomeFromAuth) {
    backToHomeFromAuth.addEventListener('click', () => {
        welcomeGatewayZone.style.display = 'none';
        homeScreen.style.display = 'flex';
    });
}

// --- SECURE OAUTH GITHUB ENGINE ---
if (githubAuthBtn) {
    githubAuthBtn.addEventListener('click', async () => {
        // Triggers Supabase to route authentication checks safely out to GitHub
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        
        if (error) {
            alert("GitHub Authentication Error: " + error.message);
        }
    });
}

// --- LOGOUT ENGINE ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        activeUserEmail = "";
        
        if (authenticatedUserZone) authenticatedUserZone.style.display = 'none';
        if (chatDashboardZone) chatDashboardZone.style.display = 'none';
        if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'none';
        if (homeScreen) homeScreen.style.display = 'flex';
        
        if (chatInput) chatInput.value = "";
        alert("Logged out successfully.");
    });
}

// --- STANDARD MESSAGE HANDLING ---
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    chatInput.value = '';

    try {
        const response = await fetch(`${BACKEND_SERVER_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText, githubId: activeUserEmail })
        });

        const data = await response.json();
        if (data && data.reply) {
            appendMessage(data.reply, 'bot');
        } else {
            appendMessage("No response from AI.", 'bot');
        }
    } catch (error) {
        console.error("Connection error:", error);
        appendMessage("Error reaching the AI backend server.", 'bot');
    }
}

if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
