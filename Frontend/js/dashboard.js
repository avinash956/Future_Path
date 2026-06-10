// ======================================
// DASHBOARD SECURITY + SYSTEM CONTROL
// ======================================

window.BASE_URL = window.BASE_URL || "http://127.0.0.1:5000";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const name = localStorage.getItem("name");

const currentPage = window.location.pathname.toLowerCase();

console.log("🔐 Token:", token);
console.log("👤 Role:", role);
console.log("👤 Name:", name);

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

if (
  !isValidToken(token) &&
  !currentPage.includes("login.html")
) {
  safeRedirect("Please Login First");
}


// ======================================
// ROLE BASED SECURITY (SAFE FIX)
// ======================================

if (currentPage.includes("dashboard.html")) {
  if (role !== "admin") {
    safeRedirect("Admin Access Required");
  }
}

if (currentPage.includes("faculty.html")) {
  if (role !== "faculty" && role !== "admin") {
    safeRedirect("Faculty Access Required");
  }
}

if (currentPage.includes("student.html")) {
  if (role !== "student" && role !== "admin") {
    safeRedirect("Student Access Required");
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

  if (role !== requiredRole && role !== "admin") {
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
// DASHBOARD STATS (FIXED SAFE CALL)
// ======================================

async function loadDashboardStats() {

  try {

    console.log("📡 Loading dashboard stats...");

    if (!isValidToken(token)) return;

    const res = await fetch(`${window.BASE_URL}/dashboard/stats`, {
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
      console.error("❌ Dashboard Error:", data.message || data);
      return;
    }

    document.getElementById("studentCount") &&
      (document.getElementById("studentCount").innerText = data.students || 0);

    document.getElementById("facultyCount") &&
      (document.getElementById("facultyCount").innerText = data.faculty || 0);

    document.getElementById("userCount") &&
      (document.getElementById("userCount").innerText = data.users || 0);

  } catch (err) {

    console.error("❌ Dashboard API failed:", err);

  }
}


// ======================================
// AUTO LOAD DASHBOARD
// ======================================

if (currentPage.includes("dashboard.html")) {
  window.addEventListener("DOMContentLoaded", loadDashboardStats);
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
  loadSection('home');
}
// ======================================
//   Load Dashboard Home page by default
// ======================================
async function loadDashboard() {

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/admin-overview`,
            {
                headers: {
                    Authorization:
                    `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        console.log(data);

        if (!data.success) {
            return;
        }

        document.getElementById(
            "adminWelcome"
        ).innerText =
        `Welcome ${data.adminName} 👋`;

        document.getElementById("totalStudents").innerText = data.stats.students || 0;

        document.getElementById("totalFaculty").innerText = data.stats.faculty || 0;

        document.getElementById("totalManagement").innerText = data.stats.management || 0;

        document.getElementById("totalBatches").innerText = data.stats.batches || 0;

        document.getElementById("totalRevenue").innerText =`₹${Number(data.stats.revenue || 0).toLocaleString()}`;

        console.log("Thought:", data.thought);
        console.log("Element:", document.getElementById("thoughtText"));
     const thoughtEl =
document.getElementById("thoughtText");

if (thoughtEl) {
    thoughtEl.innerText =
        data.thought ||
        "Stay focused and never stop learning.";
}

    } catch (err) {

        console.error(
            "Dashboard Load Error:",
            err
        );

    }
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
  if (section === "home") {

    console.log("🏠 Loading Home Dashboard");

    if (typeof loadDashboard === "function") {
        loadDashboard();
    }

    return;
}

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
  // MANAGEMENT SECTION
  // ======================================

  if (section === 'management') {

    try {

      console.log("📂 Loading management section...");

      const response = await fetch('sections/management.html');

      if (!response.ok) {
        throw new Error("Missing management.html");
      }

      const html = await response.text();

      container.innerHTML = html;

      console.log("✅ management.html loaded");

          setTimeout(() => {
              if (typeof window.initializeManagement === 'function') {
                  console.log("🚀 initializeManagement found, executing...");
                  window.initializeManagement();
              } else {
                  console.error("❌ initializeManagement STILL not found");
                  console.log("👉 Available window functions:", Object.keys(window));
              }
          }, 50);

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
  // FACULTY / STUDENT / BATCH
  // ======================================

  else if (['faculty', 'student', 'batch'].includes(section)) {

    try {

      console.log(`📂 Loading ${section} section...`);

      const response = await fetch(`sections/${section}.html`);

      if (!response.ok) {
        throw new Error(`Missing ${section}.html`);
      }

      const html = await response.text();

      container.innerHTML = html;

      console.log(`✅ ${section}.html loaded into DOM`);

        if (
    section === "faculty" &&
    typeof initializeFaculty === "function"
) {
    console.log("🔥 DASHBOARD.JS CALLING initializeFaculty");
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


// ======================================
// MATERIALS SECTION
// ======================================

else if (section === 'materials') {

    try {

        console.log("📂 Loading materials section...");

        const response = await fetch('sections/notes_video.html');

        if (!response.ok) {
            throw new Error("Missing notes_video.html");
        }

        const html = await response.text();

        container.innerHTML = html;

        console.log("✅ notes_video.html loaded");

        if (typeof initializeNotesVideo === "function") {
            console.log("📚 Initializing Notes & Video Module...");
            initializeNotesVideo();
        }

    } catch (err) {

        console.error("❌ Materials Load Error:", err);

        container.innerHTML = `
            <div style="color:red;padding:20px;">
                Failed to load Materials section
            </div>
        `;
    }
}
// ======================================
// LIVE STREAM SECTION
// ======================================

else if (section === "live_stream") {

    try {

        console.log("📂 Loading live stream section...");

        const response = await fetch("sections/live_streaming.html");

        if (!response.ok) {
            throw new Error("Missing live_streaming.html");
        }

        const html = await response.text();

        container.innerHTML = html;

        console.log("✅ live_streaming.html loaded");

        setTimeout(() => {

            if (typeof window.initializeLiveStream === "function") {

                console.log("🎥 Initializing Live Stream Module...");

                window.initializeLiveStream();

            } else {

                console.error("❌ initializeLiveStream function not found");

                container.innerHTML = `
                    <div style="padding:20px;color:red;">
                        Live Streaming JS not loaded.
                    </div>
                `;
            }

        }, 100);

    } catch (err) {

        console.error("❌ Live Stream Load Error:", err);

        container.innerHTML = `
            <div style="padding:20px;color:red;">
                Failed to load Live Streaming section
            </div>
        `;
    }
  }
}

console.log("✅ dashboard.js loaded");
console.log("✅ loadSection =", typeof loadSection);
// ======================================
// NAVIGATION
// ======================================

function navigateTo(page) {
  window.location.href = page;
}

// ============Global Scope Functions (for sections to call)===========
window.initializeDashboard = initializeDashboard;
window.onload = initializeDashboard;;
window.loadSection = loadSection;
window.toggleMenu = toggleMenu;
window.logout = logout;
window.navigateTo = navigateTo;
window.loadSection = loadSection;

