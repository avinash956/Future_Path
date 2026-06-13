// ======================================
// MANAGEMENT PORTAL CORE CONTROLLER (UPDATED)
// ======================================

window.BASE_URL = window.BASE_URL || "http://127.0.0.1:5000";

// ==========================
// AUTH DATA
// ==========================
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const name = localStorage.getItem("name");
const currentPage = window.location.pathname.toLowerCase();

// ==========================
// TOKEN VALIDATION
// ==========================
function isValidToken(t) {
  return t && t !== "undefined" && t !== "null";
}

function safeRedirect(msg) {
  alert(msg);
  window.location.href = "login.html";
}

// FORCE LOGIN CHECK
if (!isValidToken(token)) {
  safeRedirect("Please Login First");
}

// ROLE CHECK
if (role !== "management" && role !== "admin") {
  safeRedirect("Management Access Required");
}

// ==========================
// GLOBAL AUTH FETCH
// ==========================
window.authFetch = async function (url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ==========================
// LOAD DASHBOARD STATS
// ==========================
async function loadManagementDashboard() {
  try {

    const res = await fetch(`${window.BASE_URL}/management_portal/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("📊 STATS RESPONSE:", data);

    if (!res.ok) {
      console.error("Stats API failed:", res.status);
      return;
    }

    // STUDENTS
    const studentEl = document.getElementById("studentCount");
    if (studentEl) studentEl.innerText = data.students || 0;

    // FACULTY
    const facultyEl = document.getElementById("facultyCount");
    if (facultyEl) facultyEl.innerText = data.faculty || 0;

    // BATCHES
    const batchEl = document.getElementById("batchCount");
    if (batchEl) batchEl.innerText = data.batches || 0;

    // ACTIVE INFO (optional use)
    const activeStudentEl = document.getElementById("activeStudentCount");
    if (activeStudentEl) activeStudentEl.innerText = data.active_students || 0;

    const activeFacultyEl = document.getElementById("activeFacultyCount");
    if (activeFacultyEl) activeFacultyEl.innerText = data.active_faculty || 0;

    // ==========================
    // MANAGEMENT COUNT (FIXED SAFE LOGIC)
    // ==========================
    const userEl = document.getElementById("userCount");

    const managementCount =
      data.management ??
      data.users ??
      data.admin ??
      data.admins ??
      0;

    if (userEl) userEl.innerText = managementCount;

  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// ==========================
// LOAD SECTION SYSTEM
// ==========================
async function loadSection(section) {

  const container = document.getElementById("dynamicContent");

  if (!container) {
    console.error("dynamicContent not found");
    return;
  }

  // ACTIVE BUTTON UI
  document.querySelectorAll(".side-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  const activeBtn = Array.from(document.querySelectorAll(".side-btn"))
    .find(btn => btn.getAttribute("onclick")?.includes(section));

  activeBtn?.classList.add("active");

  // ==========================
  // HOME DASHBOARD
  // ==========================
  if (section === "home") {

    container.innerHTML = `
      <div class="dashboard-home">

        <h2 id="greetingText">👋 Welcome</h2>

        <div class="stats-grid">

          <div class="stat-card">
            <i class="fa-solid fa-user-graduate"></i>
            <h3>Total Students</h3>
            <p id="studentCount">0</p>
          </div>

          <div class="stat-card">
            <i class="fa-solid fa-chalkboard-user"></i>
            <h3>Total Faculty</h3>
            <p id="facultyCount">0</p>
          </div>

          <div class="stat-card">
            <i class="fa-solid fa-user-tie"></i>
            <h3>Total Management</h3>
            <p id="userCount">0</p>
          </div>

          <div class="stat-card">
            <i class="fa-solid fa-layer-group"></i>
            <h3>Total Batches</h3>
            <p id="batchCount">0</p>
          </div>

        </div>

      </div>
    `;

    const greet = document.getElementById("greetingText");
    if (greet) {
      greet.innerText = `👋 Welcome, ${name || "Admin"}`;
    }

    loadManagementDashboard();
    return;
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

// ==========================
// AUTO LOAD HOME
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  loadSection("home");
});

// ==========================
// MENU TOGGLE
// ==========================
function toggleMenu() {
  document.getElementById("dropdownMenu")?.classList.toggle("active");
}

// CLOSE MENU OUTSIDE CLICK
document.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  const btn = document.querySelector(".menu-toggle");

  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove("active");
  }
});

// ==========================
// NAVIGATION HELPER
// ==========================
function navigateTo(page) {
  window.location.href = page;
}