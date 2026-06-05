// ======================================
// MANAGEMENT SECURITY + SYSTEM CONTROL
// ======================================

window.BASE_URL = window.BASE_URL || "http://127.0.0.1:5000";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const name = localStorage.getItem("name");
const currentPage = window.location.pathname.toLowerCase();

// ==============================================================
// GLOBAL AUTH FETCH to connect portal page to sections pages
// ===============================================================

window.authFetch = async function(url, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    return fetch(url, {
        ...options,
        headers
    });
};
// ==============================================================
// ==============================================================
console.log("🔐 Token:", token);
console.log("👤 Role:", role);


// ======================================
// SAFE TOKEN CHECK (FIXED)
// ======================================

function isValidToken(t) {
  return t && t !== "undefined" && t !== "null";
}

function safeRedirect(msg) {
  alert(msg);
  window.location.href = "login.html";
}

if (!isValidToken(token)) {
  safeRedirect("Please Login First");
}


// ======================================
// ROLE BASED SECURITY (SAFE FIX)
// ======================================

if (currentPage.includes("management_portal.html")) {
  if (role !== "management" && role !== "admin") {
    safeRedirect("Management Access Required");
  }
}

// ======================================
// PROTECT FUNCTION (UNCHANGED STYLE)
// ======================================

function protect(requiredRole) {
  if (!isValidToken(token)) {
    safeRedirect("Please Login First");
    return;
  }

  if (role !== requiredRole && role !== "management" && role !== "admin") {
    safeRedirect("Access Denied");
  }
}


// ======================================
// LOGOUT
// ======================================

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}


// ======================================
// MANAGEMENT STATS (FIXED SAFE CALL)
// ======================================

async function loadManagementDashboard() {

  try {

    console.log("📡 Loading management stats...");

    if (!isValidToken(token)) return;

    const res = await fetch(`${window.BASE_URL}/management_portal/stats`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("📡 Status:", res.status);

    const text = await res.text();
    console.log("📨 RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Invalid JSON:", text);
      return;
    }

    if (!res.ok) {
      console.error("❌ Management Dashboard Error:", data.message || data);
      return;
    }

    document.getElementById("studentCount") &&
      (document.getElementById("studentCount").innerText = data.students || 0);

    document.getElementById("facultyCount") &&
      (document.getElementById("facultyCount").innerText = data.faculty || 0);

    document.getElementById("userCount") &&
      (document.getElementById("userCount").innerText = data.users || 0);

  } catch (err) {

    console.error("❌ Management Dashboard API failed:", err);

  }
}


// ======================================
// AUTO LOAD DASHBOARD
// ======================================

if (currentPage.includes("management_portal.html")) {
  window.addEventListener("DOMContentLoaded", loadManagementDashboard);
}


// ======================================
// MEDIA UPLOAD (SAFE)
// ======================================

async function uploadMedia(formData) {

  try {

    if (!isValidToken(token)) {
      safeRedirect("Session expired");
      return;
    }

    const res = await fetch(`${window.BASE_URL}/media/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const text = await res.text();

    console.log("📨 Upload Response:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      alert("Invalid server response");
      return;
    }

    if (!res.ok) {
      alert(data.message || "Upload failed");
      return;
    }

    alert("Media uploaded successfully!");

    return data;

  } catch (err) {

    console.error("❌ Media upload error:", err);

    alert("Server error during media upload");
  }
}


// ======================================
// QUICK ACTIONS
// ======================================

function openProfile() {
  alert("Profile feature can be connected later");
}

function uploadPhoto() {
  alert("Connect this with /api/media/upload route");
}


// ======================================
// INITIALIZE DASHBOARD
// ======================================

function initializeDashboard() {
  protect('admin');
  loadSection('management');
}


// ======================================
// MENU TOGGLE
// ======================================

function toggleMenu() {

  const dropdown = document.getElementById('dropdownMenu');

  dropdown?.classList.toggle('active');

}

// ======================================
// CLOSE MENU OUTSIDE CLICK
// ======================================

document.addEventListener("click", function (e) {

  const menu = document.getElementById("dropdownMenu");

  const btn = document.querySelector(".menu-toggle");

  if (
    menu &&
    btn &&
    !menu.contains(e.target) &&
    !btn.contains(e.target)
  ) {
    menu.classList.remove("active");
  }

});

// ======================================
// LOAD SECTION
// ======================================

async function loadSection(section) {

  console.log("📂 Requested Section:", section);

  if (!isValidToken(token)) {
    safeRedirect("Session expired");
    return;
  }

  const container = document.getElementById('dynamicContent');

  if (!container) {
    console.error("❌ dynamicContent container not found");
    return;
  }

  // ======================================
  // ACTIVE SIDEBAR BUTTON
  // ======================================

  document.querySelectorAll(".side-btn")
    .forEach(btn => btn.classList.remove("active"));

  const activeBtn = Array.from(
    document.querySelectorAll(".side-btn")
  ).find(btn =>
    btn.getAttribute("onclick")?.includes(section)
  );

  activeBtn?.classList.add("active");

  // ======================================
  // FACULTY / STUDENT / BATCH
  // ======================================

  if (['faculty', 'student', 'batch'].includes(section)) {

    try {

      console.log(`📂 Loading ${section} section...`);

      const response = await fetch(`sections/${section}.html`);

      if (!response.ok) {
        throw new Error(`Missing ${section}.html`);
      }

      const html = await response.text();

      container.innerHTML = html;

      console.log(`✅ ${section}.html loaded into DOM`);
      
      if (section === 'faculty' && typeof initializeFaculty === 'function') {
        console.log("🔥 MANAGEMENT.JS CALLING initializeFaculty");
        initializeFaculty();
      }

      if (section === 'student' && typeof initializeStudent === 'function') {
        console.log("🎓 Initializing Student Module...");
        initializeStudent();
      }

      if (section === 'batch' && typeof initializeBatch === 'function') {
        console.log("🧩 Initializing Batch Module...");
        initializeBatch();
      }

    } catch (err) {

      console.error("❌ Section Load Error:", err);

      container.innerHTML = `
        <div style="color:red;padding:20px;">
          Failed to load section
        </div>
      `;
    }
  }

  // ======================================
  // FEES SECTION (FIXED PLACEMENT)
  // ======================================

  else if (section === 'fees') {

    try {

      console.log("📂 Loading fees section...");

      const response = await fetch('sections/fees.html');

      if (!response.ok) {
        throw new Error("Missing fees.html");
      }

      const html = await response.text();

      container.innerHTML = html;

      console.log("✅ fees.html loaded into DOM");

      if (typeof initializeFees === "function") {
        console.log("💰 Initializing Fees Module...");
        initializeFees();
      }

    } catch (err) {

      console.error("❌ Fees Load Error:", err);

      container.innerHTML = `
        <div style="color:red;padding:20px;">
          Failed to load Fees section
        </div>
      `;
    }
  }
}
// ======================================
// NAVIGATION
// ======================================

function navigateTo(page) {
  window.location.href = page;
}