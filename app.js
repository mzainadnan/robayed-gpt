// Paste your third-party Supabase credentials here:
const SUPABASE_URL = 'https://zkqkboyagxxybkncyzbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R07X_l1i89LyDE6eQwXbBA_wzIvoRFn'; // Replace with your real publishable key
const BACKEND_SERVER_URL = 'https://robayed-gpt-backend.onrender.com';

let supabase;
let activeUserEmail = "";

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

// --- SAFE SETUP LOOP ---
// This function waits for the entire page and external libraries to load perfectly before doing anything
window.addEventListener('load', async () => {
    try {
        // Double-checks that Supabase actually loaded from the internet first
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase connected successfully.");
            
            // Check if someone is already logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                activeUserEmail = session.user.email;
                if (homeScreen) homeScreen.style.display = 'none';
                if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'none';
                if (chatDashboardZone) chatDashboardZone.style.display = 'block';
                if (authenticatedUserZone) authenticatedUserZone.style.display = 'flex';
                if (welcomeMessage) welcomeMessage.textContent = `User: ${activeUserEmail}`;
            }
        } else {
            console.error("Supabase script library failed to load from CDN.");
        }
    } catch (err) {
        console.error("Initialization error:", err);
    }
});

// --- ROUTING INTERACTORS ---
if (startChatBtn) {
    startChatBtn.addEventListener('click', () => {
        if (activeUserEmail) {
            if (homeScreen) homeScreen.style.display = 'none';
            if (chatDashboardZone) chatDashboardZone.style.display = 'block';
        } else {
            if (homeScreen) homeScreen.style.display = 'none';
            if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'flex';
        }
    });
}

if (backToHomeFromAuth) {
    backToHomeFromAuth.addEventListener('click', () => {
        if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'none';
        if (homeScreen) homeScreen.style.display = 'flex';
    });
}

// --- SECURE OAUTH GITHUB ENGINE ---
if (githubAuthBtn) {
    githubAuthBtn.addEventListener('click', async () => {
        if (!supabase) {
            alert("Database is still loading. Please wait a moment and try again.");
            return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) alert("GitHub Authentication Error: " + error.message);
    });
}

// --- LOGOUT ENGINE ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (supabase) await supabase.auth.signOut();
        activeUserEmail = "";
        if (authenticatedUserZone) authenticatedUserZone.style.display = 'none';
        if (chatDashboardZone) chatDashboardZone.style.display = 'none';
        if (welcomeGatewayZone) welcomeGatewayZone.style.display = 'none';
        if (homeScreen) homeScreen.style.display = 'flex';
        if (chatInput) chatInput.value = "";
        alert("Logged out successfully.");
    });
}

// --- STANDARD CHAT HANDLERS ---
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
