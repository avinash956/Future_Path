/* =========================
CONFIG SAFETY CHECK
========================= */

// import { addErrorMessage } from "openai/_vendor/zod-to-json-schema/errorMessages.mjs";

if (!window.BASE_URL) {

    console.warn("⚠️ BASE_URL is not defined. Using fallback.");

    window.BASE_URL = "http://127.0.0.1:5000/api";
}

/* =========================
SERVER URL
========================= */

const SERVER_URL =
    window.BASE_URL.replace("/api", "");


/* =========================
AUTH FETCH WRAPPER
========================= */

function authFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    return fetch(url, {

        ...options,

        headers: {

            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }
            ),

            "Authorization": `Bearer ${token}`,

            ...options.headers
        }
    });
}


/* =========================
AUTO GENERATE MANAGEMENT ID
========================= */

async function generateManagementId() {

    try {

        const postInput =
            document.getElementById("mgmtPost");

        const idInput =
            document.getElementById("mgmtId");

        if (!postInput || !idInput) {

            console.error("❌ mgmtPost or mgmtId not found");

            return;
        }

        const post =
            postInput.value.trim();

        if (!post) {

            idInput.value = "";

            return;
        }

        /* =========================
        SHORT CODE GENERATION
        ========================= */

        const words =
            post.split(" ");

        let shortCode = "";

        if (words.length === 1) {shortCode =words[0].substring(0, 2).toUpperCase();} 
        else {

            shortCode =
                words
                .map(word => word[0])
                .join("")
                .substring(0, 3)
                .toUpperCase();
        }

        /* =========================
        GET MANAGEMENT DATA
        ========================= */

        const response = await authFetch(
            `${window.BASE_URL}/management/get-management`
        );

        const data = await response.json();

        let items = [];

        if (Array.isArray(data)) {

            items = data;

        } else if (data.management) {

            items = data.management;

        } else if (data.data) {

            items = data.data;
        }

        /* =========================
        FILTER SAME IDS
        ========================= */

        const filtered = items.filter(item => {

            return (
                (item.managementId || item.Id) &&
                (item.managementId || item.Id).startsWith(`FP-M${shortCode}-`)
            );

        });

        /* =========================
        FIND MAX SERIAL
        ========================= */

        let max = 0;

        filtered.forEach(item => {

            const parts =
                (item.managementId || item.Id).split("-");

            if (parts.length === 3) {

                const num =
                    parseInt(parts[2]);

                if (!isNaN(num) && num > max) {

                    max = num;
                }
            }

        });

        /* =========================
        NEXT SERIAL
        ========================= */

        const next =
            String(max + 1).padStart(3, "0");

        /* =========================
        FINAL ID
        ========================= */

        idInput.value =
            `FP-M${shortCode}-${next}`;

        console.log(
            "✅ Generated Management ID:",
            idInput.value
        );

    } catch (err) {

        console.error(
            "❌ ID generation failed:",
            err
        );

    }

}


/* =========================
INITIALIZE MANAGEMENT
========================= */

function initializeManagement() {

    console.log("🚀 Initializing Management Module");

    const form =
        document.getElementById("managementForm");

    if (!form) {

        console.warn("⚠️ managementForm not found yet");

        return;
    }

    console.log("✅ managementForm FOUND");


    /* =========================
    AUTO ID GENERATION
    ========================= */

    const postInput =
        document.getElementById("mgmtPost");

    const idInput =
        document.getElementById("mgmtId");

    if (idInput) {

        idInput.setAttribute("readonly", true);

    }

    if (postInput) {

        postInput.addEventListener(
            "input",generateManagementId
        );

        console.log("✅ Management ID generator attached");

    }


    // REMOVE OLD LISTENER

    const newForm =
        form.cloneNode(true);

    form.parentNode.replaceChild(
        newForm,
        form
    );


    /* =========================
    REATTACH EVENT AFTER CLONE
    ========================= */

    const newPostInput =
        document.getElementById("mgmtPost");

    if (newPostInput) {

        newPostInput.addEventListener(
            "input",generateManagementId
        );

    }


    // NEW SUBMIT LISTENER

    newForm.addEventListener(
        "submit",
addManagement
    );

    console.log(
        "✅ Management submit listener attached"
    );

    loadManagement();
}


