// Navigation Bindings
const homeScreen = document.getElementById('homeScreen');
const appWorkspace = document.getElementById('appWorkspace');
const tryNowBtn = document.getElementById('tryNowBtn');
const backToHome = document.getElementById('backToHome');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

// Authentication Selectors
const loginHeaderBtn = document.getElementById('loginHeaderBtn');
const userProfileTag = document.getElementById('userProfileTag');
const workspaceWelcomeText = document.getElementById('workspaceWelcomeText');

// Modals
const openAbout = document.getElementById('openAbout');
const closeAbout = document.getElementById('closeAbout');
const aboutModal = document.getElementById('aboutModal');

// Input Triggers
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatStream = document.getElementById('chatStream');

/* ==========================================
   CONFIGURED LIVE BACKEND SERVER ENDPOINT
   ========================================== */
// Replace with your real live Render server URL!
const BACKEND_SERVER_URL = "https://robayed-gpt-backend.onrender.com";

const initiateLogin = () => {
    window.location.href = `${BACKEND_SERVER_URL}/api/auth/login`;
};
loginHeaderBtn.addEventListener('click', initiateLogin);

/* ==========================================
   PARSE DISPATCHED SECURITY CALLBACKS
   ========================================== */
const urlParams = new URLSearchParams(window.location.search);
const githubId = urlParams.get('githubId');
const username = urlParams.get('username');

if (githubId && username) {
    localStorage.setItem('robayed_github_id', githubId);
    localStorage.setItem('robayed_username', username);
    window.history.replaceState({}, document.title, window.location.pathname);
}

const activeUserId = localStorage.getItem('robayed_github_id');
const activeUsername = localStorage.getItem('robayed_username');

if (activeUserId && activeUsername) {
    loginHeaderBtn.textContent = `Sign Out`;
    loginHeaderBtn.removeEventListener('click', initiateLogin);
    loginHeaderBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });

    userProfileTag.textContent = activeUsername;
    workspaceWelcomeText.textContent = `Hello, ${activeUsername}. Your secure sandbox session is initialized and running.`;
    userInput.disabled = false;
    sendBtn.disabled = false;
}

/* ==========================================
   VIEW TOGGLE HANDLERS
   ========================================== */
tryNowBtn.addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    appWorkspace.classList.remove('hidden');
});

backToHome.addEventListener('click', () => {
    appWorkspace.classList.add('hidden');
    homeScreen.classList.remove('hidden');
});

toggleSidebar.addEventListener('click', () => sidebar.classList.add('active'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
openAbout.addEventListener('click', () => aboutModal.classList.add('active'));
closeAbout.addEventListener('click', () => aboutModal.classList.remove('active'));

/* ==========================================
   AUTHENTICATED RUNTIME ROUTER PIPELINE
   ========================================== */
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = userInput.value.trim();
    if (!messageText || !activeUserId) return;

    const welcomeBox = document.querySelector('.welcome-box');
    if (welcomeBox) welcomeBox.remove();

    appendMessage(messageText, 'user');
    userInput.value = '';

    // Create the loading thinking indicator row
    const spriteAsset = document.createElement('img');
    spriteAsset.src = 'assets/ai-sprite.png';
    spriteAsset.className = 'ai-sprite-thinking';
    chatStream.appendChild(spriteAsset);
    chatStream.scrollTop = chatStream.scrollHeight;

    try {
        const response = await fetch(`${BACKEND_SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: messageText,
                githubId: activeUserId
            })
        });

        const data = await response.json();
        spriteAsset.remove();

        if (!response.ok) {
            appendMessage(data.error || 'Server processing fault.', 'ai');
            return;
        }

        appendMessage(data.text, 'ai');

    } catch (error) {
        spriteAsset.remove();
        appendMessage(`Connection Failure: Could not establish secure link to server core modules.`, 'ai');
    }
});

function appendMessage(text, sender) {
    const row = document.createElement('div');
    row.className = `message-row ${sender}-row`;

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';
    
    const avatarImg = document.createElement('img');
    avatarImg.className = 'msg-avatar';
    avatarImg.src = sender === 'user' ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect width="30" height="30" fill="%23543d96"/><text x="50%" y="55%" dom-dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="12">U</text></svg>' : 'assets/ai-sprite.png';

    const textBox = document.createElement('div');
    textBox.className = 'msg-text-box';
    textBox.textContent = text;

    wrapper.appendChild(avatarImg);
    wrapper.appendChild(textBox);
    row.appendChild(wrapper);
    chatStream.appendChild(row);
    chatStream.scrollTop = chatStream.scrollHeight;
}