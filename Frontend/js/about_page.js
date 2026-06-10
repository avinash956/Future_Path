const API_BASE = "http://127.0.0.1:5000/api/about";

/* =========================
   GET JWT TOKEN
========================= */
function getToken() {
    return localStorage.getItem("token");
}

/* =========================
   HEADERS BUILDER
========================= */
function authHeaders() {
    return {
        "Authorization": "Bearer " + getToken()
    };
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    loadAboutData();
});

/* =========================
   LOAD DATA (PUBLIC)
========================= */
async function loadAboutData() {

    try {

        const res = await fetch(`${API_BASE}/`);
        const data = await res.json();

        console.log("API RESPONSE:", data);

        // TEXT
        document.getElementById("visionText").innerText = data.vision || "";
        document.getElementById("missionText").innerText = data.mission || "";
        document.getElementById("instituteDescription").innerText = data.description || "";

        // Founder
        document.getElementById("founderName").innerText = data.founder_name || "Founder";
        if (data.founder_image) {
            const img = document.getElementById("founderImg");
            img.src = `http://127.0.0.1:5000/${data.founder_image}`;
            img.style.display = "block";
        }

        // CoFounder
        document.getElementById("cofounderName").innerText = data.cofounder_name || "Co-Founder";
        if (data.cofounder_image) {
            const img = document.getElementById("cofounderImg");
            img.src = `http://127.0.0.1:5000/${data.cofounder_image}`;
            img.style.display = "block";
        }

    } catch (err) {
        console.error("Load Error:", err);
    }
}

/* =========================
   SAVE TEXT (ADMIN ONLY)
========================= */
async function saveData() {

    try {

        const res = await fetch(`${API_BASE}/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },
            body: JSON.stringify({
                vision: document.getElementById("visionText").innerText,
                mission: document.getElementById("missionText").innerText,
                description: document.getElementById("instituteDescription").innerText
            })
        });

        const data = await res.json();

        alert(data.message || "Updated");

    } catch (err) {
        console.error(err);
        alert("Save Failed");
    }
}

/* =========================
   IMAGE UPLOAD (ADMIN ONLY)
========================= */
async function uploadProfileImage(event, type) {

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);

    try {

        const res = await fetch(`${API_BASE}/upload-image`, {
            method: "POST",
            headers: {
                ...authHeaders()
            },
            body: formData
        });

        const data = await res.json();

        console.log("UPLOAD RESPONSE:", data);

        if (!data.success) {
            alert(data.message || "Upload Failed");
            return;
        }

        // FIX IMAGE UPDATE
        const img = document.getElementById(type);
        img.src = `http://127.0.0.1:5000/${data.image_url}`;
        img.style.display = "block";

        alert("Image Updated Successfully");

    } catch (err) {
        console.error(err);
        alert("Upload Failed");
    }
}