/* =========================
ADD MANAGEMENT
========================= */

async function addManagement(e) {

    e.preventDefault();

    e.stopPropagation();

    console.log("🔥 ADD MANAGEMENT TRIGGERED");

    const form =
        document.getElementById("managementForm");

    const formData =
        new FormData();

    /* =========================
    MANAGEMENT ID
    ========================= */

    formData.append("Id", document.getElementById("mgmtId").value.trim());

    /* =========================
    FORM FIELDS
    ========================= */

    formData.append("name", document.getElementById("mgmtName").value.trim());
    formData.append("post", document.getElementById("mgmtPost").value.trim());
    formData.append("Id", document.getElementById("mgmtId").value.trim());
    formData.append("email", document.getElementById("mgmtEmail").value.trim());
    formData.append("phone", document.getElementById("mgmtPhone").value.trim());
    formData.append("department", document.getElementById("mgmtDepartment").value.trim());

    formData.append("status", document.getElementById("mgmtStatus").value.trim());

    formData.append("description", document.getElementById("mgmtDescription").value.trim());

    /* =========================
    IMAGE
    ========================= */

    const imageInput = document.getElementById("mgmtImage");

    if (imageInput && imageInput.files.length > 0) {

        formData.append("image", imageInput.files[0]);

        console.log(
            "🖼 IMAGE SELECTED:",
            imageInput.files[0].name
        );
    }

    try {

        const response =
            await authFetch(

                `${window.BASE_URL}/management/add-management`,

                {
                    method: "POST",
                    body: formData
                }
            );

        if (!response.ok) {
            throw new Error(`HTTP ERROR ${response.status}`);
        }

        console.log(
            "📡 RESPONSE STATUS:",
            response.status
        );

        const text =
            await response.text();

        console.log(
            "📄 RAW RESPONSE:",
            text
        );

        let data;

        try {

            data = JSON.parse(text);

        } catch {

            alert("Invalid server response");

            return;
        }

        console.log("✅ ADD RESPONSE:", data);

        if (data.success) {

            alert(
                "✅ Management Added Successfully"
            );

            form.reset();

            const idInput =
                document.getElementById("mgmtId");

            if (idInput) {

                idInput.value = "";

            }

            loadManagement();

        } else {

            alert(
                data.message ||
                "Failed to add management"
            );
        }

    } catch (err) {

        console.error("❌ ADD ERROR:", err);

        alert("Backend not reachable");
    }

    return false;
}


/* =========================
LOAD MANAGEMENT
========================= */

