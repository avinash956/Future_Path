const LIVE_API = "http://127.0.0.1:5000/api/live";

/* =====================================================
   SESSION HELPERS
===================================================== */

function getLiveToken() {
    return localStorage.getItem("token") || "";
}

function getLiveRole() {
    return localStorage.getItem("role") || "student";
}

/* =====================================================
   INIT
===================================================== */

function initializeLiveStream() {

    console.log("🎥 Live Streaming Module Initialized");

    const btn = document.getElementById("createLiveBtn");

    if (btn) {

        if (getLiveRole() === "student") {
            btn.style.display = "none";
        } else {
            btn.onclick = createLive;
        }
    }

    loadBatches();
    loadFacultyDropdown();;
    loadLiveClasses();
}

/* =====================================================
   CREATE LIVE CLASS
===================================================== */

async function createLive() {

    if (!getLiveToken()) {
        alert("Login required");
        return;
    }

    const batchSelect = document.getElementById("batchSelect");
    const facultySelect = document.getElementById("facultySelect");

    if (!batchSelect || !facultySelect) {
        alert("Batch or Faculty dropdown missing");
        return;
    }

    if (!batchSelect.value || !facultySelect.value) {
        alert("Select Batch and Faculty");
        return;
    }

    const payload = {
        title: document.getElementById("title")?.value?.trim() || "",
        description: document.getElementById("description")?.value?.trim() || "",

        batchId: batchSelect.value,
        batchName: batchSelect.options[batchSelect.selectedIndex]?.text || "",

        facultyId: facultySelect.value,
        facultyName: facultySelect.options[facultySelect.selectedIndex]?.text || "",

        platform: document.getElementById("platform")?.value || "",
        meetingLink: document.getElementById("meetingLink")?.value?.trim() || "",

        scheduledDate: document.getElementById("scheduledDate")?.value || "",
        scheduledTime: document.getElementById("scheduledTime")?.value || ""
    };

    console.log("📤 LIVE CLASS PAYLOAD:");
    console.log(payload);

    // Basic Validation

    if (!payload.title) {
        alert("Enter Class Title");
        return;
    }

    if (!payload.platform) {
        alert("Select Platform");
        return;
    }

    if (!payload.meetingLink) {
        alert("Enter Meeting Link");
        return;
    }

    if (!payload.scheduledDate) {
        alert("Select Date");
        return;
    }

    if (!payload.scheduledTime) {
        alert("Select Time");
        return;
    }

    try {

        const res = await fetch(`${LIVE_API}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getLiveToken()}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await res.text();

        console.log("📥 Response Status:", res.status);
        console.log("📥 Raw Response:", responseText);

        let result = {};

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("❌ Invalid JSON Response");
        }

        if (res.ok && result.success) {

            alert("✅ Live Class Created Successfully");

            document.getElementById("title").value = "";
            document.getElementById("description").value = "";
            document.getElementById("meetingLink").value = "";

            loadLiveClasses();

        } else {

            console.error("❌ Server Error:", result);

            alert(
                result.message ||
                `Server Error (${res.status})`
            );
        }

    } catch (err) {

        console.error("❌ Create Live Error:", err);

        alert(
            "Failed to connect to server.\nCheck backend logs."
        );
    }
}
/* =====================================================
   LOAD LIVE CLASSES
===================================================== */

async function loadLiveClasses() {

    const container = document.getElementById("liveList");

    if (!container) return;

    try {

        const res = await fetch(`${LIVE_API}/all`, {
            headers: {
                "Authorization": `Bearer ${getLiveToken()}`
            }
        });

        const data = await res.json();

        container.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            container.innerHTML = `
                <div class="live-card">
                    No Live Classes Available
                </div>
            `;

            return;
        }

        data.forEach(cls => {

            const status = getStatus(
                cls.scheduledDate,
                cls.scheduledTime
            );

            const canJoin = checkJoinWindow(
                cls.scheduledDate,
                cls.scheduledTime
            );

            const canManage =
                getLiveRole() === "admin" ||
                getLiveRole() === "faculty" ||
                getLiveRole() === "management";

            container.innerHTML += `
                <div class="live-card">

                    <h3>${escapeHtml(cls.title)}</h3>

                    <p>${escapeHtml(cls.description)}</p>

                    <p>
                        <b>Batch:</b>
                        ${escapeHtml(cls.batchName || "")}
                    </p>

                    <p>
                        <b>Faculty:</b>
                        ${escapeHtml(cls.facultyName || "")}
                    </p>

                    <p>
                        <b>Status:</b>
                        <span class="status-${status.toLowerCase()}">
                            ${status}
                        </span>
                    </p>

                    <p>
                        <b>Schedule:</b>
                        ${cls.scheduledDate || ""}
                        ${cls.scheduledTime || ""}
                    </p>

                    ${renderEmbed(cls)}

                    <div class="live-actions">

                        ${
                            canJoin
                            ? `
                                <button
                                    class="btn-join"
                                    onclick="joinClass('${cls._id}','${cls.meetingLink}')">
                                    ▶ Join Class
                                </button>
                              `
                            : `
                                <button
                                    class="btn-disabled"
                                    disabled>
                                    🔒 Opens 5 Min Before Class
                                </button>
                              `
                        }

                        ${
                            canManage
                            ? `
                                <button
                                    class="btn-delete"
                                    onclick="deleteLive('${cls._id}')">
                                    🗑 Delete
                                </button>
                              `
                            : ""
                        }

                        ${
                            getLiveRole() === "admin" ||
                            getLiveRole() === "faculty"
                            ? `
                                <button
                                    class="btn-view"
                                    onclick="viewAttendance('${cls._id}')">
                                    📊 Attendance
                                </button>
                              `
                            : ""
                        }

                    </div>

                </div>
            `;
        });

    } catch (err) {

        console.error("Load Classes Error:", err);

        container.innerHTML = `
            <div class="live-card">
                Failed To Load Classes
            </div>
        `;
    }
}

/* =====================================================
   JOIN CLASS
===================================================== */

async function joinClass(classId, link) {

    if (!getLiveToken()) {
        alert("Login required");
        return;
    }

    try {

        await fetch(`${LIVE_API}/join/${classId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getLiveToken()}`
            }
        });

        window.open(link, "_blank");

    } catch (err) {

        console.error("Join Error:", err);

    }
}

/* =====================================================
   DELETE LIVE
===================================================== */

async function deleteLive(id) {

    if (!confirm("Delete this class?")) return;

    try {

        const res = await fetch(`${LIVE_API}/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getLiveToken()}`
            }
        });

        const result = await res.json();

        if (result.success) {
            loadLiveClasses();
        } else {
            alert(result.message || "Delete failed");
        }

    } catch (err) {

        console.error("Delete Error:", err);

    }
}

/* =====================================================
   ATTENDANCE
===================================================== */

async function viewAttendance(classId) {

    try {

        const res = await fetch(`${LIVE_API}/attendance/${classId}`, {
            headers: {
                "Authorization": `Bearer ${getLiveToken()}`
            }
        });

        const data = await res.json();

        alert(
            data.length
                ? data.map(
                    item => `${item.userId} (${item.role})`
                  ).join("\n")
                : "No Attendance Yet"
        );

    } catch (err) {

        console.error("Attendance Error:", err);

    }
}

/* =====================================================
   LOAD BATCHES
===================================================== */

async function loadBatches() {

    const select = document.getElementById("batchSelect");
    if (!select) return;

    try {

        const res = await authFetch(
            `${window.BASE_URL}/live/batches`
        );

        if (!res.ok) throw new Error("Unauthorized or CORS issue");

        const data = await res.json();

        select.innerHTML = `<option value="">Select Batch</option>`;

        data.forEach(batch => {
            select.innerHTML += `
                <option value="${batch._id}">
                    ${batch.name}
                </option>
            `;
        });

    } catch (err) {
        console.error("Batch Load Error:", err);
    }
}

/* =====================================================
   LOAD FACULTY
===================================================== */

async function loadFacultyDropdown() {

    const select = document.getElementById("facultySelect");
    if (!select) return;

    try {

        const res = await authFetch(
            `${window.BASE_URL}/live/faculty`
        );

        if (!res.ok) throw new Error("Unauthorized or CORS issue");

        const data = await res.json();

        select.innerHTML = `<option value="">Select Faculty</option>`;

        data.forEach(faculty => {
            select.innerHTML += `
                <option value="${faculty._id}">
                    ${faculty.name}
                </option>
            `;
        });

    } catch (err) {
        console.error("Faculty Load Error:", err);
    }
}
/* =====================================================
   STATUS
===================================================== */

function getStatus(date, time) {

    if (!date || !time) return "UNKNOWN";

    const start = new Date(`${date}T${time}:00`);

    if (isNaN(start.getTime())) {
        return "UNKNOWN";
    }

    const now = new Date();
    const end = new Date(start.getTime() + 60 * 60000);

    if (now < start) return "UPCOMING";
    if (now <= end) return "LIVE";

    return "ENDED";
}

/* =====================================================
   JOIN WINDOW
===================================================== */

function checkJoinWindow(date, time) {

    if (!date || !time) return false;

    const scheduled = new Date(`${date}T${time}:00`);

    if (isNaN(scheduled.getTime())) {
        return false;
    }

    const joinTime = new Date(
        scheduled.getTime() - (5 * 60 * 1000)
    );

    return new Date() >= joinTime;
}

/* =====================================================
   EMBED
===================================================== */

function renderEmbed(cls) {

    const link = cls.meetingLink;

    if (!link) return "";

    if (
        link.includes("youtube.com") ||
        link.includes("youtu.be")
    ) {

        const id = extractYouTubeId(link);

        return `
            <iframe
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/${id}"
                allowfullscreen>
            </iframe>
        `;
    }

    if (link.includes("meet.google.com")) {

        return `
            <a
                class="btn-join"
                href="${link}"
                target="_blank">
                🎥 Join Google Meet
            </a>
        `;
    }

    if (link.includes("zoom")) {

        return `
            <a
                class="btn-join"
                href="${link}"
                target="_blank">
                🎥 Join Zoom
            </a>
        `;
    }

    return "";
}

function extractYouTubeId(url) {

    const match =
        url.match(/(?:youtu\.be\/|v=|embed\/)([^&?/]+)/);

    return match ? match[1] : "";
}

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(text) {

    if (!text) return "";

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =====================================================
   GLOBAL EXPORTS
===================================================== */

window.initializeLiveStream = initializeLiveStream;
window.createLive = createLive;
window.joinClass = joinClass;
window.deleteLive = deleteLive;
window.viewAttendance = viewAttendance;