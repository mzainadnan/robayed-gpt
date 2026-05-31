const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Deployment environment variables loaded securely from Render
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Database tracker per unique GitHub user ID
const userRequestDatabase = {};
const MAX_LIMIT = 100;

// Route 1: Direct users to GitHub Login
app.get('/api/auth/login', (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`;
    res.redirect(githubAuthUrl);
});

// Route 2: Receive the authorization code from GitHub
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Verification parameter signature missing.");

    try {
        // Exchange authentication code for user account token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code
            })
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch user profile variables using token authorization
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'Robayed-GPT-Server' }
        });
        const userData = await userResponse.json();
        
        const githubId = userData.id;
        const username = userData.login;

        // Redirect back to frontend site with secure URL data parameters
        res.redirect(`${FRONTEND_URL}?githubId=${githubId}&username=${encodeURIComponent(username)}`);

    } catch (error) {
        res.status(500).send(`OAuth authorization cluster pipeline fault: ${error.message}`);
    }
});

// Protected Chat Route verifying user allocations
app.post('/api/chat', async (req, res) => {
    const { message, githubId } = req.body;

    if (!githubId) {
        return res.status(401).json({ error: "Access Denied: Unverified session profile identity." });
    }

    if (!userRequestDatabase[githubId]) {
        userRequestDatabase[githubId] = 0;
    }

    // Strict Request Cap Enforcement
    if (userRequestDatabase[githubId] >= MAX_LIMIT) {
        return res.status(429).json({ 
            error: `🚨 Secure limit reached! Your profile has consumed all ${MAX_LIMIT} allowed query allocations.` 
        });
    }

    try {
        const systemInstruction = "You are Robayed GPT, a premium conversational helper.";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction} User question: ${message}` }] }]
            })
        });

        if (!response.ok) throw new Error(`Google service response fault code: ${response.status}`);

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;

        userRequestDatabase[githubId]++;
        console.log(`User ID: ${githubId} updated quota to: ${userRequestDatabase[githubId]}/${MAX_LIMIT}`);

        res.json({ 
            text: aiResponseText, 
            currentUsage: userRequestDatabase[githubId] 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server executing on port ${PORT}`));