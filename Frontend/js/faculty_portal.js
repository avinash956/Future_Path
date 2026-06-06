console.log("🚀 Faculty Portal Loaded");

/* =========================================
BASE
========================================= */

window.BASE_URL = window.BASE_URL || "http://127.0.0.1:5000";
const token = () => localStorage.getItem("token");

/* =========================================
INIT
========================================= */

function loadFacultyDashboard() {
    loadSection("batch");
}

/* =========================================
ROUTER
========================================= */

function loadSection(section) {

    const container = document.getElementById("dynamicContent");
    if (!container) return;

    switch (section) {

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

/* =========================================
BATCHES
========================================= */

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

/* =========================================
BATCH DASHBOARD
========================================= */

function openBatchDashboard(batchId) {

    localStorage.setItem("selectedBatchId", batchId);

    document.getElementById("dynamicContent").innerHTML = `
        <div class="page-title">📊 Batch Dashboard</div>

        <div class="grid">

            <div class="glass-card" onclick="loadAttendance('${batchId}')">🧑‍🎓 Attendance</div>

            <div class="glass-card" onclick="loadBatchMaterials('${batchId}')">📘 Materials</div>

            <div class="glass-card" onclick="loadBatchLive('${batchId}')">🎥 Live</div>

            <div class="glass-card" onclick="loadStudents('${batchId}')">👥 Students</div>

        </div>

        <div id="batchContent"></div>
    `;
}

/* =========================================
STUDENTS
========================================= */

async function loadStudents(batchId) {

    const container = document.getElementById("batchContent");
    container.innerHTML = `<div class="card">Loading...</div>`;

    const res = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/students/${batchId}`,
        {
            headers: { Authorization: `Bearer ${token()}` }
        }
    );

    const data = await res.json();

    if (!data.success) {
        container.innerHTML = `<div class="card">${data.message}</div>`;
        return;
    }

    container.innerHTML = `
        <div class="page-title">👥 Students</div>
        <div id="studentList"></div>
    `;

    const list = document.getElementById("studentList");

    data.students.forEach(s => {
        list.innerHTML += `
            <div class="glass-card">
                <h4>${s.name}</h4>
                <p>${s.roll || ""}</p>
            </div>
        `;
    });
}

/* =========================================
ATTENDANCE
========================================= */

async function loadAttendance(batchId) {

    const container = document.getElementById("batchContent");
    container.innerHTML = `<div class="card">Loading...</div>`;

    const res = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/students/${batchId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
    );

    const data = await res.json();

    if (!data.success) {
        container.innerHTML = `<div class="card">Error loading students</div>`;
        return;
    }

    container.innerHTML = `
        <div class="page-title">🧑‍🎓 Attendance</div>

        <div class="action-bar">

            <button onclick="saveAttendance('${batchId}')">💾 Save</button>
            <button onclick="loadAttendanceHistory('${batchId}')">📊 History</button>
            <button onclick="downloadAttendance('${batchId}')">⬇ Excel</button>

        </div>

        <div id="attendanceList"></div>
    `;

    const list = document.getElementById("attendanceList");

    data.students.forEach(s => {
    list.innerHTML += `
        <div class="glass-card student-card">
            <h4>${s.name}</h4>
            <p>${s.roll || ""}</p>

            <label class="switch">
                <input type="checkbox"
                    class="attendanceToggle"
                    data-id="${s._id}"
                    checked>

                <span class="slider"></span>
            </label>

            <span class="status-text present">Present</span>
        </div>
    `;
});
document.addEventListener("change", function (e) {
    if (e.target.classList.contains("attendanceToggle")) {
        const card = e.target.closest(".student-card");
        const text = card.querySelector(".status-text");

        text.innerText = e.target.checked ? "Present" : "Absent";
    }
});
}

/* =========================================
SAVE ATTENDANCE
========================================= */

async function saveAttendance(batchId) {

    const attendance = [];

    document.querySelectorAll(".attendanceToggle").forEach(t => {
        attendance.push({
            studentId: t.dataset.id,
            status: t.checked ? "Present" : "Absent"
        });
    });

    const res = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/save`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token()}`
            },
            body: JSON.stringify({ batchId, attendance })
        }
    );

    const data = await res.json();
    alert(data.message);
}

/* =========================================
HISTORY
========================================= */

async function loadAttendanceHistory(batchId) {

    const res = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/history/${batchId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
    );

    const data = await res.json();

    const container = document.getElementById("batchContent");

    container.innerHTML = `<div class="page-title">📊 History</div>`;

    data.records.forEach(r => {
        container.innerHTML += `
            <div class="glass-card">
                <h4>${r.date}</h4>
                <p>Total Students: ${r.count}</p>
            </div>
        `;
    });
}

/* =========================================
EXCEL DOWNLOAD
========================================= */

async function downloadAttendance(batchId) {

    const res = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/history/${batchId}`,
        {
            headers: { Authorization: `Bearer ${token()}` }
        }
    );

    const data = await res.json();

    if (!data.success) {
        alert("No attendance found");
        return;
    }

    const studentRes = await fetch(
        `${window.BASE_URL}/faculty_portal/attendance/students/${batchId}`,
        {
            headers: { Authorization: `Bearer ${token()}` }
        }
    );

    const studentData = await studentRes.json();

    if (!studentData.success) {
        alert("No students found");
        return;
    }

    const students = studentData.students;

    // 🔥 IMPORTANT CHANGE: use REAL DATES instead of Session1,2,3
    const dates = data.records.map(r => r.date); 

    const rows = [];

    students.forEach((s, index) => {

        let row = {
            "SL NO": index + 1,
            "USN": s.roll || "",
            "Student Name": s.name
        };

        dates.forEach(date => {
            row[date] = "P"; // default mark (you can enhance later)
        });

        rows.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    XLSX.writeFile(wb, `ERP_Attendance_${batchId}.xlsx`);
}

/* =========================================
MATERIALS (FIXED INTEGRATION)
========================================= */

function loadBatchMaterials(batchId) {

    localStorage.setItem("selectedBatchId", batchId);

    document.getElementById("batchContent").innerHTML = `
        <div class="page-title">📘 Materials</div>
        <div id="materialsList"></div>
    `;

    setTimeout(() => {
        if (typeof initializeNotesVideo === "function") {
            initializeNotesVideo(batchId);
        }
    }, 100);
}

/* =========================================
LIVE (FIXED INTEGRATION)
========================================= */

function loadBatchLive(batchId) {

    localStorage.setItem("selectedBatchId", batchId);

    document.getElementById("batchContent").innerHTML = `
        <div class="page-title">🎥 Live Classes</div>
        <div id="liveList"></div>
    `;

    setTimeout(() => {
        if (typeof initializeLiveStream === "function") {
            initializeLiveStream(batchId);
        }
    }, 100);
}

/* =========================================
EXPORT
========================================= */

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