let currentStudent = null;
let currentReceiptData = null;
let feesChart = null;

console.log("🔍 BASE_URL:", window.BASE_URL);

if (!window.BASE_URL) {
    console.error("❌ BASE_URL is NOT defined!");
}

/* =========================================
1. FETCH STUDENT BY ROLL
========================================= */
async function fetchStudent() {

    console.log("======================================");
    console.log("🔍 fetchStudent() TRIGGERED");
    console.log("======================================");

    const rollInput = document.getElementById('studentRoll');

    if (!rollInput) {
        console.error("❌ studentRoll input NOT FOUND");
        alert("UI ERROR: studentRoll input missing");
        return;
    }

    const studentRoll = rollInput.value.trim().toUpperCase();

    if (!studentRoll) {
        alert("Please enter roll number");
        return;
    }

    const url = `${window.BASE_URL}/fees/student/${studentRoll}`;
    console.log("🌐 API URL:", url);

    try {

        const response = await (window.authFetch ? authFetch(url) : fetch(url));
        const text = await response.text();

        console.log("📦 RAW RESPONSE:", text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("❌ JSON parse error:", e);
            alert("Server returned invalid response");
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Student not found");
        }

        currentStudent = result;
        currentStudent.studentId = studentRoll;

        document.getElementById('studentName').value = result.name || "";
        document.getElementById('studentBatchDisplay').value = result.batch || "";

    } catch (error) {
        console.error("🔥 FETCH ERROR:", error);
        alert(error.message);
    }
}

