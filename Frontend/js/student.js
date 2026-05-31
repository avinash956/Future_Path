/* =========================================
STUDENT MODULE PRO VERSION (FINAL FIXED)
========================================= */

console.log("✅ student.js LOADED");

// Global state
let studentCache = [];

/* =========================================
INITIALIZE MODULE
========================================= */

function initializeStudent() {

    console.log("🚀 Student Module Initializing...");

    const form = document.getElementById("studentForm");

    if (!form) {
        console.error("❌ studentForm NOT FOUND");
        return;
    }

    form.addEventListener("submit", addStudent);

    // Search live
    document.getElementById("studentSearch")?.addEventListener("input", loadStudent);

    // Batch change triggers roll + reload
    document.getElementById("studentBatch")?.addEventListener("change", () => {
        generateRollNumber();
        loadStudent();
    });

    loadBatchOptions();
    loadStudent();
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
LOAD STUDENTS (SEARCH + FILTER)
========================================= */

async function loadStudent() {

    const container = document.getElementById("studentList");
    if (!container) return;

    container.innerHTML = "Loading...";

    const batch = document.getElementById("studentBatch")?.value;
    const search = document.getElementById("studentSearch")?.value;

    try {

        let url = `${window.BASE_URL}/student/get-students?`;

        if (batch) url += `batch=${batch}&`;
        if (search) url += `search=${search}`;

        const res = await authFetch(url);
        const data = await res.json();

        studentCache = data.students || [];

        if (!studentCache.length) {
            container.innerHTML = "No students found";
            return;
        }

        container.innerHTML = `
            <div class="student-grid">
                ${studentCache.map(item => `
                    <div class="student-card">

                        <div class="student-image-wrapper">
                            <img src="${item.image}" class="student-image">
                        </div>

                        <div class="student-info">

                            <h3>${item.name}</h3>
                            <p><b>Roll:</b> ${item.roll}</p>
                            <p><b>Email:</b> ${item.email}</p>
                            <p><b>Phone:</b> ${item.phone}</p>
                            <p><b>Batch:</b> ${item.batch}</p>

                            <div class="student-actions">

                                <button style="background:#e11d48;color:white;padding:6px 10px;border:none;border-radius:5px;"
                                    onclick="deleteStudent('${item._id}')">
                                    Delete
                                </button>

                                <button style="background:#2563eb;color:white;padding:6px 10px;border:none;border-radius:5px;"
                                    onclick="openEditStudent('${item._id}')">
                                    Edit
                                </button>

                                <button style="background:#10b981;color:white;padding:6px 10px;border:none;border-radius:5px;"
                                    onclick="downloadStudentCard('${item._id}')">
                                    ID Card
                                </button>

                            </div>

                        </div>

                    </div>
                `).join("")}
            </div>
        `;

    } catch (err) {
        console.error("❌ Load student error:", err);
    }
}

/* =========================================
ADD / UPDATE STUDENT
========================================= */

async function addStudent(e) {

    e.preventDefault();

    const form = document.getElementById("studentForm");

    if (form.dataset.loading === "true") return;
    form.dataset.loading = "true";

    const formData = new FormData();

    const map = {
        studentName: "name",
        studentRoll: "roll",
        studentEmail: "email",
        studentPhone: "phone",
        studentBatch: "batch",
        studentYear: "year",
        studentDOB: "dob",
        studentStatus: "status",
        studentAddress: "address"
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) formData.append(map[id], el.value);
    });

    const img = document.getElementById("studentImage");
    if (img?.files.length) {
        formData.append("image", img.files[0]);
    }

    const editId = form.dataset.editId;

    let url = `${window.BASE_URL}/student/add-student`;
    let method = "POST";

    if (editId) {
        url = `${window.BASE_URL}/student/update-student/${editId}`;
        method = "PUT";
    }

    try {

        const res = await authFetch(url, {
            method,
            body: formData
        });

        const data = await res.json();

        if (data.success) {

            alert(editId ? "Student Updated" : "Student Added");

            form.reset();
            delete form.dataset.editId;

            generateRollNumber();
            loadStudent();
        }

    } catch (err) {
        console.error("❌ Add/Update error:", err);
    }

    form.dataset.loading = "false";
}

/* =========================================
EDIT STUDENT
========================================= */

function openEditStudent(id) {

    const student = studentCache.find(s => s._id === id);

    if (!student) return;

    document.getElementById("studentName").value = student.name;
    document.getElementById("studentRoll").value = student.roll;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentPhone").value = student.phone;
    document.getElementById("studentBatch").value = student.batch;
    document.getElementById("studentYear").value = student.year;
    document.getElementById("studentDOB").value = student.dob;
    document.getElementById("studentStatus").value = student.status;
    document.getElementById("studentAddress").value = student.address;

    document.getElementById("studentForm").dataset.editId = id;
}

/* =========================================
DELETE STUDENT
========================================= */

async function deleteStudent(id) {

    if (!confirm("Delete this student?")) return;

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

/* =========================================
DOWNLOAD STUDENT CARD
========================================= */

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
        STEP 4: PDF GENERATION (Using jsPDF & html2canvas)
        ========================= */
        // Capture element with your stable canvas parameters
        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0
        });

        // Convert the rendered canvas to a high-quality JPEG asset string
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // Fetch jsPDF from global namespace
        const { jsPDF } = window.jspdf;

        // Use the exact custom dimensions [350, 220] from your configuration
        const cardWidth = 350;
        const cardHeight = 220;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [cardWidth, cardHeight]
        });

        // Layer the image directly across the canvas container dimensions
        pdf.addImage(imgData, 'JPEG', 0, 0, cardWidth, cardHeight);
        
        // Trigger the file browser download option
        pdf.save(`${student.name}_ID_Card.pdf`);

        /* =========================
        STEP 5: CLEANUP
        ========================= */
        document.body.removeChild(container);

        console.log("✅ Student ID Card Downloaded");

    } catch (err) {
        console.error("❌ PDF generation failed:", err);
        alert("PDF download failed. Check console.");
    }
}
/* =========================================
EXCEL EXPORT
========================================= */

async function downloadExcel() {

    const rows = studentCache.map((s, i) => ({
        "S.No": i + 1,
        "Name": s.name,
        "Roll": s.roll,
        "Email": s.email,
        "Phone": s.phone,
        "Batch": s.batch,
        "Year": s.year
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    XLSX.writeFile(wb, "students.xlsx");
}