async function loadManagement() {

    console.log("📥 Loading Management Data...");

    const container =
        document.getElementById("managementList");

    if (!container) {

        console.error("❌ managementList not found");

        return;
    }

    container.innerHTML = `
        <div class="loading-message">
            Loading Management...
        </div>
    `;

    try {

        const response =
            await authFetch(
                `${window.BASE_URL}/management/get-management`
            );

        if (!response.ok) {
            throw new Error(`HTTP ERROR ${response.status}`);
        }

        console.log(
            "📡 GET STATUS:",
            response.status
        );

        const text =
            await response.text();

        console.log(
            "📄 RAW MANAGEMENT RESPONSE:",
            text
        );

        let data;

        try {

            data = JSON.parse(text);

        } catch {

            container.innerHTML = `
                <div class="error-message">
                    Invalid server response
                </div>
            `;

            return;
        }

        console.log(
            "📦 PARSED MANAGEMENT DATA:",
            data
        );

        let items = [];

        if (Array.isArray(data)) {

            items = data;

        } else if (data.management) {

            items = data.management;

        } else if (data.data) {

            items = data.data;
        }

        console.log(
            "📦 MANAGEMENT ITEMS:",
            items
        );

        /* =========================
        EMPTY
        ========================= */

        if (!items.length) {

            container.innerHTML = `

                <div class="empty-message">

                    <i class="fa-solid fa-users"></i>

                    <h3>No Management Found</h3>

                    <p>Add management members to display here.</p>

                </div>

            `;

            return;
        }

        /* =========================
        CARDS
        ========================= */

        container.innerHTML =
            items.map(item => {

                const imageUrl =
                    item.image
                        ? `${SERVER_URL}/uploads/${item.image}`
                        : "";

                return `

                <div class="management-card">

                    <!-- IMAGE -->

                    <div class="management-image-wrapper">

                        <img
                            src="${imageUrl}"
                            alt="Management"
                            class="management-image"

                            onerror="
                                this.src='https://via.placeholder.com/120x120?text=Management'
                            "
                        >

                    </div>

                    <!-- DETAILS -->

                    <div class="management-details">

                        <h3 class="management-name">
                            ${item.name || item.Name || "No Name"}
                        </h3>

                        <p>
                            <i class="fa-solid fa-id-card"></i>

                            <strong>ID:</strong>

                            ${item.Id || item.managementId || item.id || "N/A"}
                        </p>

                        <p>
                            <i class="fa-solid fa-user-tie"></i>

                            <strong>Post:</strong>

                            ${item.post || item.Post || "N/A"}
                        </p>

                        <p>
                            <i class="fa-solid fa-envelope"></i>

                            <strong>Email:</strong>

                            ${item.email || item.Email || "N/A"}
                        </p>

                        <p>
                            <i class="fa-solid fa-phone"></i>

                            <strong>Phone:</strong>

                            ${item.phone || item.Phone || "N/A"}
                        </p>

                        <p>
                            <i class="fa-solid fa-building"></i>

                            <strong>Department:</strong>

                            ${item.department || item.Department || "N/A"}
                        </p>

                        <p>
                            <i class="fa-solid fa-circle-check"></i>

                            <strong>Status:</strong>

                            ${item.status || item.Status || "inactive"}
                        </p>

                        <p class="management-description">
                            ${item.description || item.Description || ""}
                        </p>

                        <!-- ACTIONS -->

                       <div class="management-actions">

    <!-- DOWNLOAD ID CARD -->

    <button class="download-btn"
    onclick='downloadManagementCard(${JSON.stringify(JSON.stringify(item))})'>
    <i class="fa-solid fa-id-card"></i>
        ID Card
        </button>

    <!-- DELETE -->

    <button class="delete-btn" onclick="deleteManagement('${item._id}')">
<i class="fa-solid fa-trash"></i>
Delete
</button>

</div>
</div>
</div>
`;
            }).join("");

        console.log("✅ Management loaded successfully");

    } catch (err) {

        console.error("❌ LOAD ERROR:", err);

        container.innerHTML = `
            <div class="error-message">
                Failed to load management data
            </div>
        `;
    }
}


/* =========================
DELETE MANAGEMENT
========================= */

async function deleteManagement(id) {

    console.log("🗑 DELETE REQUEST:", id);

    const confirmDelete = confirm(
        "Are you sure you want to delete this management member?"
    );

    if (!confirmDelete) return;

    try {

        const response =
            await authFetch(

                `${window.BASE_URL}/management/delete-management/${id}`,

                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        console.log(
            "🗑 DELETE RESPONSE:",
            data
        );

        if (data.success) {

            alert(
                "Management Deleted Successfully"
            );

            loadManagement();

        } else {

            alert(
                data.message ||
                "Delete failed"
            );
        }

    } catch (err) {

        console.error("❌ DELETE ERROR:", err);

        alert("Delete failed");
    }
}


/* =========================
SEARCH MANAGEMENT
========================= */

window.searchManagement = function () {

    const input =
        document
            .getElementById("managementSearch")
            .value
            .toLowerCase();

    const cards =
        document.querySelectorAll(".management-card");

    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();

        card.style.display =
            text.includes(input)
                ? "flex"
                : "none";
    });
};


