/* =========================================
STUDENT MODULE FINAL FIXED VERSION
========================================= */

console.log("✅ student.js FILE LOADED");

/* =========================================
INITIALIZE
========================================= */

function initializeStudent() {

    console.log("🚀 Initializing Student Module");

    const form = document.getElementById("studentForm");

    if (!form) {
        console.error("❌ studentForm NOT FOUND");
        return;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        await addStudent(e);
    });

    const batchSelect = document.getElementById("studentBatch");
    if (batchSelect) {
        batchSelect.addEventListener("change", generateRollNumber);
    }

    loadBatchOptions();
    loadStudent();
}

/* =========================================
LOAD BATCH OPTIONS
========================================= */

async function loadBatchOptions() {

    const batchSelect = document.getElementById("studentBatch");
    if (!batchSelect) return;

    try {

        const res = await authFetch(`${window.BASE_URL}/batch/get-batch`);
        const data = await res.json();

        const batches = data.data || [];

        batchSelect.innerHTML = `<option value="">Select Batch</option>`;

        batches.forEach(batch => {
            batchSelect.innerHTML += `
                <option value="${batch.code}">
                    ${batch.name} (${batch.code})
                </option>
            `;
        });

    } catch (err) {
        console.error("❌ Batch load error:", err);
    }
}

/* =========================================
ROLL NUMBER GENERATION
========================================= */

async function generateRollNumber() {

    const batchSelect = document.getElementById("studentBatch");
    const rollInput = document.getElementById("studentRoll");

    if (!batchSelect || !rollInput) return;

    const batchCode = batchSelect.value;
    const batchName = batchSelect.options[batchSelect.selectedIndex]?.text.split(" (")[0];

    if (!batchCode) {
        rollInput.value = "";
        return;
    }

    try {

        const res = await authFetch(`${window.BASE_URL}/student/get-student`);
        const data = await res.json();

        const students = data.students || [];

        const year = new Date().getFullYear().toString().slice(-2);

        const batchSerial = batchCode.split("-")[2] || "01";

        const batchStudents = students.filter(s => s.batch === batchCode);

        const serials = batchStudents.map(s => {
            const parts = (s.roll || "").split("-");
            return parseInt(parts?.[3] || 0);
        });

        const nextStudentSerial =
            String((Math.max(0, ...serials) + 1)).padStart(2, "0");

        rollInput.value = `${batchName}-${year}-${batchSerial}-${nextStudentSerial}`;

    } catch (err) {
        console.error("❌ Roll generation error:", err);
    }
}

/* =========================================
ADD STUDENT (IMAGE SAFE)
========================================= */

async function addStudent(e) {

    e.preventDefault();

    const formElement = document.getElementById("studentForm");

    if (formElement.dataset.submitting === "true") return;
    formElement.dataset.submitting = "true";

    const formData = new FormData();

    const fields = [
        "studentName",
        "studentRoll",
        "studentEmail",
        "studentPhone",
        "studentBatch",
        "studentYear",
        "studentDOB",
        "studentStatus",
        "studentAddress"
    ];

    const keys = ["name","roll","email","phone","batch","year","dob","status","address"];

    fields.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) formData.append(keys[i], el.value.trim());
    });

    const imageInput = document.getElementById("studentImage");

    if (imageInput && imageInput.files.length > 0) {
        formData.append("image", imageInput.files[0]);
    }

    try {

        const res = await authFetch(`${window.BASE_URL}/student/add-student`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Student Added");
            formElement.reset();
            loadStudent();
        }

    } catch (err) {
        console.error("❌ Add student error:", err);
    }

    formElement.dataset.submitting = "false";
}

/* =========================================
LOAD STUDENTS (IMAGE FIXED)
========================================= */

async function loadStudent() {

    const container = document.getElementById("studentList");
    if (!container) return;

    container.innerHTML = "Loading...";

    try {

        const res = await authFetch(`${window.BASE_URL}/student/get-student`);
        const data = await res.json();

        const items = data.students || [];

        if (!items.length) {
            container.innerHTML = "No students found";
            return;
        }

        container.innerHTML = `
            <div class="faculty-grid">
                ${items.map(item => {

                    const imgSrc = item.image || "";

                    return `
                    <div class="faculty-card">

                        <div class="faculty-image-wrapper">
                            <img src="${imgSrc}"
                                 class="faculty-image"
                                 crossorigin="anonymous"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiPjwvc3ZnPg=='">
                        </div>

                        <div class="faculty-info">

                            <h3>${item.name || "No Name"}</h3>
                            <p><strong>Roll:</strong> ${item.roll}</p>
                            <p><strong>Email:</strong> ${item.email}</p>
                            <p><strong>Phone:</strong> ${item.phone}</p>
                            <p><strong>Batch:</strong> ${item.batch}</p>
                            <p><strong>Address:</strong> ${item.address}</p>

                            <div class="faculty-actions">

                                <button class="delete-btn"
                                    onclick="deleteStudent('${item._id}')">
                                    Delete
                                </button>

                                <button class="download-btn"
                                    onclick="downloadStudentCard('${item._id}')">
                                    Download ID
                                </button>

                            </div>

                        </div>

                    </div>
                `;
                }).join("")}
            </div>
        `;

    } catch (err) {
        console.error("❌ Load student error:", err);
    }
}

