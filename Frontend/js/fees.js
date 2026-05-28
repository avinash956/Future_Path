console.log("🚀 fees.js LOADED (DEBUG MODE ENABLED)");

let currentStudent = null;
let currentReceiptData = null;
let feesChart = null;

// ==========================================
// 0. GLOBAL CHECK (VERY IMPORTANT)
// ==========================================
console.log("🔍 BASE_URL:", window.BASE_URL);

if (!window.BASE_URL) {
    console.error("❌ BASE_URL is NOT defined!");
}

// ==========================================
// 1. DEBUG STUDENT FETCH BY ROLL
// ==========================================
async function fetchStudent() {

    console.log("======================================");
    console.log("🔍 fetchStudent() TRIGGERED");
    console.log("======================================");

    const rollInput = document.getElementById('studentRoll');

    if (!rollInput) {
        console.error("❌ studentRoll input NOT FOUND in DOM");
        alert("UI ERROR: studentRoll input missing");
        return;
    }

    const studentRoll = rollInput.value.trim().toUpperCase();

    console.log("📌 Entered Roll:", studentRoll);

    if (!studentRoll) {
        console.warn("⚠️ Empty roll number");
        alert("Please enter roll number");
        return;
    }

    const url = `${window.BASE_URL}/fees/student/${studentRoll}`;
    console.log("🌐 API URL:", url);

    try {

        console.log("📡 Sending request...");

        const response = await fetch(url);

        console.log("📡 Response received");
        console.log("📊 Status:", response.status);
        console.log("📊 OK:", response.ok);

        const text = await response.text();
        console.log("📦 RAW RESPONSE:", text);

        let result;

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("❌ JSON PARSE ERROR:", e);
            alert("Invalid JSON from server");
            return;
        }

        console.log("📦 PARSED RESPONSE:", result);

        if (!response.ok || !result.success) {
            console.error("❌ Backend returned error:", result.message);
            throw new Error(result.message || "Student not found");
        }

        currentStudent = result;
        currentStudent.studentId = studentRoll;

        console.log("✅ Student Loaded:", currentStudent);

        // DOM CHECKS
        const nameField = document.getElementById('studentName');
        const batchField = document.getElementById('batch');

        if (!nameField || !batchField) {
            console.error("❌ Missing input fields in DOM");
            return;
        }

        nameField.value = result.name || "";
        batchField.value = result.batch || "";

        console.log("✏️ UI Updated");

        updateHistoryTable(result.history || []);
        renderChart(result.history || []);

    } catch (error) {
        console.error("🔥 FETCH STUDENT ERROR:", error);
        alert(error.message);
    }
}

// ==========================================
// 2. DEBUG PAYMENT GENERATION
// ==========================================
async function generateQR() {

    console.log("======================================");
    console.log("💰 generateQR() TRIGGERED");
    console.log("======================================");

    const amount = document.getElementById('feesAmount')?.value;
    const mode = document.getElementById('paymentMode')?.value;
    const qrContainer = document.getElementById('qrcode');

    console.log("💰 Amount:", amount);
    console.log("💳 Mode:", mode);

    if (!currentStudent) {
        console.error("❌ No student selected");
        alert("Please select student first");
        return;
    }

    if (!amount) {
        console.warn("⚠️ Amount missing");
        alert("Enter amount");
        return;
    }

    const payload = {
        studentId: currentStudent.studentId,
        name: currentStudent.name,
        batch: currentStudent.batch,
        amount,
        mode
    };

    console.log("📦 Payment Payload:", payload);

    try {

        const url = `${window.BASE_URL}/fees/pay`;
        console.log("🌐 Sending payment to:", url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log("📡 Payment response status:", response.status);

        const text = await response.text();
        console.log("📦 RAW PAYMENT RESPONSE:", text);

        const result = JSON.parse(text);

        console.log("📦 PAYMENT RESULT:", result);

        if (!result.success) {
            throw new Error("Payment failed");
        }

        currentReceiptData = result.record;

        console.log("🎯 Receipt Generated:", currentReceiptData);

        alert(`Payment Saved! Receipt: ${result.receiptNo}`);

        // QR SECTION DEBUG
        if (!qrContainer) {
            console.error("❌ QR container missing");
            return;
        }

        qrContainer.innerHTML = "";

        if (mode === "UPI") {

            console.log("🔵 Generating UPI QR");

            const upiUrl = `upi://pay?pa=merchant@ybl&pn=School&am=${amount}&cu=INR`;

            new QRCode(qrContainer, {
                text: upiUrl,
                width: 150,
                height: 150
            });

        } else {
            qrContainer.innerHTML =
                `<p style="color:green;">Payment saved (No QR needed)</p>`;
        }

        refreshHistoryAfterPay(currentReceiptData);

    } catch (error) {
        console.error("🔥 PAYMENT ERROR:", error);
        alert(error.message);
    }
}

// ==========================================
// 3. HISTORY DEBUG
// ==========================================
function updateHistoryTable(historyArray) {

    console.log("📊 updateHistoryTable called:", historyArray);

    const tbody = document.querySelector('#historyTable tbody');

    if (!tbody) {
        console.error("❌ History table not found");
        return;
    }

    tbody.innerHTML = "";

    if (!historyArray || historyArray.length === 0) {
        console.warn("⚠️ No history data");
        tbody.innerHTML = "<tr><td colspan='4'>No records found</td></tr>";
        return;
    }

    historyArray.forEach(item => {

        console.log("🧾 History item:", item);

        const row = `
        <tr>
            <td>${item.receiptNo}</td>
            <td>₹${item.amount}</td>
            <td>${item.status}</td>
            <td>${item.date}</td>
        </tr>`;

        tbody.innerHTML += row;
    });
}

// ==========================================
// 4. CHART DEBUG
// ==========================================
function renderChart(historyArray) {

    console.log("📈 renderChart called");

    const canvas = document.getElementById('chart');

    if (!canvas) {
        console.error("❌ Chart canvas not found");
        return;
    }

    const ctx = canvas.getContext('2d');

    if (feesChart) {
        console.log("♻️ Destroying old chart");
        feesChart.destroy();
    }

    const labels = historyArray.map(i => i.date);
    const values = historyArray.map(i => i.amount);

    console.log("📊 Chart Labels:", labels);
    console.log("📊 Chart Values:", values);

    feesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Fees Paid',
                data: values
            }]
        },
        options: {
            responsive: true
        }
    });

    console.log("✅ Chart rendered");
}

// ==========================================
// 5. WhatsApp DEBUG
// ==========================================
function sendWhatsApp() {

    console.log("📲 WhatsApp function triggered");

    if (!currentReceiptData) {
        console.error("❌ No receipt data");
        alert("No payment data");
        return;
    }

    const phone = currentStudent?.parentPhone || "919999999999";

    const msg = `Fees received ₹${currentReceiptData.amount}`;

    console.log("📲 Phone:", phone);
    console.log("📲 Message:", msg);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    console.log("🌐 WhatsApp URL:", url);

    window.open(url, "_blank");
}