// ======================================
// HOME DASHBOARD CACHE
// ======================================

let homeDashboardHTML = "";

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

    protect("admin");

    const container =
        document.getElementById("dynamicContent");

    if (container) {
        homeDashboardHTML = container.innerHTML;
    }

    loadSection("home");
}
// ======================================
//   Load Dashboard Home page
// ======================================
async function loadDashboard() {

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/admin-overview`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        console.log("📊 Dashboard Data:", data);

        if (!data.success) {
            console.warn("Dashboard API failed");
            return;
        }

        // ======================================
        // SAFE DOM HELPER
        // ======================================
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        // ======================================
        // MAIN STATS (SAFE UPDATES)
        // ======================================
        setText("adminWelcome", `Welcome ${data.adminName || "Admin"} 👋`);

        setText("totalStudents", data.stats?.students || 0);
        setText("totalFaculty", data.stats?.faculty || 0);
        setText("totalManagement", data.stats?.management || 0);
        setText("totalBatches", data.stats?.batches || 0);

        setText(
            "totalRevenue",
            `₹${Number(data.stats?.revenue || 0).toLocaleString()}`
        );

        setText(
            "pendingRegistrations",
            data.stats?.pending_registrations || 0
        );

        // ======================================
        // THOUGHT OF THE DAY (SAFE)
        // ======================================
        const thoughtEl = document.getElementById("thoughtText");

        if (thoughtEl) {
            thoughtEl.innerText =
                data.thought || "Stay focused and never stop learning.";
        }

        // ======================================
        // REGISTRATION DASHBOARD INIT
        // ======================================
        if (typeof initializeRegistrationDashboard === "function") {
            initializeRegistrationDashboard();
        }

    } catch (err) {
        console.error("❌ Dashboard Load Error:", err);
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
  
// ================Home section=========================
  if (section === "home") {
    console.log("🏠 Loading Home Dashboard");
    document.querySelectorAll(".side-btn")
      .forEach(btn => btn.classList.remove("active"));

    document
      .querySelector('.side-btn[onclick*="home"]')
      ?.classList.add("active");
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

// ======================================
// REGISTRATION MANAGEMENT (FIXED)
// ======================================

let registrationData = [];
let batchData = [];

// ======================================
// LOAD REGISTRATIONS
// ======================================

async function loadRegistrations() {

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/registration-requests`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        if (!data?.success) return;

        registrationData = data.registrations || [];

        renderRegistrationTable();

    } catch (err) {
        console.error("Registration Load Error", err);
    }
}

// ======================================
// LOAD BATCHES (FIXED)
// ======================================

async function loadBatchList() {

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/batches`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        // ✅ FIX: extract correct array safely
        batchData = data?.batches || data || [];

    } catch (err) {
        console.error("Batch Load Error", err);
        batchData = [];
    }
}

// ======================================
// IMAGE HELPER (FIXED)
// ======================================

function getImageUrl(photo) {

    if (!photo) return "images/default-user.png";

    const cleanPath = String(photo)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    return `http://127.0.0.1:5000/${cleanPath}`;
}

// ======================================
// RENDER TABLE (FIXED SAFE VERSION)
// ======================================

function renderRegistrationTable() {

    const tbody = document.getElementById("registrationTableBody");
    if (!tbody) return;

    if (!registrationData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">No Registrations Found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = registrationData.map(reg => {

        // ✅ SAFE batch options
        const batchOptions = (batchData || []).map(batch => `
            <option value="${batch._id}">
                ${batch.code || batch.name || "Batch"}
            </option>
        `).join("");

        const photoUrl = getImageUrl(reg.photo);

        return `
        <tr>

            <td>
                <img
                    src="${photoUrl}"
                    width="60"
                    height="60"
                    loading="lazy"
                    alt="${reg.name || 'Student'}"
                    style="
                        border-radius:50%;
                        object-fit:cover;
                        border:2px solid #a746e7;
                        background:#f5f5f5;
                    "
                    onerror="this.src='images/default-user.png'"
                >
            </td>

            <td>${reg.name || "-"}</td>
            <td>${reg.mobile || "-"}</td>
            <td>${reg.email || "-"}</td>
            <td>${reg.course || "-"}</td>
            <td>${reg.status || "Pending"}</td>

            <td>
                <select id="batch_${reg._id}">
                    <option value="">Select Batch</option>
                    ${batchOptions}
                </select>
            </td>

            <td>
                <button onclick="approveRegistration('${reg._id}')">
                    Approve
                </button>

                <button onclick="rejectRegistration('${reg._id}')">
                    Reject
                </button>

                <button onclick="deleteRegistration('${reg._id}')" style="background:red;color:white;margin-left:5px;">
                    Delete
                </button>
            </td>

        </tr>
        `;
    }).join("");

    console.log(`✅ Table loaded: ${registrationData.length}`);
}