/* =========================
AUTO INITIALIZE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "📄 DOM CONTENT LOADED"
        );

        if (
            document.getElementById("managementForm")
        ) {

            initializeManagement();

        }

    }
);

/* =========================================
MANAGEMENT ID CARD GENERATION & DOWNLOAD
========================================= */

function createManagementCardHTML(management) {

    const img = management.image
        ? `${SERVER_URL}/uploads/${management.image}`
        : "https://via.placeholder.com/120x120?text=Management";

    return `

    <div id="managementIdCard"
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
        "
    >

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
                src="./Logo.png"
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

                <h3 style=" margin:0; font-size:16px; font-weight:bold; color:gold;">
                    FuturePath EduTech Institute
                </h3>

                <p style=" margin:4px 0; font-size:12px;">
                    -------------------------------
                </p>

                <h4 style=" margin:0; font-size:14px; color:white;">
                    MANAGEMENT ID CARD
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
                    ${management.name || management.Name || ""}
                </div>

                <div>
                    <b>ID:</b>
                    ${management.Id || management.managementId || management.id || "N/A"}
                </div>

                <div>
                    <b>Post:</b>
                    ${management.post || management.Post || ""}
                </div>

                <div>
                    <b>Phone:</b>
                    ${management.phone || management.Phone || ""}
                </div>

                <div>
                    <b>Email:</b>
                    ${management.email || management.Email || ""}
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
DOWNLOAD MANAGEMENT CARD
========================================= */

async function downloadManagementCard(management) {

    management = JSON.parse(management);

    try {

        /* =========================
        STEP 1: CREATE TEMP CONTAINER
        ========================= */

        const container =
            document.createElement("div");

        container.style.position = "absolute";
        container.style.left = "-99999px";
        container.style.top = "0";

        container.style.zIndex = "999999";
        container.style.background = "#8e93f4";
        container.style.padding = "10px";
        container.style.color = "black";

        document.body.appendChild(container);

        container.innerHTML =
            createManagementCardHTML(management);

        const card =
            container.firstElementChild;

        /* =========================
        STEP 2: FORCE STABLE STYLES
        ========================= */

        card.style.background = "#8677f3";
        card.style.color = "black";
        card.style.border = "2px solid #4606f6";

        const images =
            card.querySelectorAll("img");

        for (const img of images) {

            img.crossOrigin = "anonymous";

            if (!img.complete || img.naturalHeight === 0) {

                await new Promise(resolve => {

                    img.onload = resolve;
                    img.onerror = resolve;

                });

            }

        }

        /* =========================
        STEP 3: WAIT FOR RENDER
        ========================= */

        await new Promise(resolve =>
            setTimeout(resolve, 300)
        );

        await new Promise(requestAnimationFrame);

        /* =========================
        STEP 4: PDF GENERATION
        ========================= */

        const opt = {

            margin: 0,

            filename:
                `${management.name || "Management"}_ID_Card.pdf`,

            image: {
                type: "jpeg",
                quality: 1
            },

            html2canvas: {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: "#8c76e8",
                scrollX: 0,
                scrollY: 0
            },

            jsPDF: {
                unit: "px",
                format: [350, 220],
                orientation: "landscape"
            }

        };

        await html2pdf()
            .set(opt)
            .from(card)
            .save();

        /* =========================
        STEP 5: CLEANUP
        ========================= */

        document.body.removeChild(container);

        console.log(
            "✅ Management ID Card Downloaded"
        );

    } catch (err) {

        console.error(
            "❌ PDF generation failed:",
            err
        );

        alert(
            "PDF download failed. Check console."
        );

    }

}