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

function setHistory(data) {
    localStorage.setItem("chatHistory", JSON.stringify(data));
}

// =====================================
// CLEAN TEXT (IMPROVED SAFE VERSION)
// =====================================

function cleanText(text) {
    if (!text) return "";

    return String(text)
        .replace(/[ \t]+/g, " ")
        .split("\n")
        .map(line => line.trim())
        .join("\n")
        .trim();
}

// =====================================
// SAVE HISTORY
// =====================================

function saveHistory(role, message) {
    if (!message) return;

    const history = getHistory();

    history.push({
        role,
        message: cleanText(message),
        time: new Date().toISOString()
    });

    setHistory(history);
    renderHistory();
}

// =====================================
// RENDER HISTORY SIDEBAR
// =====================================

function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    const history = getHistory().slice().reverse();

    historyList.innerHTML = "";

    for (const item of history) {
        if (!item?.message) continue;

        const div = document.createElement("div");
        div.className = "history-item";
        div.textContent = item.message;

        div.onclick = () => {
            const input = document.getElementById("query");
            if (input) input.value = item.message;
        };

        historyList.appendChild(div);
    }
}

// =====================================
// LOAD HISTORY
// =====================================

function loadChatHistory() {
    renderHistory();
}

// =====================================
// APPEND MESSAGE (WITH KATEX SUPPORT)
// =====================================

function appendMessage(role, text, useMarkdown = false) {

    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const div = document.createElement("div");
    div.className = `msg ${role}`;

    let clean = cleanText(text);

    // FIX: ensure KaTeX compatibility
    clean = clean
        .replace(/\\\[/g, "$$")
        .replace(/\\\]/g, "$$");

    if (useMarkdown && typeof marked !== "undefined") {
        div.innerHTML = marked.parse(clean, {
            breaks: true,
            gfm: true
        });
    } else {
        div.textContent = clean;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // RENDER MATH AFTER INSERT
    if (typeof renderMathInElement === "function") {
        renderMathInElement(div, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
            ],
            throwOnError: false
        });
    }

    return div;
}

// =====================================
// SEND MESSAGE
// =====================================

async function sendMessage() {

    const input = document.getElementById("query");
    const chatBox = document.getElementById("chatBox");
    const sendBtn = document.getElementById("sendBtn");

    if (!input || !chatBox) return;

    const message = cleanText(input.value);
    if (!message) return;

    if (sendBtn) sendBtn.disabled = true;

    appendMessage("user", message);
    saveHistory("user", message);

    input.value = "";

    const typing = appendMessage("bot", "🤖 Thinking...");

    try {

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        let token = localStorage.getItem("token");
        token = typeof token === "string" ? token.trim() : "guest";
        if (!token) token = "guest";

        const response = await fetch(`${BASE_URL}/ai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await response.json().catch(() => ({}));

        typing.remove();

        const reply = cleanText(data.reply || data.message || "No response received.");

        if (response.ok) {
            appendMessage("bot", reply, true);
            saveHistory("ai", reply);
        } else {
            appendMessage("bot", data.message || "AI service error");
        }

    } catch (error) {

        typing.remove();

        appendMessage(
            "bot",
            error.name === "AbortError"
                ? "⏱ Request timed out"
                : "⚠ Unable to connect to server"
        );

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

        const token = localStorage.getItem("token") || "guest";

        const response = await fetch(`${BASE_URL}/media/upload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            alert(result.message || "Upload failed");
            return false;
        }

        alert("✅ Upload successful");
        return true;

    } catch (error) {
        console.error(error);
        alert("⚠ Server not reachable");
        return false;
    }
}

// =====================================
// ENTER KEY SUPPORT
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("query");

    if (input) {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    renderHistory();
});

// =====================================
// PDF DOWNLOAD
// =====================================

function convertFormula(text) {

    return text
        .replace(/\$\$(.*?)\$\$/g, "$1")   // remove $$ $$ wrapper
        .replace(/\\frac{(.*?)}{(.*?)}/g, "($1 / $2)") // fraction fix
        .replace(/\\sqrt{(.*?)}/g, "sqrt($1)"); // sqrt fix
}

function downloadPDF() {

    const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;

    if (!jsPDFClass) {
        alert("⚠ PDF library not loaded");
        return;
    }

    const history = getHistory();

    if (!history.length) {
        alert("ℹ No chat history found");
        return;
    }

    const doc = new jsPDFClass();

    let y = 15;
    const margin = 15;
    const pageHeight = doc.internal.pageSize.height;
    const width = doc.internal.pageSize.width - margin * 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    for (const item of history) {

        if (!item?.message) continue;

        const prefix = item.role === "user" ? "User: " : "AI: ";

        // 🔥 FIX FORMULA FOR PDF
        const cleaned = convertFormula(cleanText(item.message));

        const textLines = doc.splitTextToSize(prefix + cleaned, width);

        for (const line of textLines) {

            if (y > pageHeight - margin) {
                doc.addPage();
                y = 15;
            }

            doc.text(line, margin, y);
            y += 6;
        }

        y += 4;
    }

    doc.save(`chat-history-${new Date().toISOString().slice(0, 10)}.pdf`);
}