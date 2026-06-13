// =====================================================
// API CONFIG
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api/about";


// =====================================================
// TOKEN HELPERS
// =====================================================

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`
    };
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAboutData();

        checkAdminAccess();
    }
);


// =====================================================
// CHECK ADMIN
// =====================================================

function checkAdminAccess() {

    const token = getToken();

    if (!token) return;

    const adminControls =
        document.getElementById("adminControls");

    if (adminControls) {
        adminControls.style.display = "block";
    }
}


// =====================================================
// LOAD ABOUT DATA
// =====================================================

async function loadAboutData() {

    try {

        const response =
            await fetch(`${API_BASE}/`);

        const data =
            await response.json();

        console.log(
            "ABOUT DATA:",
            data
        );

        // =========================================
        // MAIN CONTENT
        // =========================================

        const vision =
            document.getElementById("visionText");

        const mission =
            document.getElementById("missionText");

        const description =
            document.getElementById(
                "instituteDescription"
            );

        if (vision)
            vision.innerText =
                data.vision || "";

        if (mission)
            mission.innerText =
                data.mission || "";

        if (description)
            description.innerText =
                data.description || "";


        // =========================================
        // FOUNDER
        // =========================================

        const founderName =
            document.getElementById(
                "founderName"
            );

        if (founderName) {

            founderName.innerText =
                data.founder_name ||
                "Avinash Tripathi";
        }

        const founderImg =
            document.getElementById(
                "founderImg"
            );

        if (
            founderImg &&
            data.founder_image
        ) {

            founderImg.src =
                `http://127.0.0.1:5000/${data.founder_image}`;

            founderImg.style.display =
                "block";
        }


        // =========================================
        // CO-FOUNDER
        // =========================================

        const cofounderName =
            document.getElementById(
                "cofounderName"
            );

        if (cofounderName) {

            cofounderName.innerText =
                data.cofounder_name ||
                "Kavita Tripathi";
        }

        const cofounderImg =
            document.getElementById(
                "cofounderImg"
            );

        if (
            cofounderImg &&
            data.cofounder_image
        ) {

            cofounderImg.src =
                `http://127.0.0.1:5000/${data.cofounder_image}`;

            cofounderImg.style.display =
                "block";
        }

    }
    catch (error) {

        console.error(
            "LOAD ERROR:",
            error
        );
    }
}


// =====================================================
// SAVE DATA
// =====================================================

async function saveData() {

    try {

        const payload = {

            vision:
                document.getElementById(
                    "visionText"
                )?.innerText || "",

            mission:
                document.getElementById(
                    "missionText"
                )?.innerText || "",

            description:
                document.getElementById(
                    "instituteDescription"
                )?.innerText || "",

            founder_name:
                document.getElementById(
                    "founderName"
                )?.innerText || "Avinash Tripathi",

            cofounder_name:
                document.getElementById(
                    "cofounderName"
                )?.innerText || "Kavita Tripathi"
        };

        console.log(
            "SAVE PAYLOAD:",
            payload
        );

        const response =
            await fetch(
                `${API_BASE}/save`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify(
                        payload
                    )
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Save Failed"
            );

            return;
        }

        alert(
            data.message ||
            "Saved Successfully"
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to save data"
        );
    }
}


// =====================================================
// UPLOAD IMAGE
// =====================================================

async function uploadProfileImage(
    event,
    imageId
) {

    const file =
        event.target.files[0];

    if (!file) return;

    const formData =
        new FormData();

    formData.append(
        "image",
        file
    );

    formData.append(
        "type",
        imageId
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/upload-image`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders()
                    },
                    body: formData
                }
            );

        const data =
            await response.json();

        console.log(
            "UPLOAD RESPONSE:",
            data
        );

        if (!data.success) {

            alert(
                data.message ||
                "Upload Failed"
            );

            return;
        }

        const img =
            document.getElementById(
                imageId
            );

        if (img) {

            img.src =
                `http://127.0.0.1:5000/${data.image_url}`;

            img.style.display =
                "block";
        }

        alert(
            "Image Uploaded Successfully"
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Image Upload Failed"
        );
    }
}


// =====================================================
// OPTIONAL MENU TOGGLE
// =====================================================

function toggleMenu() {

    const menu =
        document.getElementById(
            "dropdownMenu"
        );

    if (menu) {

        menu.classList.toggle(
            "active"
        );
    }
}


// =====================================================
// OPTIONAL LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    window.location.href =
        "login.html";
}