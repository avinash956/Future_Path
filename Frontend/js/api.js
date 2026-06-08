// =====================================
// BASE API URL
// =====================================

const BASE_URL = "http://127.0.0.1:5000/api";
window.BASE_URL = BASE_URL;

// =====================================
// SAFE HISTORY HELPERS
// =====================================

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem("chatHistory") || "[]");
    } catch {
        return [];
    }
}

function cleanText(text) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
}

// =====================================
// SAVE HISTORY (SAFE)
// =====================================

function saveHistory(role, message) {

    if (!message || typeof message !== "string") return;

    const history = getHistory();

    history.push({
        role,
        message: cleanText(message),
        time: new Date().toISOString()
    });

    localStorage.setItem("chatHistory", JSON.stringify(history));
    renderHistory();
}

// =====================================
// LOAD HISTORY
// =====================================

function loadChatHistory() {
    renderHistory();
}

// =====================================
// RENDER HISTORY SIDEBAR
// =====================================

function renderHistory() {

    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    const history = getHistory();

    historyList.innerHTML = "";

    history
        .slice()
        .reverse()
        .forEach(item => {

            if (!item || !item.message) return;

            const div = document.createElement("div");

            div.style.padding = "8px";
            div.style.marginBottom = "8px";
            div.style.background = "#1f2a38";
            div.style.borderRadius = "8px";
            div.style.cursor = "pointer";
            div.style.color = "white";
            div.style.fontSize = "13px";

            div.textContent = item.message;

            div.onclick = () => {
                document.getElementById("query").value = item.message;
            };

            historyList.appendChild(div);
        });
}

// =====================================
// CLEAR HISTORY
// =====================================

function clearHistory() {
    localStorage.removeItem("chatHistory");
    renderHistory();
}

// =====================================
// SEND MESSAGE TO AI
// =====================================

async function sendMessage() {

    const input = document.getElementById("query");
    const chatBox = document.getElementById("chatBox");
    const sendBtn = document.getElementById("sendBtn");

    if (!input || !chatBox) return;

    const message = cleanText(input.value);
    if (!message) return;

    if (sendBtn) sendBtn.disabled = true;

    // USER MESSAGE UI
    const userMsg = document.createElement("div");
    userMsg.className = "msg user";
    userMsg.textContent = message;

    chatBox.appendChild(userMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    saveHistory("user", message);

    input.value = "";

    // TYPING
    const typingMsg = document.createElement("div");
    typingMsg.className = "msg bot";
    typingMsg.textContent = "🤖 Thinking...";

    chatBox.appendChild(typingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const headers = {
            "Content-Type": "application/json"
        };

        let token = localStorage.getItem("token");

        if (token) {
            token = token.replace(/^["']|["']$/g, "");
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            headers["Authorization"] = "Bearer guest";
        }

        const response = await fetch(
            `${window.BASE_URL}/ai/chat`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({ message }),
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = { reply: "Invalid server response" };
        }

        typingMsg?.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "msg bot";

        let reply = cleanText(data.reply || "No response received.");

        if (response.ok) {

            if (typeof marked !== "undefined") {
                aiMsg.innerHTML = marked.parse(reply, {
                    breaks: true,
                    gfm: true
                });
            } else {
                aiMsg.textContent = reply;
            }

            if (typeof renderMathInElement !== "undefined") {
                renderMathInElement(aiMsg, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ],
                    throwOnError: false,
                    strict: false
                });
            }

            saveHistory("ai", reply);

        } else {

            let errorMessage =
                data.message ||
                data.error ||
                "AI service unavailable.";

            if (errorMessage.toLowerCase().includes("quota")) {
                errorMessage = "⚠ AI quota exceeded. Try later.";
            }

            aiMsg.textContent = errorMessage;
        }

        chatBox.appendChild(aiMsg);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {

        typingMsg?.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "msg bot";

        aiMsg.textContent =
            error.name === "AbortError"
                ? "⏱ Request timed out. Try again."
                : "⚠ Unable to connect to AI server.";

        chatBox.appendChild(aiMsg);

    } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

// =====================================
// UPLOAD MEDIA
// =====================================

async function uploadMedia(data) {

    try {

        const headers = {
            "Content-Type": "application/json"
        };

        let token = localStorage.getItem("token");

        if (token) {
            token = token.replace(/^["']|["']$/g, "");
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${window.BASE_URL}/media/upload`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(data)
            }
        );

        const result = await response.json().catch(() => ({
            message: "Invalid server response"
        }));

        if (!response.ok) {
            alert(result.message || "Upload failed");
            return false;
        }

        alert("✅ Media uploaded successfully");
        return true;

    } catch (error) {
        console.error(error);
        alert("⚠ Backend not reachable");
        return false;
    }
}

// =====================================
// ENTER KEY SUPPORT
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("query");

    if (input) {
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    loadChatHistory();
});

// =====================================
// PDF DOWNLOAD (CLEAN + ERROR FREE)
// =====================================

function downloadPDF() {
    // 1. Resolve and extract the active jsPDF class instance
    let jsPDFClass = null;
    
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF; // Standard modern bundle path
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;       // Legacy global fallback path
    }

    // Halt gracefully if neither structural initialization is active
    if (!jsPDFClass) {
        console.error("jsPDF dependency is missing from the window scope.");
        alert("⚠ PDF library not loaded yet. Please ensure the CDN script is included in your HTML.");
        return;
    }

    const history = getHistory();
    if (!history || history.length === 0) {
        alert("ℹ Chat history is empty. Type a few messages first!");
        return;
    }

    // 2. Instantiate canvas engine
    const doc = new jsPDFClass();

    // 3. Page Configuration Variables
    let y = 15;                   
    const margin = 15;            
    const pageHeight = doc.internal.pageSize.getHeight();
    const printableWidth = doc.internal.pageSize.getWidth() - (margin * 2);

    // 4. Document Styling
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // 5. Parse Data Stream
    history.forEach(item => {
        if (!item || !item.message) return;

        const label = item.role === "user" ? "User: " : "AI: ";
        const textToWrap = label + cleanText(item.message);

        // Break lines safely using the engine instance parameters
        const splitLines = doc.splitTextToSize(textToWrap, printableWidth);

        splitLines.forEach(line => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = 15; 
            }
            doc.text(line, margin, y);
            y += 6; 
        });

        y += 4; 
    });

    // 6. Trigger Browser File Export System
    const datestamp = new Date().toISOString().slice(0, 10);
    doc.save(`chat-history-${datestamp}.pdf`);
}