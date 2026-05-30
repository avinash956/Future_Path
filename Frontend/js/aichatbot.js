let chatOpen = false;

function openChat() {
    chatOpen = true;
    document.getElementById("chat-box").style.display = "flex";
}

function closeChat() {
    chatOpen = false;
    document.getElementById("chat-box").style.display = "none";
}

// toggle only via icon
function toggleChat() {
    if (!chatOpen) openChat();
}

// send message
async function sendMessage() {
    const input = document.getElementById("user-msg");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    showTyping();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12 sec max

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message}),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await res.json();

        hideTyping();
        addMessage(data.reply, "ai");

    } catch (err) {
        hideTyping();
        addMessage("⚠ Slow response. Please try again.", "ai");
    }
}

// UI helpers
function addMessage(text, type) {
    const box = document.getElementById("chat-messages");

    const div = document.createElement("div");
    div.className = type === "user" ? "msg-user" : "msg-ai";
    div.innerText = text;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function showTyping() {
    document.getElementById("typing").style.display = "block";
}

function hideTyping() {
    document.getElementById("typing").style.display = "none";
}
