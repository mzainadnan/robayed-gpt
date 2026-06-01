const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Verify that at least the primary key is present in your environment variables
if (!process.env.GEMINI_KEY_PRIMARY) {
    console.error("CRITICAL ERROR: GEMINI_KEY_PRIMARY environment variable is missing!");
}

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

// Helper function to dynamically initialize the SDK and request content using a specific key
async function askGemini(apiKey, prompt) {
    if (!apiKey) {
        throw new Error("Missing API Key for this operation.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

app.post('/chat', chatLimiter, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Empty message received." });

    try {
        console.log("Routing process: Dispatching payload to Primary Key tier...");
        // 1. Try with your primary key
        const reply = await askGemini(process.env.GEMINI_KEY_PRIMARY, message);
        return res.json({ reply });

    } catch (primaryError) {
        console.warn("Primary Key Warning: Connection dropped or quota limit exceeded.");
        console.error(primaryError);

        // Detect 429 Quota Exceeded/Rate Limit conditions
        const isRateLimited = primaryError.status === 429 || 
                              (primaryError.message && primaryError.message.includes("429")) || 
                              (primaryError.message && primaryError.message.toLowerCase().includes("quota"));

        if (isRateLimited) {
            if (process.env.GEMINI_KEY_BACKUP) {
                console.log("🔄 Automation Active: 429 Error identified. Diverting traffic to Backup Key...");
                
                try {
                    // 2. Automatically fallback to your backup key
                    const backupReply = await askGemini(process.env.GEMINI_KEY_BACKUP, message);
                    console.log("Success: Backup Key recovered the chat stream successfully.");
                    return res.json({ reply: backupReply });
                } catch (backupError) {
                    console.error("Critical: Both Primary and Backup keys are exhausted for the day.", backupError);
                    return res.json({ 
                        reply: "All system processing limits have been reached for tonight. Please check back shortly." 
                    });
                }
            } else {
                console.error("Error: Rate limited on Primary Key, but GEMINI_KEY_BACKUP is missing in Render settings.");
            }
        }

        // Return a clean error response if it wasn't a 429 error
        return res.json({ reply: "The AI module encountered an error processing your request." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live on port ${PORT}`));
