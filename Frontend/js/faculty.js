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

    console.log("🚀 Initializing Faculty Module");

    const form = document.getElementById("facultyForm");

    if (!form) {

        console.error("❌ facultyForm NOT FOUND");

        return;
    }

    console.log("✅ facultyForm FOUND");


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

    const container =
        document.getElementById("facultyList");

    if (!container) {

        console.error(
            "❌ facultyList container not found"
        );

        return;
    }

    container.innerHTML =
        "Loading faculty...";

    try {

        const apiURL =
            `${window.BASE_URL}/faculty/get-faculty`;

        console.log("🌐 GET API:", apiURL);

        const res = await authFetch(apiURL);

        console.log(
            "📡 GET response:",
            res.status
        );

        const rawText = await res.text();

        console.log("📄 RAW RESPONSE:", rawText);

        let data;

        try {

            data = JSON.parse(rawText);

        } catch (err) {

            console.error("❌ Invalid JSON");

            container.innerHTML =
                "Invalid server response";

            return;
        }

        console.log("📄 Faculty data:", data);

        const items = data.faculty || [];

        // =========================================
        // NO FACULTY
        // =========================================

        if (!items.length) {

            console.warn("⚠️ No faculty found");

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
        // FACULTY CARDS
        // =========================================

        container.innerHTML = `

            <div class="faculty-grid">

                ${items.map(item => `

                    <div class="faculty-card">

                        <!-- IMAGE -->

                        <div class="faculty-image-wrapper">

                            <img
                                src="http://127.0.0.1:5000/uploads/${item.image || ''}"
                                alt="Faculty Image"
                                class="faculty-image"

                                onerror="
                                    this.onerror=null;
                                    this.src='https://via.placeholder.com/120x120?text=Faculty';
                                "
                            >

                        </div>

                        <!-- INFO -->

                        <div class="faculty-info">

                            <h3>
                                ${item.name || "No Name"}
                            </h3>

                            <p>
                                <i class="fa-solid fa-id-card"></i>

                                <strong>ID:</strong>

                                ${item.facultyId || "N/A"}
                            </p>

                            <p>
                                <i class="fa-solid fa-envelope"></i>

                                <strong>Email:</strong>

                                ${item.email || "N/A"}
                            </p>

                            <p>
                                <i class="fa-solid fa-phone"></i>

                                <strong>Phone:</strong>

                                ${item.phone || "N/A"}
                            </p>

                            <p>
                                <i class="fa-solid fa-building"></i>

                                <strong>Department:</strong>

                                ${item.department || "N/A"}
                            </p>

                            <p>
                                <i class="fa-solid fa-user-tie"></i>

                                <strong>Designation:</strong>

                                ${item.post || "N/A"}
                            </p>

                            <p>
                                <i class="fa-solid fa-briefcase"></i>

                                <strong>Experience:</strong>

                                ${item.experience || 0} Years
                            </p>

                            <p>
                                <i class="fa-solid fa-circle-check"></i>

                                <strong>Status:</strong>

                                ${item.status || "inactive"}
                            </p>

                            <!-- ACTIONS -->

                            <div class="faculty-actions">

                                <!-- DOWNLOAD ID CARD -->

                                <button
                                    class="download-btn"
                                    onclick='downloadFacultyCard(${JSON.stringify(item)})'
                                >

                                    <i class="fa-solid fa-id-card"></i>

                                    ID Card

                                </button>

                                <!-- DELETE -->

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

                `).join("")}

            </div>

        `;

        console.log("✅ Faculty loaded successfully");

    } catch (err) {

        console.error("❌ LOAD FACULTY ERROR");

        console.error(err);

        container.innerHTML = `

            <div class="error-message">

                <i class="fa-solid fa-triangle-exclamation"></i>

                Error loading faculty data

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

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "📄 DOM CONTENT LOADED"
        );

        if (
            document.getElementById("facultyForm")
        ) {

            initializeFaculty();

        }

    }
);


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


/* =========================================
DOWNLOAD FACULTY CARD
========================================= */

async function downloadFacultyCard(faculty) {

    try {

        /* =========================
        STEP 1: CREATE TEMP CONTAINER
        ========================= */

        const container = document.createElement("div");

        container.style.position = "fixed";
        container.style.top = "50%";
        container.style.left = "50%";
        container.style.transform = "translate(-50%, -50%)";
        container.style.zIndex = "999999";
        container.style.background = "#8e93f4";
        container.style.padding = "10px";
        container.style.color = "black";

        document.body.appendChild(container);

        container.innerHTML = createFacultyCardHTML(faculty);

        const card = container.firstElementChild;

        /* =========================
        STEP 2: FORCE STABLE STYLES
        ========================= */

        card.style.background = "#8677f3";
        card.style.color = "black";
        card.style.border = "2px solid #4606f6";

        const images = card.querySelectorAll("img");

        for (const img of images) {

            img.crossOrigin = "anonymous";

            if (!img.complete) {

                await new Promise(resolve => {

                    img.onload = resolve;
                    img.onerror = resolve;

                });

            }

        }

        /* =========================
        STEP 3: WAIT FOR RENDER
        ========================= */

        await new Promise(resolve => setTimeout(resolve, 300));

        await new Promise(requestAnimationFrame);

        /* =========================
        STEP 4: PDF GENERATION (Using jsPDF & html2canvas)
        ========================= */

        // Capture the card element using your specific html2canvas settings
        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0
        });

        // Convert canvas data to a JPEG image asset matching your original settings
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // Initialize jsPDF using the global UMD module namespace
        const { jsPDF } = window.jspdf;
        
        // Define dimensions based on your opt.jsPDF array: [width, height] in pixels
        const cardWidth = 350;
        const cardHeight = 220;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [cardWidth, cardHeight]
        });

        // Draw the image exactly spanning the custom dimensions of the canvas area
        pdf.addImage(imgData, 'JPEG', 0, 0, cardWidth, cardHeight);
        
        // Finalize and prompt the client browser window to download
        pdf.save(`${faculty.name}_ID_Card.pdf`);

        /* =========================
        STEP 5: CLEANUP
        ========================= */

        document.body.removeChild(container);

        console.log("✅ Faculty ID Card Downloaded");

    } catch (err) {

        console.error("❌ PDF generation failed:", err);

        alert("PDF download failed. Check console.");

    }

}