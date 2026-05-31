/* =========================================
   FUTUREPATH FEES DASHBOARD SCRIPT
========================================= */

async function loadFeeDashboard() {
    try {
        const res = await fetch(`${window.BASE_URL}/fees/dashboard`);
        const data = await res.json();

        if (!data.success) {
            console.error("❌ Dashboard API failed:", data.message);
            return;
        }

        // Direct totals from API
        document.getElementById("totalCollected").innerText = data.totalCollected || 0;
        document.getElementById("totalDue").innerText = data.totalDue || 0;
        document.getElementById("totalStudents").innerText = data.totalStudents || 0;

        console.log("✅ Fee dashboard loaded successfully");
    } catch (err) {
        console.error("❌ Error loading dashboard:", err);
    }
}

async function refreshFeeDashboard() {
    try {
        const res = await fetch(`${window.BASE_URL}/fees/all`);
        const data = await res.json();

        if (!data.success) {
            console.error("❌ Refresh API failed:", data.message);
            return;
        }

        const fees = data.fees || [];
        let collected = 0;
        let due = 0;
        let students = new Set();

        fees.forEach(f => {
            collected += Number(f.paid || 0);
            due += Number(f.due || 0);
            if (f.roll) students.add(f.roll);
        });

        document.getElementById("totalCollected").innerText = collected;
        document.getElementById("totalDue").innerText = due;
        document.getElementById("totalStudents").innerText = students.size;

        console.log("✅ Fee dashboard refreshed successfully");
    } catch (err) {
        console.error("❌ Dashboard refresh error:", err);
    }
}

/* =========================================
AUTO INITIALIZE ON PAGE LOAD
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    loadFeeDashboard();
});

/* =========================================
GLOBAL ACCESS
========================================= */
window.loadFeeDashboard = loadFeeDashboard;
window.refreshFeeDashboard = refreshFeeDashboard;
