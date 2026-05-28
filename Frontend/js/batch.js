/* =========================================
MODERN BATCH MODULE (FLASK + MONGO COMPATIBLE)
========================================= */

console.log("✅ batch.js LOADED");

/* =========================================
GLOBAL STATE
========================================= */

window.USER_ROLE = localStorage.getItem("role") || "student";
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
    if (form) form.addEventListener("submit", addBatch);

    const batchNameInput = document.getElementById("batchName");
    if (batchNameInput) {
        batchNameInput.addEventListener("input", generateBatchCode);
    }

    loadBatch();

    console.log("🔐 ROLE:", window.USER_ROLE);
}

/* =========================================
FETCH BATCHES (WITH SEARCH + PAGINATION)
COMPATIBLE: GET /batch/get-batch
========================================= */

async function loadBatch(page = 1, search = "", status = "") {

    const container = document.getElementById("batchList");
    if (!container) return;

    container.innerHTML = "Loading...";

    try {

        const url = `${window.BASE_URL}/batch/get-batch?page=${page}&limit=${LIMIT}&search=${search}&status=${status}`;

        const res = await authFetch(url);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = "Failed to load batches";
            return;
        }

        BATCH_CACHE = data.data || [];
        CURRENT_PAGE = data.pagination.page;
        TOTAL_PAGES = data.pagination.pages;

        renderBatch(BATCH_CACHE);
        renderPagination();

    } catch (err) {
        console.error("❌ loadBatch error:", err);
        container.innerHTML = "Error loading batches";
    }
}

/* =========================================
RENDER BATCH CARDS
========================================= */

function renderBatch(items) {

    const container = document.getElementById("batchList");

    if (!items.length) {
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
                                <button class="${isActive ? 'deactivate-btn' : 'activate-btn'}"
                                    onclick="toggleBatch('${item._id}')">
                                    ${isActive ? "Deactivate" : "Activate"}
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
PAGINATION UI
========================================= */

function renderPagination() {

    const container = document.getElementById("batchPagination");
    if (!container) return;

    container.innerHTML = `
        <div class="pagination">

            <button onclick="changePage(${CURRENT_PAGE - 1})"
                ${CURRENT_PAGE <= 1 ? "disabled" : ""}>
                Prev
            </button>

            <span>Page ${CURRENT_PAGE} of ${TOTAL_PAGES}</span>

            <button onclick="changePage(${CURRENT_PAGE + 1})"
                ${CURRENT_PAGE >= TOTAL_PAGES ? "disabled" : ""}>
                Next
            </button>

        </div>
    `;
}

/* =========================================
CHANGE PAGE
========================================= */

function changePage(page) {
    if (page < 1 || page > TOTAL_PAGES) return;
    loadBatch(page);
}

/* =========================================
GENERATE BATCH CODE (CACHE OPTIMIZED)
========================================= */

async function generateBatchCode() {

    const name = document.getElementById("batchName")?.value.trim();
    const codeInput = document.getElementById("batchCode");

    if (!name || !codeInput) {
        if (codeInput) codeInput.value = "";
        return;
    }

    const year = new Date().getFullYear().toString().slice(-2);

    const matching = BATCH_CACHE.filter(b =>
        b.code && b.code.startsWith(`${name}-${year}-`)
    );

    let nextSerial = 1;

    if (matching.length > 0) {
        const serials = matching.map(b => {
            const parts = b.code.split("-");
            return parseInt(parts[parts.length - 1]) || 0;
        });

        nextSerial = Math.max(...serials) + 1;
    }

    codeInput.value = `${name}-${year}-${String(nextSerial).padStart(2, "0")}`;
}

/* =========================================
ADD BATCH
COMPATIBLE: POST /batch/add-batch
========================================= */

async function addBatch(e) {

    e.preventDefault();

    const form = document.getElementById("batchForm");

    const formData = new FormData();

    const map = {
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

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) formData.append(map[id], el.value.trim());
    });

    try {

        const res = await authFetch(`${window.BASE_URL}/batch/add-batch`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {

            form.reset();
            document.getElementById("batchCode").value = "";

            loadBatch(CURRENT_PAGE);

        }

    } catch (err) {
        console.error("❌ addBatch error:", err);
    }
}

/* =========================================
TOGGLE BATCH
COMPATIBLE: PATCH /batch/toggle-batch/:id
========================================= */
async function toggleBatch(id) {
    try {
        // Strips extra slashes cleanly before appending routes
const baseUrlClean = window.BASE_URL ? window.BASE_URL.replace(/\/+$/, '') : '/api';
const res = await authFetch(`${baseUrlClean}/batch/toggle-batch/${id}`, { method: "PATCH" });


        // Fetch API does not throw an error on 4xx/500 responses, we must check res.ok manually
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Server responded with status code: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
            // Re-render UI list layout with refreshed state
            if (typeof loadBatch === 'function') {
                loadBatch(CURRENT_PAGE);
            }
            if (typeof showSuccess === 'function') {
                showSuccess(data.message || "Batch status toggled successfully!");
            }
        } else {
            if (typeof showMessage === 'function') showMessage(data.message || "Could not toggle batch.");
        }

    } catch (err) {
        console.error("❌ toggleBatch error:", err);
        if (typeof showMessage === 'function') {
            showMessage(err.message || "Network communication failed. Please try again.");
        } else {
            alert(err.message || "Network communication failed. Please try again.");
        }
    }
}

/* =========================================
DELETE BATCH (SOFT DELETE BACKEND)
========================================= */

async function deleteBatch(id) {

    const confirmDelete = confirm("Are you sure you want to delete this batch?");
    if (!confirmDelete) return;

    try {

        const res = await authFetch(
            `${window.BASE_URL}/batch/delete-batch/${id}`,
            { method: "DELETE" }
        );

        const data = await res.json();

        if (data.success) {
            loadBatch(CURRENT_PAGE);
        }

    } catch (err) {
        console.error("❌ deleteBatch error:", err);
    }
}

/* =========================================
SEARCH (BACKEND + FRONTEND HYBRID)
========================================= */

function searchBatch() {

    const value = document.getElementById("batchSearch")?.value || "";

    // backend search reload
    loadBatch(1, value, "");
}