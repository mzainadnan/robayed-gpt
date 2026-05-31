const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. MIDDLEWARE AND SECURITY CONFIGURATIONS
app.use(cors()); // Allows your GitHub Pages website to connect without security blocks
app.use(express.json()); // Allows the server to read json data sent from the website
app.set('trust proxy', 1); // Crucial for Render to read client IP addresses correctly

// 2. ROOT ROUTE (Fixes the "Cannot GET /" message and shows server status)
app.get('/', (req, res) => {
    res.json({ 
        status: "online", 
        message: "Robayed GPT Backend is fully functional!" 
    });
});

// 3. 24-HOUR 100-REQUEST LIMITER SETUP
const chatLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: 100, // Limits each distinct IP address to 100 requests per 24 hours
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        reply: "You have reached your limit of 100 requests for today. This limit will automatically reset 24 hours after your first message." 
    },
    keyGenerator: (req) => {
        // Safe tracking using the network IP passed down by Render's routing layers
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

// 4. CHAT PIPELINE ENDPOINT
app.post('/chat', chatLimiter, (req, res) => {
    const { message } = req.body;
    
    // Safety check to handle empty text fields
    if (!message) {
        return res.json({ reply: "System received an empty message context." });
    }

    // Capture and print the IP address directly into your Render dashboard logs
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[CHAT] Request received from IP: ${userIp}`);

    // --- AI PROCESSING CORE ---
    // Currently set to safely echo your message back to prove the connection works.
    // Integrate your specific OpenAI/Gemini fetch requests here when ready.
    res.json({ 
        reply: `Server connection healthy. Received: "${message}". AI computing module online.` 
    });
});

// 5. RUN SYSTEM
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server spinning live on port ${PORT}`);
});
