const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

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
        // FIXED: Prepended 'models/' to match strict library syntax
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Gemini Execution Error:", error);
        res.json({ reply: "The AI module encountered an error processing your request." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live on port ${PORT}`));
