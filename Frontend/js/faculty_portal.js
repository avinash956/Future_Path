console.log("🚀 Faculty Portal Loaded");

window.BASE_URL = window.BASE_URL || "http://127.0.0.1:5000";
const token = () => localStorage.getItem("token");
const name = localStorage.getItem("name");

// =========================
// INIT
// =========================
function loadFacultyDashboard() {
    loadSection("home");
}

// =========================
// ROUTER (UPDATED)
// =========================
function loadSection(section) {

    const container = document.getElementById("dynamicContent");
    if (!container) return;

    switch (section) {

        // =========================
        // HOME DASHBOARD (NEW)
        // =========================
        case "home":
            container.innerHTML = `
                <div class="faculty-home">

                    <h2 class="greet">👋 Welcome, ${name || "Faculty"}</h2>

                    <div class="home-grid">

                        <div class="glass-card">
                            <h3>📚 My Batches</h3>
                            <div id="homeBatches">Loading...</div>
                        </div>

                        <div class="glass-card">
                            <h3>🎥 Upcoming Live Classes</h3>
                            <div id="homeLive">Loading...</div>
                        </div>

                    </div>

                </div>
            `;

            loadHomeBatches();
            loadUpcomingLive();
            break;

        // =========================
        // EXISTING SECTIONS
        // =========================
        case "batch":
            container.innerHTML = `
                <div class="page-title">📚 My Batches</div>
                <div id="facultyBatchList" class="grid"></div>
            `;
            loadFacultyBatches();
            break;

        case "student":
            container.innerHTML = `<div class="card">Select a batch</div>`;
            break;

        case "materials":
            container.innerHTML = `
                <div class="page-title">📘 Materials</div>
                <div id="materialsList"></div>
            `;
            initializeNotesVideo();
            break;

        case "live":
            container.innerHTML = `
                <div class="page-title">🎥 Live Classes</div>
                <div id="liveList"></div>
            `;
            initializeLiveStream();
            break;
    }
}

// =========================
// HOME → BATCHES
// =========================
async function loadHomeBatches() {

    const container = document.getElementById("homeBatches");

    try {
        const res = await fetch(
            `${window.BASE_URL}/faculty_portal/batches`,
            {
                headers: { Authorization: `Bearer ${token()}` }
            }
        );

        const data = await res.json();

        if (!data.success || !data.batches.length) {
            container.innerHTML = `<p>No batches assigned</p>`;
            return;
        }

        container.innerHTML = "";

        data.batches.forEach(b => {
            container.innerHTML += `
                <div class="mini-card" onclick="openBatchDashboard('${b._id}')">
                    <h4>${b.name}</h4>
                    <p>📌 ${b.code}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>Error loading batches</p>`;
    }
}

// =========================
// HOME → UPCOMING LIVE
// =========================
async function loadUpcomingLive() {

    const container = document.getElementById("homeLive");

    try {
        const res = await fetch(
            `${window.BASE_URL}/faculty_portal/live/upcoming`,
            {
                headers: { Authorization: `Bearer ${token()}` }
            }
        );

        const data = await res.json();

        if (!data.success || !data.classes.length) {
            container.innerHTML = `<p>No upcoming classes</p>`;
            return;
        }

        container.innerHTML = "";

        data.classes.forEach(c => {
            container.innerHTML += `
                <div class="mini-card">
                    <h4>${c.title}</h4>
                    <p>🕒 ${c.date} - ${c.time}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>Error loading live classes</p>`;
    }
}

// =========================
// EXISTING FUNCTIONS (UNCHANGED BELOW)
// =========================

async function loadFacultyBatches() {
    const container = document.getElementById("facultyBatchList");

    try {
        const res = await fetch(
            `${window.BASE_URL}/faculty_portal/batches`,
            {
                headers: { Authorization: `Bearer ${token()}` }
            }
        );

        const data = await res.json();

        container.innerHTML = "";

        if (!data.success || !data.batches.length) {
            container.innerHTML = `<div class="card">No batches found</div>`;
            return;
        }

        data.batches.forEach(b => {
            container.innerHTML += `
                <div class="glass-card" onclick="openBatchDashboard('${b._id}')">
                    <h3>${b.name}</h3>
                    <p>📌 Code: ${b.code}</p>
                    <p>👥 Students: ${b.strength || 0}</p>
                    <button>Open Batch</button>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// =========================
// EXPORT GLOBALS
// =========================
window.loadFacultyDashboard = loadFacultyDashboard;
window.loadSection = loadSection;
window.openBatchDashboard = openBatchDashboard;
window.loadStudents = loadStudents;
window.loadAttendance = loadAttendance;
window.saveAttendance = saveAttendance;
window.loadAttendanceHistory = loadAttendanceHistory;
window.downloadAttendance = downloadAttendance;
window.loadBatchMaterials = loadBatchMaterials;
window.loadBatchLive = loadBatchLive;