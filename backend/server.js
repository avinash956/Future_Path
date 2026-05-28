const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs"); 
const path = require("path"); 
const OpenAI = require("openai");

// =========================================================================
// MULTIPART FORM-DATA PARSER EXTENSION (ADDED FOR FORMDATA SUPPORT)
// =========================================================================
const multer = require('multer');
const upload = multer(); // Allows Express to process incoming FormData fields

const app = express();

// =========================================================================
// ADVANCED CORS SECURITY CONFIGURATION LAYER (UNLOCKED PREFLIGHT CODES)
// =========================================================================
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"], 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"] 
}));

app.use(express.json());

// JSON File Database Paths Generator Setup
const DATA_FILE = path.join(__dirname, "management_db.json");
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([])); 
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =========================================================================
// ROUTE: ADD MANAGEMENT MEMBER DATA (UPDATED WITH MULTER PARSER HOOK)
// =========================================================================
app.post("/api/add-management", upload.none(), (req, res) => {
    try {
        const { name, post, email, phone, department, status, description } = req.body;

        if (!name || !post || !email) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        // Read existing local file dataset array records securely
        const fileData = fs.readFileSync(DATA_FILE, "utf8");
        const records = JSON.parse(fileData || "[]");

        // Build object payload entry
        const newRecord = {
            _id: Date.now().toString(), 
            name, post, email, phone, department, status, description,
            image: "default-avatar.png" 
        };

        records.push(newRecord);
        fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2)); 

        return res.status(201).json({ success: true, message: "Management Added Successfully" });
    } catch (err) {
        console.error("Database Write Error:", err);
        return res.status(500).json({ success: false, message: "Internal server database storage error." });
    }
});

// =========================================================================
// ROUTE: FETCH ALL MANAGEMENT SYSTEM RECORDS
// =========================================================================
app.get("/api/get-management", (req, res) => {
    try {
        const fileData = fs.readFileSync(DATA_FILE, "utf8");
        const records = JSON.parse(fileData || "[]");
        return res.status(200).json(records); 
    } catch (err) {
        console.error("Database Read Error:", err);
        return res.status(500).json({ error: "Failed to read application data stores." });
    }
});

// =========================================================================
// ROUTE: DELETE MANAGEMENT MEMBER RECORD
// =========================================================================
app.delete("/api/delete-management/:id", (req, res) => {
    try {
        const recordId = req.params.id;
        const fileData = fs.readFileSync(DATA_FILE, "utf8");
        let records = JSON.parse(fileData || "[]");

        records = records.filter(item => item._id !== recordId);
        fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));

        return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        console.error("Database Delete Error:", err);
        return res.status(500).json({ success: false, message: "Delete action failed on server storage." });
    }
});

// =========================================================================
// GLOBAL ROUTE ACCESSIBILITY FALLBACKS FOR LEGACY FRONTEND ALIGNMENTS
// =========================================================================
app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Future Path EduTech AI Assistant." },
        { role: "user", content: userMessage }
      ]
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch(err){
    console.log(err);
    res.status(500).json({ reply: "AI Error" });
  }
});

// Extra endpoint handler mapping to intercept frontend calls hitting /ai/chat directly
app.post("/api/ai/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Future Path EduTech AI Assistant." },
        { role: "user", content: userMessage }
      ]
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch(err){
    console.log(err);
    res.status(500).json({ reply: "AI Error" });
  }
});

// =========================================================================
// BACKEND ACTIVATION INTERFACE (CONSOLIDATED ON SINGLE PORT SERVICE LINK)
// =========================================================================
app.listen(5000, () => {
  console.log("Server running smoothly on unified port 5000");
});