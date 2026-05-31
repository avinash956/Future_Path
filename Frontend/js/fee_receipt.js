/* =========================================
   FUTUREPATH FEES RECEIPT PDF GENERATOR
========================================= */

function printReceipt() {
    console.clear();
    console.log("🚀 [DEBUG START] Initializing Delayed PDF Export");

    // --- Safe DOM fetch ---
    let receiptNo = getText("receiptNo");
    let studentName = getText("receiptName");
    let rollNumber = getText("receiptRoll");
    let amount = getText("receiptAmount");
    let mode = getText("receiptMode");
    let date = getText("receiptDate");
    let batch = getValue("studentBatchDisplay");

    if (!receiptNo || receiptNo === "N/A" || receiptNo === "-") {
        console.error("❌ Invalid receipt number.");
        showError("Validation Error: Please generate a valid receipt first.");
        return;
    }

    const originUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    const absoluteLogoUrl = `${originUrl}/Logo.png`;

    // --- Overlay creation ---
    const overlay = document.createElement("div");
    overlay.id = "pdf-preview-overlay";
    overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100vw; height:100vh;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
        z-index:99999; display:flex; flex-direction:column;
        align-items:center; justify-content:center; overflow-y:auto;
        padding:20px; box-sizing:border-box;
    `;

    overlay.innerHTML = `
        <div id="pdf-countdown-banner" style="
            background:#1e3a8a; color:#fff; padding:10px 20px;
            border-radius:8px; font-family:Arial; font-weight:bold;
            margin-bottom:15px; box-shadow:0 4px 6px rgba(0,0,0,0.1);
        ">
            🔄 Preparing Download... <span id="pdf-countdown-timer">2</span>s
        </div>
        <div id="receipt-capture-target" style="
            width:700px; padding:30px; font-family:Arial;
            background:#fff; color:#000; border-radius:4px;
            box-shadow:0 10px 25px rgba(0,0,0,0.2);
        ">
            <table style="width:100%; border-bottom:3px solid #1e3a8a; margin-bottom:30px;">
                <tr>
                    <td style="width:100px;">
                        <img src="${absoluteLogoUrl}" id="receiptLogoImg" style="width:85px; height:85px; object-fit:contain;" crossorigin="anonymous">
                    </td>
                    <td style="padding-left:15px;">
                        <h1 style="margin:0; color:#1e3a8a; font-size:26px;">FuturePath EduTech Institute</h1>
                        <p style="margin:5px 0 0; color:#4b5563; font-size:14px;"><i>Shaping Future With Smart Learning.....</i></p>
                    </td>
                </tr>
            </table>
            <h2 style="text-align:center; color:#2563eb; margin-bottom:30px;">FEE RECEIPT</h2>
            <table style="width:100%; margin-bottom:40px; font-size:15px; border-collapse:collapse;">
                ${row("Receipt No", receiptNo)}
                ${row("Student Name", studentName)}
                ${row("Roll Number", rollNumber)}
                ${row("Batch", batch)}
                ${row("Amount Paid", amount, true)}
                ${row("Payment Mode", mode)}
                ${row("Date", date)}
            </table>
            <table style="width:100%; margin-top:60px; font-size:15px;">
                <tr>
                    <td style="text-align:center; width:50%;">
                        <p><b>Student Signature</b></p>
                        <div style="margin:40px auto 0; width:160px; border-top:1px solid #000;"></div>
                    </td>
                    <td style="text-align:center; width:50%;">
                        <p><b>Authorized Signature</b></p>
                        <div style="margin:40px auto 0; width:160px; border-top:1px solid #000;"></div>
                    </td>
                </tr>
            </table>
            <div style="text-align:center; margin-top:60px; font-size:13px; color:#4b5563;">Thank you for your payment.</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // --- QR Code Injection ---
    const qrData = `Name:${studentName}|Roll:${rollNumber}|Receipt:${receiptNo}`;
    const qrContainer = document.createElement("div");
    qrContainer.style.textAlign = "center";
    qrContainer.style.marginTop = "30px";

    const qrLabel = document.createElement("p");
    qrLabel.style.marginBottom = "20px";
    // qrLabel.style.fontWeight = "bold";
    // qrLabel.innerText = "Verification QR Code";
    qrContainer.appendChild(qrLabel);

    const qrTarget = document.createElement("div");
    qrTarget.id = "receiptQrCode";
    qrContainer.appendChild(qrTarget);

    const receiptTarget = document.getElementById("receipt-capture-target");
    receiptTarget.appendChild(qrContainer);

    new QRCode(qrTarget, {
        text: qrData,
        width: 120,
        height: 120,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // --- Countdown & PDF generation ---
    let count = 2;
    const timerSpan = document.getElementById("pdf-countdown-timer");
    const banner = document.getElementById("pdf-countdown-banner");

    const interval = setInterval(() => {
        count--;
        if (timerSpan) timerSpan.innerText = count;
        if (count <= 0) {
            clearInterval(interval);
            if (banner) banner.innerText = "⏳ Generating File...";
            generatePDF(receiptNo);
        }
    }, 1000);
}
/* =========================================
DOWNLOAD RECEIPT FROM HISTORY
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

    // Trigger the overlay + PDF generator
    printReceipt();
}

// --- Helpers ---
function getText(id) {
    return document.getElementById(id)?.innerText?.trim() || "N/A";
}
function getValue(id) {
    return document.getElementById(id)?.value?.trim() || "N/A";
}
function row(label, value, highlight = false) {
    return `<tr>
        <td style="border:1px solid #000; padding:12px; background:#f3f4f6; font-weight:bold;">${label}</td>
        <td style="border:1px solid #000; padding:12px; ${highlight ? 'font-weight:bold; color:#1e3a8a;' : ''}">${value}</td>
    </tr>`;
}
function showError(msg) {
    alert(msg);
}
function cleanup() {
    const overlay = document.getElementById("pdf-preview-overlay");
    if (overlay) overlay.remove();
    console.log("🧹 Cleanup complete");
}

// --- PDF Generation ---
async function generatePDF(receiptNo) {
    try {
        await document.fonts.ready;
        const logo = document.getElementById("receiptLogoImg");
        if (logo) {
            await new Promise(resolve => {
                if (logo.complete) resolve();
                else { logo.onload = resolve; logo.onerror = resolve; }
            });
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        const target = document.getElementById("receipt-capture-target");
        const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#FFF" });
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`Fee_Receipt_${receiptNo}.pdf`);
        console.log("✅ PDF Download Successful");
    } catch (err) {
        console.error("❌ PDF Generation Error:", err);
        showError("PDF generation failed. Check browser console.");
    } finally {
        cleanup();
    }
}
