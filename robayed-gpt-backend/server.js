const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();

// Initialize Gemini Core safely using your Render Environment Variable
// This uses the correct object instantiation required by the library
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors()); 
app.use(express.json()); 
app.set('trust proxy', 1); 

app.get('/', (req, res) => {
    res.json({ status: "online", message: "AI Engine Ready" });
});

const chatLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress
});

app.post('/chat', chatLimiter, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Empty message received." });

    try {
        // Target the ultra-fast flash model layout
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({ contents: message });
        const response = result.response;
        
        // Send the real AI response text back to the frontend
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.json({ reply: "The AI module encountered an error processing your request." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live on port ${PORT}`));
