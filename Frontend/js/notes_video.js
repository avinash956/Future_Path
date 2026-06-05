console.log("✅ notes_video.js LOADED");

/* =========================================
AUTH FETCH (with error handling)
========================================= */
function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    return fetch(url, {
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            "Authorization": token ? `Bearer ${token}` : "",
            ...options.headers
        }
    }).then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
        }
        return res;
    });
}

/* =========================================
ROLE CHECK
========================================= */
function canUploadMaterial() {
    const role = localStorage.getItem("role");
    return ["admin", "manager", "faculty"].includes(role);
}

/* =========================================
INITIALIZE MODULE
========================================= */
function initializeNotesVideo() {
    console.log("🚀 Notes & Video Module Initializing...");

    loadBatchesForSelect();
    loadMaterials();

    const form = document.querySelector(".notes-form");
    if (form) {
        if (!canUploadMaterial()) {
            form.style.display = "none"; // hide upload form for students
        } else {
            form.addEventListener("submit", uploadMaterial);
        }
    }
}

/* =========================================
LOAD BATCHES
========================================= */
async function loadBatchesForSelect() {
    const select = document.getElementById("batchSelect");
    if (!select) return;

    try {
        // ✅ FIX: avoid double /api/api
        const res = await authFetch(`${window.BASE_URL}/batch/get-batch`);
        const data = await res.json();

        const batches = data.data || [];
        const activeBatches = batches.filter(b => b.isActive === true);

        select.innerHTML = `<option value="">Select Batch</option>`;
        activeBatches.forEach(batch => {
            const option = document.createElement("option");
            option.value = batch._id; // store ObjectId
            option.textContent = `${batch.name} (${batch.code})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("❌ Batch load error:", err);
        alert("Failed to load batches. Please check server and CORS settings.");
    }
}

/* =========================================
LOAD MATERIALS
========================================= */
function escapeHTML(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
async function loadMaterials() {
    const container = document.getElementById("materialsList");
    if (!container) return;

    try {
        // ✅ FIX: avoid double /api/api
        const res = await authFetch(`${window.BASE_URL}/materials/get-materials`);
        console.log("res :", res);
        // const data = await res.json();
        const text = await res.text();
        console.log("RAW RESPONSE:", text);

        const data = JSON.parse(text); // force check
        if (!data.success) {
            container.innerHTML = "<p>No materials found</p>";
            return;
        }

        const materials = data.materials || [];
        console.log("Container:", container);
        console.log("Materials:", materials);
        console.log("Material Count:", materials.length);
        container.innerHTML = materials.map(mat => `
            <div class="card">
                <h3>${escapeHTML(mat.title || "Untitled Material")}</h3>
                <p><b>Batch:</b> ${mat.batch_name || mat.batch_code || "N/A"}</p>
                <p>${escapeHTML(mat.description || "")}</p>
                <div style="display:flex; gap:10px;">

    ${mat.file ? `
       <button onclick="viewMaterial('${window.BASE_URL}${mat.file}')">
    View
</button>

<a href="${window.BASE_URL}${mat.file}"
   target="_blank">
    Download
</a>

    ` : ""}

    ${mat.videoUrl ? `
        <button onclick="window.open('${mat.videoUrl}','_blank')">
            Watch
        </button>
    ` : ""}

    ${canUploadMaterial() ? `
    <button onclick="deleteMaterial('${mat._id}')">
        Delete
    </button>
` : ""}

</div>   <!-- buttons div -->

</div>   <!-- card div -->
`).join("");
        
    } catch (err) {
    console.error("❌ Load materials error:", err);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
}
}

/* =========================================
VIEW MATERIAL
========================================= */
function viewMaterial(url) {
    window.open(url, "_blank");
}

/* =========================================
UPLOAD MATERIAL
========================================= */
async function uploadMaterial(e) {
    e.preventDefault();

    if (!canUploadMaterial()) {
        alert("❌ Not allowed to upload materials");
        return;
    }

    const form = document.querySelector(".notes-form");
    const formData = new FormData(form);

    try {
        // ✅ FIX: avoid double /api/api
        const res = await authFetch(`${window.BASE_URL}/materials/add-material`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            alert("✅ Material uploaded successfully");
            form.reset();
            loadMaterials();
        } else {
            alert("❌ Upload failed: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        console.error("❌ Upload error:", err);
        alert("Upload failed. Please check server and CORS settings.");
    }
}

const materials = data.materials || [];

materials.forEach((m, i) => {
    console.log(`Material ${i}:`, m);
});

container.innerHTML = "<h3>Test Render Working</h3>";

async function deleteMaterial(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this material?"
    );

    if (!confirmed) return;

    try {

        const res = await authFetch(
            `${window.BASE_URL}/materials/delete-material/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await res.json();

        if (data.success) {

            alert("✅ Material deleted");

            loadMaterials();

        } else {

            alert("❌ " + data.message);

        }
        
    } catch (err) {

        console.error(err);

        alert("Failed to delete material");

    }
}