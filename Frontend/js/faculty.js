/* =========================================
FACULTY MODULE FULL DEBUG VERSION
UPDATED + AUTO FACULTY ID GENERATION
========================================= */

console.log("✅ faculty.js FILE LOADED");


/* =========================================
AUTO GENERATE FACULTY ID
========================================= */

async function generateFacultyId() {

    try {

        const deptSelect =
            document.getElementById("facultyDepartment");

        const facultyIdInput =
            document.getElementById("facultyId");

        if (!deptSelect || !facultyIdInput) {

            console.error("❌ Department or Faculty ID field missing");

            return;
        }

        const department = deptSelect.value;

        if (!department) {

            facultyIdInput.value = "";

            return;
        }

        // =========================================
        // DEPARTMENT LETTER
        // =========================================

        let deptLetter = "X";

        if (department === "Academic") {

            deptLetter = "A";

        } else if (department === "Competitive") {

            deptLetter = "C";

        } else if (department === "Technical") {

            deptLetter = "T";

        }

        // =========================================
        // GET FACULTY DATA
        // =========================================

        const res = await authFetch(
            `${window.BASE_URL}/faculty/get-faculty`
        );

        const data = await res.json();

        const facultyList = data.faculty || [];

        // =========================================
        // FILTER SAME DEPARTMENT IDS
        // =========================================

        const sameDept = facultyList.filter(f => {

            return (
                f.facultyId &&
                f.facultyId.startsWith(`FP-${deptLetter}-`)
            );

        });

        // =========================================
        // FIND MAX SERIAL
        // =========================================

        let max = 0;

        sameDept.forEach(f => {

            const parts = f.facultyId.split("-");

            if (parts.length === 3) {

                const num = parseInt(parts[2]);

                if (!isNaN(num) && num > max) {

                    max = num;

                }

            }

        });

        // =========================================
        // NEXT NUMBER
        // =========================================

        const next = max + 1;

        const serial =
            String(next).padStart(3, "0");

        // =========================================
        // FINAL ID
        // =========================================

        facultyIdInput.value =
            `FP-${deptLetter}-${serial}`;

        console.log(
            "✅ Generated Faculty ID:",
            facultyIdInput.value
        );

    } catch (err) {

        console.error("❌ Faculty ID generation failed");

        console.error(err);

    }

}


/* =========================================
INITIALIZE FACULTY MODULE
========================================= */

function initializeFaculty() {

    // =====================================
    // PREVENT DOUBLE INITIALIZATION
    // =====================================
    if (window.facultyInitialized) {
        console.log("⚠️ Faculty already initialized - skipping");
        return;
    }
    window.facultyInitialized = true;

    console.log("🚀 Initializing Faculty Module");

    // Always load faculty cards
    loadFaculty();

    const form = document.getElementById("facultyForm");

    if (form) {

        console.log("✅ facultyForm FOUND");

        // attach form events here

    } else {

        console.warn("⚠️ facultyForm NOT FOUND");
    }


    // =========================================
    // AUTO GENERATE ID ON DEPARTMENT CHANGE
    // =========================================

    const departmentSelect =
        document.getElementById("facultyDepartment");

    if (departmentSelect) {

        departmentSelect.addEventListener(
            "change",
            generateFacultyId
        );

        console.log(
            "✅ Department change listener attached"
        );

    } else {

        console.error(
            "❌ facultyDepartment dropdown not found"
        );

    }


    // =========================================
    // MAKE FACULTY ID READONLY
    // =========================================

    const facultyIdInput =
        document.getElementById("facultyId");

    if (facultyIdInput) {

        facultyIdInput.setAttribute(
            "readonly",
            true
        );

    }


    // =========================================
    // REMOVE OLD LISTENER SAFELY
    // =========================================

    const newForm = form.cloneNode(true);

    form.parentNode.replaceChild(newForm, form);

    console.log("✅ Fresh faculty form created");


    // =========================================
    // RE-ATTACH CHANGE EVENT AFTER CLONE
    // =========================================

    const newDepartmentSelect =
        document.getElementById("facultyDepartment");

    if (newDepartmentSelect) {

        newDepartmentSelect.addEventListener(
            "change",
            generateFacultyId
        );

    }


    // =========================================
    // SAFE SUBMIT
    // =========================================

    newForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        e.stopPropagation();

        console.log("🔥 FORM SUBMIT EVENT FIRED");

        await addFaculty(e);

        return false;

    });

    console.log("✅ Faculty submit listener attached");


    // =========================================
    // SUBMIT BUTTON DEBUG
    // =========================================

    const submitBtn =
        newForm.querySelector("button[type='submit']");

    if (submitBtn) {

        console.log("✅ Submit button detected");

        submitBtn.addEventListener("click", () => {

            console.log("🖱 Submit button clicked");

        });

    }


    // =========================================
    // LOAD FACULTY LIST
    // =========================================

    loadFaculty();

}


