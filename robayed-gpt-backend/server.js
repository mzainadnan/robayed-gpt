const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// 1. INITIALIZE GEMINI AI CORE WITH YOUR KEY
// Swap the text between the quotes below with your actual API Key:
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// 2. MIDDLEWARE AND SECURITY CONFIGURATIONS
app.use(cors()); 
app.use(express.json()); 
app.set('trust proxy', 1); 

// 3. ROOT ROUTE
app.get('/', (req, res) => {
    res.json({ 
        status: "online", 
        message: "Robayed GPT Backend is fully functional with AI integration!" 
    });
});

// 4. 24-HOUR 100-REQUEST LIMITER SETUP
const chatLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        reply: "You have reached your limit of 100 requests for today. This limit resets 24 hours after your first message." 
    },
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

// 5. CHAT PIPELINE ENDPOINT (With Live Gemini Processing)
app.post('/chat', chatLimiter, async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.json({ reply: "System received an empty message context." });
    }

    // Capture and log user IP data in your Render console
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[CHAT] Request received from IP: ${userIp}`);

    try {
        // Calling the highly optimized Gemini 1.5 Flash text engine
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: message,
        });

        // Send the real, living AI answer right back to your chat window
        res.json({ reply: response.text });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.json({ reply: "The AI module encountered an internal pipeline error processing that message." });
    }
});

// 6. RUN SYSTEM
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server spinning live on port ${PORT}`);
});
