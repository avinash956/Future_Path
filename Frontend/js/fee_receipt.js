function generateFeeReceiptPDF(data) {

    const receiptHTML = `
    <div id="receipt" style="
        width: 400px;
        padding: 20px;
        font-family: Arial;
        border: 2px solid #000;
        background: white;
    ">

        <!-- HEADER -->
        <div style="text-align:center;">
            <img src="Logo.png" style="width:80px;height:80px;" />
            <h2 style="margin:5px;">FuturePath EduTech Institute</h2>
            <p>Fee Receipt</p>
        </div>

        <hr/>

        <!-- DETAILS -->
        <p><b>Receipt No:</b> ${data.receiptNo}</p>
        <p><b>Name:</b> ${data.student.name}</p>
        <p><b>Roll:</b> ${data.student.id}</p>
        <p><b>Batch:</b> ${data.student.batch}</p>
        <p><b>Amount:</b> ₹${data.record.amount}</p>
        <p><b>Mode:</b> ${data.record.mode}</p>
        <p><b>Date:</b> ${data.record.date}</p>

        <hr/>

        <p style="text-align:center;">Thank You!</p>

    </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = receiptHTML;
    document.body.appendChild(container);

    const element = container.querySelector("#receipt");

    const opt = {
        margin: 0,
        filename: `Fee_Receipt_${data.receiptNo}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: "px", format: [400, 500], orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save();

    document.body.removeChild(container);
}