/* =========================================
ADD FACULTY
========================================= */

async function addFaculty(e) {
    console.log("🔥 addFaculty CALLED");

    console.log("🔥 ADD FACULTY FUNCTION STARTED");

    if (e) {

        e.preventDefault();

    }

    try {

        // =========================================
        // FORM ELEMENT
        // =========================================

        const formElement =
            document.getElementById("facultyForm");

        if (!formElement) {

            console.error(
                "❌ facultyForm missing inside addFaculty()"
            );

            return;
        }

        console.log("✅ Form element found");

        // =========================================
        // CREATE FORM DATA
        // =========================================

        const formData = new FormData();

        // =========================================
        // FIELD MAPPING
        // =========================================

        const fields = [
            "facultyName",
            "facultyId",
            "facultyEmail",
            "facultyPhone",
            "facultyDepartment",
            "facultyDesignation",
            "facultyExperience",
            "facultyStatus",
            "facultyBio"
        ];

        const backendKeys = [
            "name",
            "facultyId",
            "email",
            "phone",
            "department",
            "post",
            "experience",
            "status",
            "description"
        ];

        // =========================================
        // APPEND TEXT FIELDS
        // =========================================

        fields.forEach((id, i) => {

            const el = document.getElementById(id);

            if (!el) {

                console.error(`❌ Missing field: ${id}`);

            } else {

                console.log(
                    `📦 ${backendKeys[i]} =`,
                    el.value
                );

                formData.append(
                    backendKeys[i],
                    el.value.trim()
                );

            }

        });

        // =========================================
        // VALIDATION
        // =========================================

        if (
            !document.getElementById("facultyName").value.trim()
        ) {

            alert("Faculty name is required");

            return;
        }

        if (
            !document.getElementById("facultyDepartment").value
        ) {

            alert("Please select department");

            return;
        }


        // =========================================
        // IMAGE FIELD
        // =========================================

        const imageInput =
            document.getElementById("facultyImage");

        if (!imageInput) {

            console.error(
                "❌ facultyImage input not found"
            );

        } else {

            console.log("✅ facultyImage input found");

            if (imageInput.files.length > 0) {

                console.log(
                    "🖼 Image selected:",
                    imageInput.files[0].name
                );

                formData.append(
                    "image",
                    imageInput.files[0]
                );

            } else {

                console.warn("⚠️ No image selected");

            }

        }

        // =========================================
        // API URL
        // =========================================

        const apiURL =
            `${window.BASE_URL}/faculty/add-faculty`;

        console.log("🌐 API URL:", apiURL);

        // =========================================
        // SEND REQUEST
        // =========================================

        console.log(
            "📡 Sending request to backend..."
        );

        const res = await authFetch(apiURL, {
            method: "POST",
            body: formData
        });

        console.log("📡 Response received");

        console.log(
            "📡 Response status:",
            res.status
        );

        // =========================================
        // RAW RESPONSE
        // =========================================

        const rawText = await res.text();

        console.log("📄 RAW RESPONSE:");

        console.log(rawText);

        // =========================================
        // JSON PARSE
        // =========================================

        let data;

        try {

            data = JSON.parse(rawText);

            console.log("✅ JSON Parsed:", data);

        } catch (jsonErr) {

            console.error("❌ JSON Parse Error");

            console.error(jsonErr);

            alert("Server returned invalid JSON");

            return;
        }

        // =========================================
        // SUCCESS
        // =========================================

        if (data.success) {

            console.log(
                "✅ Faculty Added Successfully"
            );

            alert(
                "✅ Faculty Added Successfully"
            );

            formElement.reset();

            // CLEAR ID AFTER RESET
            const facultyIdInput =
                document.getElementById("facultyId");

            if (facultyIdInput) {

                facultyIdInput.value = "";

            }

            loadFaculty();

        } else {

            console.error(
                "❌ Backend returned failure"
            );

            alert(
                data.message ||
                "Faculty add failed"
            );

        }

    } catch (err) {

        console.error("❌ ADD FACULTY ERROR");

        console.error(err);

        alert("Backend not reachable");

    }

}


/* =========================================
LOAD FACULTY
========================================= */

