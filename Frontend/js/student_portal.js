console.log("🎓 Student Portal Loaded");

/* =========================================
BASE
========================================= */

window.BASE_URL = "http://127.0.0.1:5000/api";

const token = () => localStorage.getItem("token");

/* =========================================
INIT
========================================= */

function loadStudentDashboard() {
    loadHome();
}

/* =========================================
HOME
========================================= */

async function loadHome() {

    const container = document.getElementById("dynamicContent");

    container.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <h3>Loading Dashboard...</h3>
        </div>
    `;

    try {

        const res = await fetch(
            `${window.BASE_URL}/student_portal/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            }
        );

        const data = await res.json();

        console.log("PROFILE RESPONSE:", data);

        if (!data.success) {

            container.innerHTML = `
                <div class="error-card">
                    <h2>⚠ Unable to Load Dashboard</h2>
                    <p>${data.message || "Something went wrong"}</p>
                </div>
            `;

            return;
        }

        container.innerHTML = `

        <div class="dashboard-wrapper">

            <!-- HERO SECTION -->

            <div class="hero-card">

                <div class="hero-content">

                    <span class="hero-badge">
                        STUDENT DASHBOARD
                    </span>

                    <h1>
                        Welcome, ${data.student.name}
                    </h1>

                    <p>
                        Continue your learning journey and stay focused on your goals.
                    </p>

                </div>

                <div class="hero-avatar">
                    🎓
                </div>

            </div>

            <!-- THOUGHT OF DAY -->

            <div class="thought-card">

                <div class="thought-icon">
                    💡
                </div>

                <div class="thought-content">

                    <h3>
                        Thought of the Day
                    </h3>

                    <p>
                        "${data.thought}"
                    </p>

                </div>

            </div>

            <!-- QUICK INFO -->

            <div class="info-grid">

                <div class="info-card">

                    <div class="info-icon">
                        👤
                    </div>

                    <h4>Name</h4>

                    <p>
                        ${data.student.name || "-"}
                    </p>

                </div>

                <div class="info-card">

                    <div class="info-icon">
                        📧
                    </div>

                    <h4>Email</h4>

                    <p>
                        ${data.student.email || "-"}
                    </p>

                </div>

                <div class="info-card">

                    <div class="info-icon">
                        📱
                    </div>

                    <h4>Phone</h4>

                    <p>
                        ${data.student.phone || "-"}
                    </p>

                </div>

                <div class="info-card">

                    <div class="info-icon">
                        🎯
                    </div>

                    <h4>Batch</h4>

                    <p>
                        ${data.student.batch || "-"}
                    </p>

                </div>

            </div>

        </div>

        `;

    } catch (err) {

        console.error(err);

        container.innerHTML = `
            <div class="error-card">

                <h2>
                    ❌ Error Loading Dashboard
                </h2>

                <p>
                    ${err.message}
                </p>

            </div>
        `;
    }
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
                <div class="page-title">
                    📚 My Batch
                </div>

                <div id="studentBatchCard"></div>
            `;

            loadBatch();

            break;

        case "materials":

            container.innerHTML = `
                <div class="page-title">
                    📘 Notes / Videos
                </div>

                <div id="materialsList"></div>
            `;

            loadMaterials();

            break;

        case "live":

            container.innerHTML = `
                <div class="page-title">
                    🎥 Live Classes
                </div>

                <div id="liveList"></div>
            `;

            loadLiveClasses();

            break;
    }
}

/* =========================================
BATCH
========================================= */

async function loadBatch() {

    const container =
        document.getElementById("studentBatchCard");

    container.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <h3>Loading Batch...</h3>
        </div>
    `;

    try {

        const res = await fetch(
            `${window.BASE_URL}/student_portal/batch`,
            {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            }
        );

        const data = await res.json();

        if (!data.success) {

            container.innerHTML = `
                <div class="error-card">
                    No Batch Assigned
                </div>
            `;

            return;
        }

        const batch = data.batch;

        container.innerHTML = `

        <div class="hero-card">

            <div class="hero-content">

                <span class="hero-badge">
                    MY BATCH
                </span>

                <h1>
                    ${batch.name || batch.code}
                </h1>

                <p>
                    Batch Information & Details
                </p>

            </div>

            <div class="hero-avatar">
                📚
            </div>

        </div>

        <div class="info-grid">

            <div class="info-card">
                <div class="info-icon">🏷️</div>
                <h4>Batch Code</h4>
                <p>${batch.code || "-"}</p>
            </div>

            <div class="info-card">
                <div class="info-icon">👨‍🏫</div>
                <h4>Coordinator</h4>
                <p>${batch.coordinator || "-"}</p>
            </div>

            <div class="info-card">
                <div class="info-icon">👥</div>
                <h4>Strength</h4>
                <p>${batch.strength || 0}</p>
            </div>

            <div class="info-card">
                <div class="info-icon">✅</div>
                <h4>Status</h4>
                <p>${batch.status || "Active"}</p>
            </div>

        </div>

        `;
    }

    catch(err){

        console.error(err);
    }
}

