async function loadFeeDashboard() {

    const res = await fetch(`${window.BASE_URL}/fees/dashboard`);
    const data = await res.json();

    if (!data.success) return;

    document.getElementById("totalCollected").innerText = data.totalCollected;
    document.getElementById("totalDue").innerText = data.totalDue;
    document.getElementById("totalStudents").innerText = data.totalStudents;
}
async function refreshFeeDashboard() {

    try {

        const res = await fetch(`${window.BASE_URL}/fees/all`);
        const data = await res.json();

        const fees = data.fees || [];

        let collected = 0;
        let due = 0;
        let students = new Set();

        fees.forEach(f => {
            collected += Number(f.paid || 0);
            due += Number(f.due || 0);
            students.add(f.roll);
        });

        document.getElementById("totalCollected").innerText = collected;
        document.getElementById("totalDue").innerText = due;
        document.getElementById("totalStudents").innerText = students.size;

    } catch (err) {
        console.error("Dashboard refresh error:", err);
    }
}