/* =========================================
DELETE
========================================= */

async function deleteStudent(id) {

    try {

        const res = await authFetch(`${window.BASE_URL}/student/delete-student/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (data.success) {
            loadStudent();
        }

    } catch (err) {
        console.error(err);
    }
}

/* =========================================
Student ID CARD GENERATION & DOWNLOAD
========================================= */

function createStudentCardHTML(student) {

    const img = student.image || "";

    return `
    <div id="idCard"
        style="
        width: 350px;
        height: 220px;
        border-radius: 12px;
        overflow: hidden;
        font-family: Arial, sans-serif;
        border: 2px solid #1e1e1e;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: white;
        position: relative;
        ">

        <!-- HEADER -->
        <div style="
            background: linear-gradient(135deg, #046358, #290246);;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: auto;
        ">

            <!-- LOGO -->
            <img 
                src="Logo.png" 
                class="logo"
                style="
                    width:72px;
                    height:72px;
                    border-radius:22px;
                    object-fit:cover;
                    box-shadow: 0 12px 35px rgba(0,0,0,0.35);
                    background:white;
                "
            />

            <!-- INSTITUTE INFO -->
            <div style="flex:1; text-align:center;">
                <h3 style="margin:0;font-size:16px;font-weight:bold;color:gold;">FuturePath EduTech Institute</h3>
                <p style="margin:4px 0;font-size:12px;">
                    -------------------------------
                </p>

                <h4 style=" margin:0;font-size:14px;color:white;">STUDENT ID CARD</h4>
            </div>
        </div>
        <!-- BODY -->
        <div style="display:flex; padding: 12px; gap: 12px;">

            <!-- IMAGE -->
            <img src="${img}"
                style="
                width: 90px;
                height: 90px;
                border-radius: 10px;
                object-fit: cover;
                border: 2px solid white;
                "
                crossorigin="anonymous"
            />

            <!-- DETAILS -->
            <div style="font-size: 12px; line-height: 1.5;">
                <div><b>Name:</b> ${student.name || ""}</div>
                <div><b>Roll:</b> ${student.roll || ""}</div>
                <div><b>Phone:</b> ${student.phone || ""}</div>
                <div><b>Address:</b> ${student.address || ""}</div>
            </div>

        </div>

        <!-- FOOTER -->
        <div style="
            position:absolute;
            bottom:0;
            width:100%;
            background:#111827;
            padding:6px;
            font-size:10px;
            text-align:center;
        ">
        </div>

    </div>
    `;
}

async function downloadStudentCard(id) {
    try {

        const res = await authFetch(`${window.BASE_URL}/student/get-student`);
        const data = await res.json();

        const student = data.students.find(s => s._id === id);
        if (!student) return;

        /* =========================
        STEP 1: CREATE VISIBLE TEMP FIXED CONTAINER
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

        container.innerHTML = createStudentCardHTML(student);

        const card = container.firstElementChild;

        /* =========================
        STEP 2: FORCE WHITE BACKGROUND (IMPORTANT)
        ========================= */
        card.style.background = "#8677f3";
        card.style.color = "black";
        card.style.border = "2px solid #4606f6";
        const img = card.querySelector("img");
        if (img) {
            img.crossOrigin = "anonymous";

            if (!img.complete) {
                await new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }
        }

        /* =========================
        STEP 3: WAIT FOR STABLE RENDER
        ========================= */
        await new Promise(resolve => setTimeout(resolve, 300));

        await new Promise(requestAnimationFrame);

        /* =========================
        STEP 4: PDF GENERATION (STABLE SETTINGS)
        ========================= */
        const opt = {
            margin: 0,
            filename: `${student.name}_ID_Card.pdf`,
            image: {
                type: "jpeg",
                quality: 1
            },
            html2canvas: {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: {
                unit: "px",
                format: [350, 220],     // ✅ MUCH MORE RELIABLE THAN CUSTOM SIZE
                orientation: "landscape"
            }
        };

        await html2pdf().set(opt).from(card).save();

        /* =========================
        STEP 5: CLEANUP
        ========================= */
        document.body.removeChild(container);

    } catch (err) {
        console.error("❌ PDF generation failed:", err);
        alert("PDF download failed. Check console.");
    }
}