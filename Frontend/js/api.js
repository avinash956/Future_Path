// =====================================
// BASE API URL
// =====================================

const BASE_URL ="http://127.0.0.1:5000/api";
window.BASE_URL = BASE_URL; // Make it globally accessible; 
//check rest code for usage of window.BASE_URL instead of hardcoded URLs
// =====================================
// SAFE SEND MESSAGE (AI CHAT)
// =====================================

async function sendMessage() {

  const input =
  document.getElementById("query");

  // SAFETY CHECK
  if (!input) {

    console.error(
      "❌ ERROR: #query not found"
    );

    return;
  }

  const message =
  input.value.trim();

  if (!message) return;

  const chatBox =
  document.getElementById(
    "chatBox"
  );

  // =====================================
  // USER MESSAGE
  // =====================================

  const userMsg =
  document.createElement("div");

  userMsg.className =
  "msg user";

  userMsg.innerText =
  message;

  if (chatBox) {

    chatBox.appendChild(userMsg);
    
    // ADDED: Auto-scroll window down instantly for user message
    chatBox.scrollTop = chatBox.scrollHeight;

  }

  input.value = "";

  // ADDED: Call the local storage history saver function from your HTML
  if (typeof saveHistory === "function") {
    saveHistory(message);
  }

  try {

    // =====================================
    // BACKEND AI API
    // =====================================

    const headers = {
      "Content-Type": "application/json"
    };

    // ✔ FIX ONLY HERE (DO NOT send empty token)
    let token = localStorage.getItem("token");

    // FIXED: Clean up the token string in case it was stored with wrapped quotes
    if (token) {
      token = token.replace(/^["']|["']$/g, '');
    }

    if (token) {
      headers["Authorization"] =
      `Bearer ${token}`;
    } else {
      // FALLBACK PROTECTION: If no login token exists in localStorage, 
      // pass a standard guest declaration string so your auth_middleware 
      // can gracefully process it without crashing with an invalid status code
      headers["Authorization"] = "Bearer guest";
    }

    const response =
    await fetch(

      `${ window.BASE_URL}/ai/chat`,

      {

        method: "POST",

        headers: headers,

        body: JSON.stringify({
          message
        })

      }

    );

    const data =
    await response.json();

    // =====================================
    // AI RESPONSE
    // =====================================

    const aiMsg =
    document.createElement("div");

    aiMsg.className ="msg bot";

    aiMsg.innerText =
    response.ok
    ? data.reply
    : (data.message || "AI Error");

    if (chatBox) {

      chatBox.appendChild(aiMsg);

      chatBox.scrollTop =
      chatBox.scrollHeight;

    }

  }
  catch (error) {

    console.error(
      "Backend Error:",
      error
    );

    if (chatBox) {

      const aiMsg =
      document.createElement("div");

      aiMsg.className =
      "msg bot";

      aiMsg.innerText =
      "Backend not reachable";

      chatBox.appendChild(aiMsg);
      
      // ADDED: Auto-scroll window down for error message
      chatBox.scrollTop = chatBox.scrollHeight;

    }

  }

}


// =====================================
// UPLOAD MEDIA (ADMIN / FACULTY)
// =====================================

async function uploadMedia(data) {

  try {

    const headers = {
      "Content-Type": "application/json"
    };

    const token = localStorage.getItem("token");

    if (token) {
      headers["Authorization"] =
      `Bearer ${token}`;
    }

    const response = await fetch(
      `${ window.BASE_URL}/media/upload`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Upload failed");
      return;
    }

    alert("Media uploaded successfully!");

  } catch (error) {

    console.error("Upload Error:", error);

    alert("Backend not reachable");

  }
}