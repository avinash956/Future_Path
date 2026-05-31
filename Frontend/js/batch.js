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

                                <button class="delete-btn"
                                    onclick="deleteBatch('${item._id}')">
                                    Delete
                                </button>

                                ${window.USER_ROLE === "admin" ? `
                                    <button
                                        class="${isActive ? 'deactivate-btn' : 'activate-btn'}"
                                        onclick="toggleBatch('${item._id}')">
                                        ${isActive ? "Deactivate" : "Activate"}
                                    </button>
                                ` : ""}

                                <button class="download-btn"
                                    onclick="downloadBatchStudents('${item._id}','${item.name}')">
                                    Download Students
                                </button>

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