async function loadFaculty() {
    console.log("📥 Loading faculty list...");

    const container = document.getElementById("facultyList");

    if (!container) {
        console.error("❌ facultyList container not found");
        return;
    }

    container.innerHTML = "<p>Loading faculty...</p>";

    try {

        const apiURL = `${window.BASE_URL}/faculty/get-faculty`;

        console.log("🌐 GET API:", apiURL);

        const res = await authFetch(apiURL);

        console.log("📡 Response Status:", res.status);

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }

        const data = await res.json();

        console.log("📄 Faculty Data:", data);

        // Supports:
        // { faculties: [...] }
        // { faculty: [...] }
        // [ ... ]

        const items =data.faculties ||data.faculty ||(Array.isArray(data) ? data : []);

        console.log("📊 Faculty Count:", items.length);
        console.table(items);

        // =========================================
        // NO FACULTY FOUND
        // =========================================

        if (!items.length) {

            container.innerHTML = `
                <div class="empty-message">
                    <i class="fa-solid fa-users"></i>
                    <h3>No Faculty Found</h3>
                    <p>Add faculty members to display here.</p>
                </div>
            `;

            return;
        }

        // =========================================
        // GENERATE CARDS
        // =========================================

        let html = `<div class="faculty-grid">`;

        items.forEach(item => {

            const imageURL = item.image
                ? `${window.BASE_URL}/faculty/uploads/${item.image}`
                : "https://via.placeholder.com/120x120?text=Faculty";

            html += `

                <div class="faculty-card">

                    <div class="faculty-image-wrapper">

                        <img
                            src="${imageURL}"
                            alt="Faculty Image"
                            class="faculty-image"
                            onerror="this.src='https://via.placeholder.com/120x120?text=Faculty';"
                        >

                    </div>

                    <div class="faculty-info">

                        <h3>${item.name || "No Name"}</h3>

                        <p>
                            <strong>ID:</strong>
                            ${item.facultyId || "N/A"}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${item.email || "N/A"}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${item.phone || "N/A"}
                        </p>

                        <p>
                            <strong>Department:</strong>
                            ${item.department || "N/A"}
                        </p>

                        <p>
                            <strong>Designation:</strong>
                            ${item.post || item.designation || "N/A"}
                        </p>

                        <p>
                            <strong>Experience:</strong>
                            ${item.experience || 0} Years
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${item.status || "Inactive"}
                        </p>

                        <div class="faculty-actions">

                            <button
                                class="download-btn"
                                onclick="downloadFacultyCard('${item._id}')"
                            >
                                <i class="fa-solid fa-id-card"></i>
                                ID Card
                            </button>

                            <button
                                class="delete-btn"
                                onclick="deleteFaculty('${item._id}')"
                            >
                                <i class="fa-solid fa-trash"></i>
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            `;
        });

        html += `</div>`;

        container.innerHTML = html;

        console.log("✅ Faculty loaded successfully");

    } catch (error) {

        console.error("❌ LOAD FACULTY ERROR:", error);

        container.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Error loading faculty data</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}


/* =========================================
DELETE FACULTY
========================================= */

async function deleteFaculty(id) {

    console.log("🗑 Delete faculty:", id);

    const confirmDelete =
        confirm("Are you sure you want to delete this faculty?");

    if (!confirmDelete) return;

    try {

        const apiURL =
            `${window.BASE_URL}/faculty/delete-faculty/${id}`;

        console.log("🌐 DELETE API:", apiURL);

        const res = await authFetch(apiURL, {
            method: "DELETE"
        });

        console.log(
            "📡 DELETE STATUS:",
            res.status
        );

        const data = await res.json();

        console.log(
            "📄 DELETE RESPONSE:",
            data
        );

        if (data.success) {

            alert("Deleted Successfully");

            loadFaculty();

        } else {

            alert(
                data.message ||
                "Delete failed"
            );

        }

    } catch (err) {

        console.error("❌ DELETE ERROR");

        console.error(err);

        alert("Delete error");

    }

}


/* =========================================
SEARCH FACULTY
========================================= */

window.searchFaculty = function () {

    console.log(
        "🔍 Faculty search triggered"
    );

    const searchInput =
        document.getElementById("facultySearch");

    if (!searchInput) {

        console.error(
            "❌ facultySearch input missing"
        );

        return;
    }

    const input =
        searchInput.value.toLowerCase();

    const cards =
        document.querySelectorAll(".faculty-card");

    console.log(
        "📄 Total cards:",
        cards.length
    );

    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();

        card.style.display =
            text.includes(input)
                ? "flex"
                : "none";

    });

};


/* =========================================
AUTO INITIALIZE
========================================= */

// document.addEventListener(
//     "DOMContentLoaded",
//     function () {

//         console.log(
//             "📄 DOM CONTENT LOADED"
//         );

//         if (
//             document.getElementById("facultyForm")
//         ) {

//             initializeFaculty();

//         }

//     }
// );


/* =========================================
FACULTY ID CARD GENERATION & DOWNLOAD
========================================= */