/* =========================================
MATERIALS
========================================= */

async function loadMaterials() {

    const container =
        document.getElementById("materialsList");

    try {

        const res = await fetch(
            `${window.BASE_URL}/student_portal/materials`,
            {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            }
        );

        const data = await res.json();

        console.log("Materials:", data);

        if (!data.success || !data.materials.length) {

            container.innerHTML = `
                <div class="error-card">
                    No Materials Available
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="info-grid" id="materialGrid"></div>
        `;

        const grid =
            document.getElementById("materialGrid");

        data.materials.forEach(m => {

            const fileUrl = m.file_id
                ? `${window.BASE_URL}/materials/file/${m.file_id}`
                : "";

            grid.innerHTML += `

            <div class="info-card material-card">

                <div class="info-icon">
                    📘
                </div>

                <h4>
                    ${m.title || "Untitled"}
                </h4>

                <p>
                    ${m.description || "No Description"}
                </p>

                <div class="action-buttons">

                    ${
                        m.videoUrl
                        ?
                        `
                        <button class="btn-primary"
                            onclick="window.open('${m.videoUrl}','_blank')">

                            ▶ Watch Video

                        </button>
                        `
                        :
                        ""
                    }

                    ${
                        m.file_id
                        ?
                        `
                        <button class="btn-secondary"
                            onclick="window.open('${fileUrl}','_blank')">

                            👁 View

                        </button>

                        <button class="btn-success"
                            onclick="downloadFile('${fileUrl}')">

                            ⬇ Download

                        </button>
                        `
                        :
                        ""
                    }

                </div>

            </div>

            `;
        });

    } catch(err){

        console.error(err);

        container.innerHTML = `
            <div class="error-card">
                Error loading materials
            </div>
        `;
    }
}

/* =========================================
LIVE CLASSES
========================================= */

async function loadLiveClasses() {

    const container =
        document.getElementById("liveList");

    try {

        const res = await fetch(
            `${window.BASE_URL}/student_portal/live`,
            {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            }
        );

        const data = await res.json();

        if (!data.success || !data.classes.length) {

            container.innerHTML = `
                <div class="error-card">
                    No Live Classes Scheduled
                </div>
            `;

            return;
        }

        container.innerHTML = `
            <div class="info-grid" id="liveGrid"></div>
        `;

        const grid =
            document.getElementById("liveGrid");

        data.classes.forEach(c => {

            grid.innerHTML += `

            <div class="info-card live-card">

                <div class="info-icon">
                    🎥
                </div>

                <h4>
                    ${c.title}
                </h4>

                <p>
                    ${c.description || ""}
                </p>

                <p>
                    👨‍🏫 ${c.facultyName || "-"}
                </p>

                <p>
                    📅 ${c.scheduledDate || "-"}
                </p>

                <p>
                    ⏰ ${c.scheduledTime || "-"}
                </p>

                <button
                    class="btn-primary"
                    onclick="window.open('${c.meetingLink}','_blank')">

                    🚀 Join Class

                </button>

            </div>

            `;
        });

    } catch(err){

        console.error(err);
    }
}

/* =========================================
DOWNLOAD
========================================= */

function downloadFile(url) {

    const a = document.createElement("a");

    a.href = url;

    a.download = "";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
}

/* =========================================
EXPORT
========================================= */

window.loadStudentDashboard = loadStudentDashboard;

window.loadSection = loadSection;

window.loadHome = loadHome;

window.loadBatch = loadBatch;

window.loadMaterials = loadMaterials;

window.loadLiveClasses = loadLiveClasses;

window.downloadFile = downloadFile;