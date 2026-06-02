    /* =========================================
    MODERN BATCH MODULE (FLASK + MONGO COMPATIBLE)
    ========================================= */

    console.log("✅ batch.js LOADED");

    /* =========================================
    GLOBAL STATE
    ========================================= */

    window.USER_ROLE = localStorage.getItem("role") || "student";

    const BATCH_API = `${window.BASE_URL}/batch`;

    let BATCH_CACHE = [];
    let CURRENT_PAGE = 1;
    let TOTAL_PAGES = 1;
    let LIMIT = 10;
    let SELECTED_FACULTIES = new Set();
    /* =========================================
    INIT
    ========================================= */

    function initializeBatch() {
        console.log("🚀 Initializing Batch Module");

        const form = document.getElementById("batchForm");

        if (form) {
            form.addEventListener("submit", addBatch);
        }

        const batchNameInput = document.getElementById("batchName");

        if (batchNameInput) {
            batchNameInput.addEventListener("input", generateBatchCode);
        }

        loadBatch();

        console.log("🔐 ROLE:", window.USER_ROLE);
    }

    /* =========================================
    FETCH BATCHES
    ========================================= */

    async function loadBatch(page = 1, search = "", status = "") {

        const container = document.getElementById("batchList");

        if (!container) return;

        container.innerHTML = "Loading...";

        try {

            const url =
                `${BATCH_API}/get-batch?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(search)}&status=${status}`;

            console.log("📡 Loading:", url);

            const res = await authFetch(url);
            const data = await res.json();

            console.log("📦 Batch Response:", data);

            if (!data.success) {
                container.innerHTML = data.message || "Failed to load batches";
                return;
            }

            BATCH_CACHE = data.data || [];

            CURRENT_PAGE = data.pagination?.page || 1;
            TOTAL_PAGES = data.pagination?.pages || 1;

            renderBatch(BATCH_CACHE);
            renderPagination();

        } catch (err) {

            console.error("❌ loadBatch error:", err);

            container.innerHTML = `
                <div class="error-message">
                    Error loading batches.
                </div>
            `;
        }
    }

    /* =========================================
    RENDER BATCHES
    ========================================= */

    function renderBatch(items) {

        const container = document.getElementById("batchList");

        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = "No batches found";
            return;
        }

        container.innerHTML = `
            <div class="faculty-grid">
                ${items.map(item => {

                    const isActive = item.isActive !== false;

                    return `
                        <div class="faculty-card batch-card">

                            <div class="faculty-info">

                                <h3>${item.name || "No Name"}</h3>

                                <span class="batch-badge">
                                    ${item.code || "N/A"}
                                </span>

                                <p><strong>Department:</strong> ${item.department || "N/A"}</p>

                                <p><strong>Coordinator:</strong> ${item.coordinator || "N/A"}</p>

                                <p><strong>Strength:</strong> ${item.strength || 0}</p>

                                <p>
                                    <strong>Status:</strong>
                                    <span style="color:${isActive ? 'green' : 'red'};font-weight:bold;">
                                        ${isActive ? "Active" : "Inactive"}
                                    </span>
                                </p>

                                <p><strong>Start:</strong> ${item.startDate || "N/A"}</p>

                                <p><strong>End:</strong> ${item.endDate || "N/A"}</p>

                                <div class="faculty-actions">

                                    
                                        <button onclick="openFacultyManager('${item._id}')">
                                            Manage Faculties
                                        </button>
                                    

                                    <button class="student-list-btn"
                                        onclick="showBatchStudents('${item._id}','${item.name}')">
                                        Student List
                                    </button>

                                    <button class="download-btn"
                                        onclick="downloadBatchStudents('${item._id}','${item.name}')">
                                        Download Students
                                    </button>

                                    ${window.USER_ROLE === "admin" ? `
                                        <button
                                            class="${isActive ? 'deactivate-btn' : 'activate-btn'}"
                                            onclick="toggleBatch('${item._id}')">
                                            ${isActive ? "Deactivate" : "Activate"}
                                        </button>

                                        <button class="delete-btn"
                                            onclick="deleteBatch('${item._id}')">
                                            Delete
                                        </button>
                                    ` : ""}

                                </div>

                            </div>

                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    /* =========================================
    PAGINATION
    ========================================= */

    function renderPagination() {

        const container = document.getElementById("batchPagination");

        if (!container) return;

        container.innerHTML = `
            <div class="pagination">

                <button
                    onclick="changePage(${CURRENT_PAGE - 1})"
                    ${CURRENT_PAGE <= 1 ? "disabled" : ""}>
                    Prev
                </button>

                <span>
                    Page ${CURRENT_PAGE} of ${TOTAL_PAGES}
                </span>

                <button
                    onclick="changePage(${CURRENT_PAGE + 1})"
                    ${CURRENT_PAGE >= TOTAL_PAGES ? "disabled" : ""}>
                    Next
                </button>

            </div>
        `;
    }

    function changePage(page) {

        if (page < 1 || page > TOTAL_PAGES) return;

        loadBatch(page);
    }

    /* =========================================
    GENERATE BATCH CODE
    ========================================= */

    function generateBatchCode() {

        const name = document.getElementById("batchName")?.value.trim();
        const codeInput = document.getElementById("batchCode");

        if (!name || !codeInput) {
            if (codeInput) codeInput.value = "";
            return;
        }

        const year = new Date().getFullYear().toString().slice(-2);

        const matching = BATCH_CACHE.filter(batch =>
            batch.code &&
            batch.code.startsWith(`${name}-${year}-`)
        );

        let nextSerial = 1;

        if (matching.length > 0) {

            const serials = matching.map(batch => {
                const parts = batch.code.split("-");
                return parseInt(parts[parts.length - 1]) || 0;
            });

            nextSerial = Math.max(...serials) + 1;
        }

        codeInput.value =
            `${name}-${year}-${String(nextSerial).padStart(2, "0")}`;
    }

    /* =========================================
    ADD BATCH
    ========================================= */

    async function addBatch(e) {

        e.preventDefault();

        const form = document.getElementById("batchForm");

        const formData = new FormData();

        const fields = {
            batchName: "name",
            batchCode: "code",
            batchDepartment: "department",
            batchStrength: "strength",
            batchCoordinator: "coordinator",
            batchStartDate: "startDate",
            batchEndDate: "endDate",
            batchStatus: "status",
            batchDescription: "description"
        };

        Object.keys(fields).forEach(id => {

            const el = document.getElementById(id);

            if (el) {
                formData.append(fields[id], el.value.trim());
            }
        });

        try {

            const res = await authFetch(`${BATCH_API}/add-batch`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {

                if (typeof showSuccess === "function") {
                    showSuccess(data.message);
                }

                form.reset();

                document.getElementById("batchCode").value = "";

                loadBatch(CURRENT_PAGE);

            } else {

                alert(data.message || "Failed to create batch");
            }

        } catch (err) {

            console.error("❌ addBatch error:", err);

            alert("Failed to create batch");
        }
    }

    /* =========================================
    TOGGLE BATCH
    ========================================= */

    async function toggleBatch(id) {

        console.log("🔄 Toggle Batch:", id);

        try {

            const res = await authFetch(
                `${BATCH_API}/toggle-batch/${id}`,
                {
                    method: "PATCH"
                }
            );

            console.log("📡 Status:", res.status);

            const data = await res.json();

            console.log("📦 Response:", data);

            if (data.success) {

                loadBatch(CURRENT_PAGE);

                if (typeof showSuccess === "function") {
                    showSuccess(data.message);
                }

            } else {

                alert(data.message || "Toggle failed");
            }

        } catch (err) {

            console.error("❌ TOGGLE ERROR:", err);

            alert(err.message);
        }
    }

    /* =========================================
    DELETE BATCH
    ========================================= */

    async function deleteBatch(id) {

        if (!confirm("Are you sure you want to delete this batch?")) {
            return;
        }

        try {

            const res = await authFetch(
                `${BATCH_API}/delete-batch/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await res.json();

            if (data.success) {

                loadBatch(CURRENT_PAGE);

                if (typeof showSuccess === "function") {
                    showSuccess(data.message);
                }
            }

        } catch (err) {

            console.error("❌ deleteBatch error:", err);
        }
    }
    /*================== Download Batch Students ==================
    ==============================================================*/ 
    async function downloadBatchStudents(batchId, batchName) {

        try {

            const res = await authFetch(`${BATCH_API}/students/${batchId}`);
            const data = await res.json();

            if (!data.success || !data.students || data.students.length === 0) {
                alert("No students found for this batch.");
                return;
            }

            const students = data.students.map((student, index) => ({
        "Sr No": index + 1,
        "Name": student.name || "",
        "Roll": student.roll || "",
        "Batch": student.batch || "",
        "Phone": student.phone || "",
        "Email": student.email || "",   
    }));
            const worksheet = XLSX.utils.json_to_sheet(students);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Students"
            );

            XLSX.writeFile(
                workbook,
                `${batchName}_Students.xlsx`
            );

        } catch (err) {

            console.error("❌ downloadBatchStudents error:", err);

            alert("Error downloading student list.");
        }
    }

    /* =========================================
    SEARCH
    ========================================= */

    function searchBatch() {

        const value =
            document.getElementById("batchSearch")?.value.trim() || "";

        const status =
            document.getElementById("batchStatusFilter")?.value || "";

        loadBatch(1, value, status);
    }

    /* =========================================
    FILTER STATUS
    ========================================= */

    function filterBatchStatus() {

        const search =
            document.getElementById("batchSearch")?.value.trim() || "";

        const status =
            document.getElementById("batchStatusFilter")?.value || "";

        loadBatch(1, search, status);
    }

    /* =========================================
    AUTO INIT
    ========================================= */

    document.addEventListener("DOMContentLoaded", () => {
        initializeBatch();
    });

    /* =========================================
            Student list FUNCTIONS (FIXED)
    ========================================= */

    async function showBatchStudents(batchId, batchName) {

        const container = document.getElementById("studentListContainer");

        try {

            console.log("====================================");
            console.log("📡 STUDENT FETCH START");
            console.log("📌 Batch ID:", batchId);
            console.log("📌 Batch Name:", batchName);
            console.log("====================================");

            container.innerHTML = "⏳ Loading students...";

            const res = await authFetch(`${BATCH_API}/students/${batchId}`);

            console.log("📡 HTTP STATUS:", res.status);

            const rawText = await res.text();

            console.log("📦 RAW RESPONSE TEXT:", rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("❌ JSON PARSE ERROR:", e);
                container.innerHTML = "❌ Invalid JSON response from server";
                return;
            }

            console.log("📦 PARSED RESPONSE:", data);
            console.log("📊 KEYS:", Object.keys(data));

            if (!data.success) {
                container.innerHTML = `
                    <div style="color:red;">
                        ❌ ${data.message || "Failed to fetch students"}
                    </div>
                `;
                return;
            }

            // 🔥 FLEXIBLE DATA HANDLING
            const students =
                data.students ||
                data.data ||
                data.result ||
                [];

            console.log("👥 STUDENTS ARRAY:", students);
            console.log("📏 STUDENT COUNT:", students.length);

            document.getElementById("studentModalTitle").innerText =
                `${batchName} Students (Found: ${students.length})`;

            // 🚨 SHOW RAW DATA IF EMPTY (DEBUG MODE)
            if (students.length === 0) {

                container.innerHTML = `
                    <div style="padding:10px;color:#b00;">
                        🚫 No students found<br><br>

                        <b>DEBUG INFO:</b><br>
                        Response Keys: ${Object.keys(data)}<br>
                        Count Field: ${data.count || "N/A"}<br><br>

                        <details>
                            <summary>Show Raw Response</summary>
                            <pre style="white-space:pre-wrap;">
    ${JSON.stringify(data, null, 2)}
                            </pre>
                        </details>
                    </div>
                `;

                return;
            }

            // ✅ BUILD TABLE
            container.innerHTML = `
                <table class="student-table">

                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Roll</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${students.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.name || "-"}</td>
                                <td>${s.roll || "-"}</td>
                                <td>${s.phone || "-"}</td>
                                <td>${s.email || "-"}</td>
                            </tr>
                        `).join("")}
                    </tbody>

                </table>
            `;

            document.getElementById("studentModal").style.display = "flex";

            console.log("✅ STUDENTS RENDERED SUCCESSFULLY");

        } catch (err) {

            console.error("❌ STUDENT FETCH ERROR:", err);

            container.innerHTML = `
                <div style="color:red;">
                    ❌ Network / Fetch Error<br>
                    ${err.message}
                </div>
            `;
        }
    }

    function closeStudentModal() {
        document.getElementById("studentModal").style.display = "none";
    }

/* =========================================
    FACULTY MANAGEMENT SYSTEM
=========================================== */ 
/* ========================================
OPEN FACULTY MANAGER (DEBUG)
========================================== */
async function openFacultyManager(batchId) {
    console.log("\n🔥 [DEBUG] OPEN FACULTY MANAGER");
    console.log("📦 Batch ID:", batchId);

    window.CURRENT_BATCH_ID = batchId;

    const modal = document.getElementById("facultyModal");
    if (modal) {
        modal.style.display = "flex";
        console.log("🟢 Modal opened");
    } else {
        console.error("❌ facultyModal not found");
    }

    await loadFacultyCheckboxUI(batchId);
}
/* ========================================
LOAD FACULTY DATA (DEBUG)
========================================== */
async function loadFacultyCheckboxUI(batchId) {
    try {
        console.log("\n🔥 [DEBUG] LOAD FACULTY UI START");
        console.log("📦 Batch ID:", batchId);
        console.log("🌐 BASE_URL:", window.BASE_URL);

        const facultyURL = `${window.BASE_URL}/batch/faculty/get-all`;
        console.log("➡️ Faculty API URL:", facultyURL);

        const allRes = await authFetch(facultyURL);
        console.log("📡 Faculty Response Status:", allRes.status);

        const allData = await allRes.json();
        console.log("📦 Faculty Data:", allData);

        const assignedURL = `${window.BASE_URL}/batch/batch-faculty/batch/${batchId}`;
        console.log("➡️ Assigned API URL:", assignedURL);

        const assignedRes = await authFetch(assignedURL);
        console.log("📡 Assigned Response Status:", assignedRes.status);

        const assignedData = await assignedRes.json();
        console.log("📦 Assigned Data:", assignedData);

        const assignedSet = new Set(
            (assignedData.faculty_ids || []).map(id => String(id))
        );

        console.log("✅ Assigned Set:", assignedSet);

        renderFacultyCheckboxes(allData.faculties || [], assignedSet);

    } catch (error) {
        console.error("❌ ERROR loading faculty UI:", error);
    }
}
/* ========================================
RENDER FACULTY LIST (DEBUG)
========================================== */
function renderFacultyCheckboxes(list, assignedSet) {

    const container = document.getElementById("facultyList");
    if (!container) return;

    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = "No faculty found";
        return;
    }

    list.forEach(f => {

        const facultyId = String(f._id);

        // ✅ SAFE CHECK
        const isAssigned = assignedSet.has(facultyId);

        const card = document.createElement("div");
        card.className = "faculty-card";

        card.innerHTML = `
            <div class="faculty-header">
                <h3>${f.name}</h3>
                <small>${f.department || ""}</small>
            </div>

            <div class="faculty-body">
                <label class="faculty-switch">
                    <input type="checkbox"
                        ${isAssigned ? "checked" : ""}
                        onchange="handleFacultySelection('${facultyId}', this.checked)">
                    <span class="slider"></span>
                </label>

                <span style="margin-left:10px;">
                    ${isAssigned ? "Assigned" : "Not Assigned"}
                </span>
            </div>
        `;

        container.appendChild(card);
    });

    console.log("✅ Faculty UI rendered with correct toggle state");
}

/* ========================================
ASSIGN FACULTY (DEBUG)
========================================== */
async function assignFaculty(batchId, facultyId) {
    try {
        console.log("\n🔥 [DEBUG] ASSIGN FACULTY");
        console.log("📦 Batch ID:", batchId);
        console.log("📦 Faculty ID:", facultyId);

        const url = `${window.BASE_URL}/batch/batch-faculty/assign`;

        const payload = {
            batchId,
            facultyId
        };

        console.log("➡️ URL:", url);
        console.log("📥 PAYLOAD:", payload);

        const res = await authFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("📡 STATUS:", res.status);

        const data = await res.json();
        console.log("📦 RESPONSE:", data);

        if (!data.success) {
            console.error("❌ ASSIGN FAILED:", data.message);
        } else {
            console.log("✅ ASSIGN SUCCESS");
        }

        await loadFacultyCheckboxUI(batchId);

    } catch (error) {
        console.error("❌ ASSIGN ERROR:", error);
        await loadFacultyCheckboxUI(batchId);
    }
}
/* ========================================
REMOVE FACULTY (DEBUG)
========================================== */
async function removeFaculty(batchId, facultyId) {
    try {
        console.log("\n🔥 [DEBUG] REMOVE FACULTY");
        console.log("📦 Batch ID:", batchId);
        console.log("📦 Faculty ID:", facultyId);

        const url = `${window.BASE_URL}/batch/batch-faculty/remove?batchId=${batchId}&facultyId=${facultyId}`;

        console.log("➡️ URL:", url);

        const res = await authFetch(url, {
            method: "DELETE"
        });

        console.log("📡 STATUS:", res.status);

        const data = await res.json();
        console.log("📦 RESPONSE:", data);

        if (!data.success) {
            console.error("❌ REMOVE FAILED:", data.message);
        } else {
            console.log("✅ REMOVE SUCCESS");
        }

        await loadFacultyCheckboxUI(batchId);

    } catch (error) {
        console.error("❌ REMOVE ERROR:", error);
        await loadFacultyCheckboxUI(batchId);
    }
}


// for the faculty checkbox onchange event

window.handleFacultySelection = function (facultyId, isChecked) {

    console.log("🎯 Faculty toggle:", facultyId, isChecked);

    if (!facultyId || typeof facultyId !== "string") {
        console.error("❌ Invalid facultyId:", facultyId);
        return;
    }

    if (isChecked) {
        SELECTED_FACULTIES.add(facultyId);
    } else {
        SELECTED_FACULTIES.delete(facultyId);
    }

    console.log("📌 Selected Set:", Array.from(SELECTED_FACULTIES));
};
async function submitFacultyAssignment() {

    const batchId = window.CURRENT_BATCH_ID;

    if (!batchId) {
        alert("Batch not selected");
        return;
    }

    const facultyIds = Array.from(SELECTED_FACULTIES || []);

    console.log("🚀 Submitting assignment:", {
        batchId,
        facultyIds
    });

    // ❌ prevent empty submit
    if (facultyIds.length === 0) {
        alert("Please select at least one faculty");
        return;
    }

    try {

        const res = await authFetch(`${window.BASE_URL}/batch/faculty/assign-bulk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                batchId,
                facultyIds
            })
        });

        const data = await res.json();

        console.log("📦 Response:", data);

        if (!data.success) {
            alert(data.message || "Assignment failed");
            return;
        }

        alert("✅ Faculties assigned successfully");

        // ==============================
        // 🔥 AUTO CLEANUP + REFRESH
        // ==============================

        // 1. clear selection
        SELECTED_FACULTIES.clear();

        // 2. refresh UI from backend (source of truth)
        await loadFacultyCheckboxUI(batchId);

        // 3. optional: close modal (if you want UX improvement)
        // document.getElementById("facultyModal").style.display = "none";

        console.log("✅ SET SIZE AFTER CLEAR:", SELECTED_FACULTIES.size);

    } catch (err) {

        console.error("❌ Submit Error:", err);
        alert("Server error while assigning faculties");
    }
}

function closeFacultyModal() {
    const modal = document.getElementById("facultyModal");
    if (modal) modal.style.display = "none";
}