function createFacultyCardHTML(faculty) {

    const img = faculty.image
        ? `http://127.0.0.1:5000/uploads/${faculty.image}`
        : "https://via.placeholder.com/120x120?text=Faculty";

    return `
    <div id="facultyIdCard"
        style="
        width:350px;
        height:220px;
        border-radius:12px;
        overflow:hidden;
        font-family:Arial,sans-serif;
        border:2px solid #1e1e1e;
        background:linear-gradient(135deg,#0f172a,#1e293b);
        color:white;
        position:relative;
        ">

        <!-- HEADER -->

        <div
            style="
                background:linear-gradient(135deg,#046358,#290246);
                padding:10px;
                display:flex;
                align-items:center;
                gap:auto;
            "
        >

            <!-- LOGO -->

            <img
                src="Logo.png"
                class="logo"
                crossorigin="anonymous"
                style="
                    width:72px;
                    height:72px;
                    border-radius:22px;
                    object-fit:cover;
                    box-shadow:0 12px 35px rgba(0,0,0,0.35);
                    background:white;
                "
            />

            <!-- INSTITUTE INFO -->

            <div style="flex:1;text-align:center;">

                <h3
                    style="
                        margin:0;
                        font-size:16px;
                        font-weight:bold;
                        color:gold;
                    "
                >
                    FuturePath EduTech Institute
                </h3>

                <p
                    style="
                        margin:4px 0;
                        font-size:12px;
                    "
                >
                    -------------------------------
                </p>

                <h4
                    style="
                        margin:0;
                        font-size:14px;
                        color:white;
                    "
                >
                    FACULTY ID CARD
                </h4>

            </div>

        </div>

        <!-- BODY -->

        <div
            style="
                display:flex;
                padding:12px;
                gap:12px;
            "
        >

            <!-- IMAGE -->

            <img
                src="${img}"
                crossorigin="anonymous"
                style="
                    width:90px;
                    height:90px;
                    border-radius:10px;
                    object-fit:cover;
                    border:2px solid white;
                "
            />

            <!-- DETAILS -->

            <div
                style="
                    font-size:12px;
                    line-height:1.6;
                "
            >

                <div>
                    <b>Name:</b>
                    ${faculty.name || ""}
                </div>

                <div>
                    <b>ID:</b>
                    ${faculty.facultyId || ""}
                </div>

                <div>
                    <b>Department:</b>
                    ${faculty.department || ""}
                </div>

                <div>
                    <b>Post:</b>
                    ${faculty.post || ""}
                </div>

                <div>
                    <b>Phone:</b>
                    ${faculty.phone || ""}
                </div>

            </div>

        </div>

        <!-- FOOTER -->

        <div
            style="
                position:absolute;
                bottom:0;
                width:100%;
                background:#111827;
                padding:6px;
                font-size:10px;
                text-align:center;
            "
        >
        </div>

    </div>
    `;
}

/* =========================
DOWNLOAD FACULTY CARD
========================= */

async function downloadFacultyCard(id) {

    try {

        console.log("📌 Download request for ID:", id);

        /* =========================
        STEP 1: GET FACULTY FROM CACHE OR API
        ========================= */

        let faculty = window.facultyCache?.find(f => f._id === id);

        if (!faculty) {

            console.warn("⚠️ Not in cache, fetching from API...");

            const res = await authFetch(`${window.BASE_URL}/faculty/get-faculty`);
            const data = await res.json();

            const list = data.faculty || data.faculties || [];

            faculty = list.find(f => f._id === id);
        }

        if (!faculty) {
            alert("Faculty data not found");
            return;
        }

        console.log("✅ Faculty found:", faculty);

        /* =========================
        STEP 2: CREATE TEMP CONTAINER
        ========================= */

        const container = document.createElement("div");

        container.style.position = "fixed";
        container.style.top = "50%";
        container.style.left = "50%";
        container.style.transform = "translate(-50%, -50%)";
        container.style.zIndex = "999999";
        container.style.background = "white";
        container.style.padding = "10px";

        document.body.appendChild(container);

        container.innerHTML = createFacultyCardHTML(faculty);

        const card = container.firstElementChild;

        /* =========================
        STEP 3: WAIT FOR IMAGES
        ========================= */

        const images = card.querySelectorAll("img");

        for (const img of images) {

            if (!img.complete) {
                await new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        /* =========================
        STEP 4: GENERATE PDF
        ========================= */

        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [350, 220]
        });

        pdf.addImage(imgData, "JPEG", 0, 0, 350, 220);

        pdf.save(`${faculty.name || "faculty"}_ID_Card.pdf`);

        /* =========================
        STEP 5: CLEANUP
        ========================= */

        document.body.removeChild(container);

        console.log("✅ PDF downloaded successfully");

    } catch (err) {

        console.error("❌ PDF ERROR:", err);
        alert("PDF download failed");
    }
}