/* =========================================
2. QR GENERATION
========================================= */
function generateQR() {

    console.log("🚀 Generate QR clicked");

    const amount =
        Number(document.getElementById('feesAmount')?.value || 0);

    const mode =
        document.getElementById('paymentMode')?.value;

    const qrContainer =
        document.getElementById('qrcode');

    if (!currentStudent) {
        alert("Select student first");
        return;
    }

    if (!amount) {
        alert("Enter amount");
        return;
    }

    if (!mode || mode.toUpperCase() !== "UPI") {
        alert("Select UPI mode to generate QR");
        return;
    }

    if (typeof QRCode === "undefined") {
        alert("QRCode library not loaded");
        console.error("QRCode is undefined");
        return;
    }

    const upiUrl =
        `upi://pay?pa=merchant@ybl&pn=School&am=${amount}&cu=INR`;

    console.log("UPI URL:", upiUrl);

    qrContainer.innerHTML = "";

    new QRCode(qrContainer, {
        text: upiUrl,
        width: 250,
        height: 250
    });

    console.log("✅ QR generated");
}
/* =========================================
      Done PAYMENT
========================================= */
async function completePayment() {

    const amount = Number(
        document.getElementById('feesAmount').value || 0
    );

    const mode =
        document.getElementById('paymentMode').value;

    if (!currentStudent) {
        alert("Select student first");
        return;
    }

    if (!amount) {
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

    try {

        const response = await (
            window.authFetch
                ? authFetch(
                    `${window.BASE_URL}/fees/pay`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                )
                : fetch(
                    `${window.BASE_URL}/fees/pay`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                )
        );

        const text = await response.text();

        console.log("📦 RAW PAYMENT RESPONSE:", text);

        let result;

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("❌ Invalid JSON:", e);
            alert("Server returned invalid response");
            return;
        }

        console.log("📦 PAYMENT RESPONSE:", result);

        if (!response.ok) {
            alert(result?.message || "Payment failed");
            return;
        }

        if (!result || result.success !== true) {
            alert(result?.message || "Payment failed");
            return;
        }

        alert(
            "Payment Successful!\n" +
            "Receipt No: " + (result.receiptNo || "N/A")
        );

        console.log("✅ SUCCESS ALERT SHOWN");

        /* =========================================
           GENERATE RECEIPT
        ========================================= */
        if (typeof generateReceipt === "function") {
            generateReceipt(result);
        } else {
            console.error("❌ generateReceipt() not found");
        }

        /* =========================================
           REFRESH HISTORY
        ========================================= */
        if (typeof refreshHistoryAfterPay === "function") {
            await refreshHistoryAfterPay();
        } else {
            console.warn("⚠️ refreshHistoryAfterPay() not found");
        }

        console.log("✅ Payment process completed");

    } catch (error) {

        console.error("❌ PAYMENT ERROR:", error);

        alert(
            error?.message ||
            "Payment save failed"
        );
    }
}
/* =========================================
3. HISTORY TABLE
========================================= */
function updateHistoryTable(historyArray) {
    console.log("📦 updateHistoryTable CALLED");
    const tbody = document.querySelector('#historyTable tbody');

    if (!tbody) {
        console.error("❌ historyTable tbody NOT FOUND");
        return;
    }

    tbody.innerHTML = "";

    if (!historyArray || historyArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No records found</td></tr>`;
        return;
    }

    historyArray.forEach((item, index) => {
        console.log(`📄 Payment Row ${index + 1}:`, item);

        tbody.innerHTML += `
        <tr>
            <td>${item.receiptNo || "N/A"}</td>
            <td>₹${item.amount || 0}</td>
            <td>${item.status || "N/A"}</td>
            <td>${item.date || "N/A"}</td>
            <td>
                <button onclick='downloadReceipt(${JSON.stringify(item).replace(/"/g, "&quot;")})'>
                    Download
                </button>
            </td>
        </tr>
        `;
    });

    console.log("✅ History table updated successfully");
}

/* =========================================
DOWNLOAD RECEIPT
========================================= */
function downloadReceipt(paymentData) {
    console.log("🧾 downloadReceipt CALLED", paymentData);

    // Populate receipt fields dynamically
    document.getElementById("receiptNo").innerText = paymentData.receiptNo || "N/A";
    document.getElementById("receiptName").innerText = currentStudent?.name || "N/A";
    document.getElementById("receiptRoll").innerText = currentStudent?.studentId || "N/A";
    document.getElementById("receiptAmount").innerText = "₹" + (paymentData.amount || 0);
    document.getElementById("receiptMode").innerText = paymentData.mode || "N/A";
    document.getElementById("receiptDate").innerText = paymentData.date || "N/A";

    // Trigger your existing PDF generator
    printReceipt();
}

/* =========================================
4. CHART
========================================= */
function renderChart(historyArray) {

    console.log("📊 renderChart CALLED");

    const canvas = document.getElementById('chart');

    if (!canvas) {
        console.error("❌ Chart canvas NOT FOUND");
        return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy old chart
    if (feesChart) {
        feesChart.destroy();
        console.log("🗑️ Old chart destroyed");
    }

    const labels = historyArray.map(i => i.date || "N/A");

    const values = historyArray.map(i => Number(i.amount || 0));

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

    console.log("✅ Chart rendered successfully");
}


/* =========================================
6. REFRESH HISTORY AFTER PAYMENT
========================================= */
async function refreshHistoryAfterPay() {

    try {

        console.log("🔄 refreshHistoryAfterPay STARTED");

        console.log("🎓 Current Student Object:", currentStudent);

        // Student check
        if (!currentStudent) {
            console.error("❌ currentStudent NOT FOUND");
            return;
        }

        // Roll check
        const roll =currentStudent.roll ||currentStudent.studentId;

        if (!roll) {
                    console.error("❌ Student Roll NOT FOUND");
                    return;
                }

            const url =`${window.BASE_URL}/fees/history/${roll}`;
                console.log("📡 Fetch URL:", url);

            const res = await fetch(url, {
                method: "GET",
                headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("📡 RESPONSE STATUS:", res.status);

        // Token expired
        if (res.status === 401) {

            console.error("❌ TOKEN EXPIRED");

            alert("Session expired. Please login again.");

            localStorage.removeItem("token");

            window.location.href = "login.html";

            return;
        }

        const data = await res.json();

        console.log("📦 RAW HISTORY RESPONSE:", data);

        // API fail
        if (!data.success) {

            console.error("❌ API FAILED:", data.message);

            updateHistoryTable([]);

            return;
        }

        // Missing fees array
        if (!data.fees) {

            console.error("❌ data.fees NOT FOUND");

            updateHistoryTable([]);

            return;
        }

        console.log("✅ History records found:", data.fees.length);

        // Update UI
        updateHistoryTable(data.fees);

        renderChart(data.fees);

    } catch (err) {

        console.error("❌ Refresh History ERROR:", err);

    }
}

/* =========================================
EXPORT EXCEL
========================================= */
async function exportFeesExcel() {

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login again");
            return;
        }

        const exportType =
            document.getElementById("exportType").value;

        let url = `${window.BASE_URL}/fees/export`;

        // ===============================
        // Student Wise
        // ===============================
        if (exportType === "student") {

            const roll =
                document.getElementById("studentRoll").value.trim();

            if (!roll) {

                alert("Search a student first");

                return;
            }

            url += `?type=student&roll=${encodeURIComponent(roll)}`;
        }

        // ===============================
        // Batch Wise
        // ===============================
        else if (exportType === "batch") {

            const batch =
                document.getElementById("studentBatchDisplay")
                    .value
                    .trim();

            if (!batch) {

                alert("Search a student first");

                return;
            }

            url += `?type=batch&batch=${encodeURIComponent(batch)}`;
        }

        // ===============================
        // All
        // ===============================
        else {

            url += `?type=all`;
        }

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!data.success) {

            alert(data.message || "Export failed");

            return;
        }

        const worksheet =
            XLSX.utils.json_to_sheet(data.fees);

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Fees Report"
        );

        let filename = "fees_report.xlsx";

        if (exportType === "student") {

            filename =
                `${document.getElementById("studentRoll").value}_fees.xlsx`;
        }

        if (exportType === "batch") {

            filename =
                `${document.getElementById("studentBatchDisplay").value}_batch_fees.xlsx`;
        }

        XLSX.writeFile(workbook, filename);

    }

    catch (err) {

        console.error(err);

        alert("Export failed");
    }
}
/* =========================================
GENERATE RECEIPT
========================================= */
function generateReceipt(paymentData) {

    console.log("🧾 generateReceipt CALLED");

    console.log("📦 Payment Data:", paymentData);

    if (!paymentData) {

        console.error("❌ paymentData NOT FOUND");

        return;
    }

    document.getElementById("receiptNo").innerText =paymentData.receiptNo || "N/A";

    document.getElementById("receiptName").innerText =currentStudent?.name || "N/A";

    document.getElementById("receiptRoll").innerText =currentStudent?.studentId || "N/A";

    document.getElementById("receiptAmount").innerText ="₹" + (paymentData.data?.amount ||document.getElementById("feesAmount").value ||0);

    document.getElementById("receiptMode").innerText =paymentData.data?.mode || "N/A";

    document.getElementById("receiptDate").innerText =paymentData.data?.date || "N/A";

    console.log("✅ Receipt Generated");
}

/* =========================================
PRINT RECEIPT
========================================= */
function printReceipt() {

    console.log("🖨 Printing Receipt");

    const receiptContent =document.getElementById("receiptArea").cloneNode(true);

/* =========================================
REMOVE PRINT BUTTON FROM RECEIPT
========================================= */
const btn =
    receiptContent.querySelector("button");

if (btn) {
    btn.remove();
}

    if (!receiptContent) {

        console.error("❌ receiptArea NOT FOUND");

        return;
    }

    const printWindow = window.open(
        '',
        '',
        'width=900,height=700'
    );

    printWindow.document.write(`

        <html>

        <head>

            <title>Fee Receipt</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                h2{
                    text-align:center;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                td{
                    border:1px solid black;
                    padding:10px;
                }

            </style>

        </head>

        <body>

            ${receiptContent.innerHTML}

        </body>

        </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

    printWindow.close();

    console.log("✅ Print Completed");
}


// Global access
window.generateReceipt = generateReceipt;
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;
/* =========================================
GLOBAL FUNCTIONS
========================================= */
window.fetchStudent = fetchStudent;
window.generateQR = generateQR;
window.completePayment = completePayment;
window.refreshHistoryAfterPay = refreshHistoryAfterPay;
window.exportFeesExcel = exportFeesExcel;