// ======================================
// APPROVE (UNCHANGED BUT SAFE)
// ======================================

async function approveRegistration(id) {

    const batchId = document.getElementById(`batch_${id}`)?.value;

    if (!batchId) {
        alert("Please Select Batch");
        return;
    }

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/approve-registration/${id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ batch_id: batchId })
            }
        );

        const data = await res.json();

        alert(data.message);

        loadRegistrations();
        loadDashboard();

    } catch (err) {
        console.error("Approve Error", err);
    }
}

// ======================================
// REJECT
// ======================================

async function rejectRegistration(id) {

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/reject-registration/${id}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        alert(data.message);

        loadRegistrations();
        loadDashboard();

    } catch (err) {
        console.error("Reject Error", err);
    }
}

// ======================================
// DELETE
// ======================================

async function deleteRegistration(id) {

    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {

        const res = await fetch(
            `${window.BASE_URL}/dashboard/delete-registration/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await res.json();

        alert(data.message);

        loadRegistrations();
        loadDashboard();

    } catch (err) {
        console.error("Delete Error:", err);
    }
}
// ======================================
// EXCEL EXPORT WITH PHOTOS (FIXED)
// ======================================

async function downloadRegistrationExcel() {

    if (!registrationData.length) {
        alert("No Data Found");
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Registrations");

        worksheet.columns = [
            { header: "Photo", key: "photo", width: 15 },
            { header: "Name", key: "name", width: 25 },
            { header: "Mobile", key: "mobile", width: 20 },
            { header: "Email", key: "email", width: 35 },
            { header: "Course", key: "course", width: 20 },
            { header: "Status", key: "status", width: 15 }
        ];

        for (const reg of registrationData) {

            const addedRow = worksheet.addRow({
                photo: "",
                name: reg.name || "",
                mobile: reg.mobile || "",
                email: reg.email || "",
                course: reg.course || "",
                status: reg.status || ""
            });

            const rowNumber = addedRow.number;

            // row styling
            addedRow.height = 60;
            addedRow.alignment = { vertical: "middle", horizontal: "left" };

            // =========================
            // PHOTO HANDLING (FIXED)
            // =========================
            if (reg.photo) {
                try {

                    const cleanPath = String(reg.photo)
                        .replace(/\\/g, "/")
                        .replace(/^\/+/, "");

                    const imageUrl = `http://127.0.0.1:5000/${cleanPath}`;

                    console.log("📸 Fetching:", imageUrl);

                    const response = await fetch(imageUrl);

                    if (!response.ok) {
                        throw new Error(`Image Not Found (${response.status})`);
                    }

                    // IMPORTANT FIX: correct binary handling
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = new Uint8Array(arrayBuffer);

                    const contentType = response.headers.get("content-type") || "";

                    let extension = "jpeg";
                    if (contentType.includes("png")) extension = "png";
                    else if (contentType.includes("gif")) extension = "gif";
                    else if (contentType.includes("jpg") || contentType.includes("jpeg")) extension = "jpeg";

                    const imageId = workbook.addImage({
                        buffer,
                        extension
                    });

                    // IMPORTANT FIX: use `ext` instead of br (stable rendering)
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: rowNumber - 1 },
                        ext: { width: 60, height: 60 }
                    });

                } catch (err) {
                    console.error("❌ Failed Photo:", reg.name, err);
                }
            }
        }

        // ======================
        // EXPORT FILE
        // ======================
        const excelBuffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }),
            "register_students.xlsx"
        );

        console.log("✅ Excel Generated Successfully");

    } catch (err) {
        console.error("Excel Export Error:", err);
        alert("Failed to generate Excel");
    }
}
// ======================================
// LOAD ON DASHBOARD
// ======================================

async function initializeRegistrationDashboard() {

    await loadBatchList();

    await loadRegistrations();

}

// ============Global Scope Functions (for sections to call)===========
window.initializeDashboard = initializeDashboard;
window.onload = initializeDashboard;;
window.loadSection = loadSection;
window.toggleMenu = toggleMenu;
window.logout = logout;
window.navigateTo = navigateTo;
window.loadSection = loadSection;
