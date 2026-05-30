console.log("🚀 student_pro.js LOADED");

let allStudents = [];

/* =========================
LOAD STUDENTS 
========================= */
async function loadStudentPro() {

    const container = document.getElementById("studentList");
    if (!container) return;

    container.innerHTML = "Loading...";

    try {

        const res = await fetch(`${window.BASE_URL}/student/get-student`);
        const data = await res.json();

        allStudents = data.students || [];

        renderStudents(allStudents);

    } catch (err) {
        console.error("❌ Load error:", err);
    }
}

/* =========================
RENDER STUDENTS
========================= */
function renderStudents(list) {
    const container = document.getElementById("studentList");

    if (!list.length) {
        container.innerHTML = "<p>No students found</p>";
        return;
    }

    let html = '<div class="student-grid">';

    for (let s of list) {
        html += `
            <div class="student-card">
                <img src="${s.image || 'default.png'}" loading="lazy" />

                <h3>${s.name}</h3>

                <p>Roll: ${s.roll}</p>
                <p>Batch: ${s.batch}</p>

                <span class="status">${s.status || 'active'}</span>

                <div class="actions">
                    <button onclick="viewStudent('${s._id}')">View</button>
                    <button onclick="editStudent('${s._id}')">Edit</button>
                </div>
            </div>
        `;
    }

    html += '</div>';

    container.innerHTML = html;
}
/* =========================
SEARCH (NAME / ROLL / BATCH)
========================= */
function searchStudent() {

    const keyword = document.getElementById("studentSearch").value.toLowerCase();

    const filtered = allStudents.filter(s =>
        (s.name || "").toLowerCase().includes(keyword) ||
        (s.roll || "").toLowerCase().includes(keyword) ||
        (s.batch || "").toLowerCase().includes(keyword)
    );

    renderStudents(filtered);
}

/* =========================
VIEW STUDENT MODAL
========================= */
function viewStudent(id) {

    const s = allStudents.find(x => x._id === id);
    if (!s) return;

    alert(`
NAME: ${s.name}
ROLL: ${s.roll}
BATCH: ${s.batch}
EMAIL: ${s.email}
PHONE: ${s.phone}
ADDRESS: ${s.address}
    `);
}

/* =========================
INLINE EDIT (SIMPLE VERSION)
========================= */
async function editStudent(id) {

    const s = allStudents.find(x => x._id === id);
    if (!s) return;

    const newPhone = prompt("Update Phone", s.phone);
    const newAddress = prompt("Update Address", s.address);

    if (!newPhone && !newAddress) return;

    try {

        const res = await fetch(`${window.BASE_URL}/student/update-student/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: newPhone,
                address: newAddress
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Updated Successfully");
            loadStudentPro();
        }

    } catch (err) {
        console.error("❌ Update error:", err);
    }
}

/* =========================
EXPORT STUDENTS TO EXCEL
========================= */
function exportStudentsExcel() {

    if (!window.XLSX) {
        alert("XLSX not loaded");
        return;
    }

    const data = allStudents.map((s, i) => ({
        "S.No": i + 1,
        "Name": s.name,
        "Roll": s.roll,
        "Batch": s.batch,
        "Email": s.email,
        "Phone": s.phone,
        "Status": s.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Students");

    XLSX.writeFile(wb, "students.xlsx");
}