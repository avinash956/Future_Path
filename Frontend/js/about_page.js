/* =========================================
   MENU TOGGLE
========================================= */

function toggleMenu() {

  document
    .getElementById("dropdownMenu")
    .classList.toggle("active");
}

document.addEventListener("click", function(e){

  let menu =
    document.getElementById("dropdownMenu");

  let btn =
    document.querySelector(".menu-toggle");

  if (
    menu &&
    btn &&
    !menu.contains(e.target) &&
    !btn.contains(e.target)
  ) {
    menu.classList.remove("active");
  }

});


/* =========================================
   SIDEBAR TOGGLE
========================================= */

function toggleSidebar() {

  const sidebar =
    document.getElementById("sidebar");

  sidebar.classList.toggle("collapsed");

}


/* =========================================
   SHOW SECTION
========================================= */

function showSection(sectionId) {

  const sections =
    document.querySelectorAll(".content-section");

  sections.forEach(section => {
    section.style.display = "none";
  });

  document.getElementById(sectionId)
    .style.display = "block";

}


/* =========================================
   ADMIN SECURITY SYSTEM
========================================= */

/*
  STEP 1 SECURITY
*/

const isLoggedIn =
  localStorage.getItem("isLoggedIn");

const userRole =
  localStorage.getItem("userRole");

/*
  STEP 2 SECURITY
*/

const adminToken =
  localStorage.getItem("adminToken");

const VALID_ADMIN_TOKEN =
  "FP_ADMIN_2026_SECURE";

/*
  FINAL CHECK
*/

const isAdmin =
  isLoggedIn === "true" &&
  userRole === "admin" &&
  adminToken === VALID_ADMIN_TOKEN;


/* =========================================
   ENABLE ADMIN FEATURES
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /*
    SHOW DEFAULT SECTION
  */

  showSection("defaultSection");

  /*
    ADMIN FEATURES
  */

  if (isAdmin) {

    const adminControls =
      document.getElementById("adminControls");

    adminControls.style.display = "block";

    document.getElementById("founderUpload")
      .style.display = "block";

    document.getElementById("cofounderUpload")
      .style.display = "block";
  }

  /*
    LOAD SAVED DATA
  */

  loadSavedData();

  /*
    LOAD IMAGES
  */

  loadProfileImages();

});


/* =========================================
   CHECK ADMIN ACCESS
========================================= */

function checkAdminAccess() {

  if (!isAdmin) {

    alert("Access Denied! Admin Only.");

    return false;
  }

  return true;
}


/* =========================================
   ADD NEW CARD
========================================= */

function addCard() {

  if (!checkAdminAccess()) return;

  const container =
    document.getElementById("aboutContainer");

  const card =
    document.createElement("div");

  card.className = "about-card";

  card.innerHTML = `

    <div class="card-icon-wrapper blue-gradient">
      <i class="fa-solid fa-layer-group"></i>
    </div>

    <h3 contenteditable="true">
      New Section
    </h3>

    <p contenteditable="true">
      Add Description Here...
    </p>

  `;

  container.appendChild(card);

}


/* =========================================
   SAVE DATA
========================================= */

function saveData() {

  if (!checkAdminAccess()) return;

  const content =
    document.getElementById("aboutContainer")
    .innerHTML;

  localStorage.setItem(
    "aboutSectionData",
    content
  );

  alert("Changes Saved Successfully.");

}


/* =========================================
   LOAD SAVED DATA
========================================= */

function loadSavedData() {

  const savedData =
    localStorage.getItem("aboutSectionData");

  if (savedData) {

    document.getElementById("aboutContainer")
      .innerHTML = savedData;
  }

}


/* =========================================
   IMAGE UPLOAD
========================================= */

function uploadProfileImage(
  event,
  imageId,
  fallbackId
) {

  if (!checkAdminAccess()) return;

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = function(e) {

    const img =
      document.getElementById(imageId);

    const fallback =
      document.getElementById(fallbackId);

    img.src = e.target.result;

    img.style.display = "block";

    fallback.style.display = "none";

    localStorage.setItem(
      imageId,
      e.target.result
    );

  };

  reader.readAsDataURL(file);

}


/* =========================================
   LOAD PROFILE IMAGES
========================================= */

function loadProfileImages() {

  const founderImg =
    localStorage.getItem("founderDisplayImg");

  if (founderImg) {

    document.getElementById(
      "founderDisplayImg"
    ).src = founderImg;

    document.getElementById(
      "founderDisplayImg"
    ).style.display = "block";

    document.getElementById(
      "founderFallbackIcon"
    ).style.display = "none";
  }

  const cofounderImg =
    localStorage.getItem("cofounderDisplayImg");

  if (cofounderImg) {

    document.getElementById(
      "cofounderDisplayImg"
    ).src = cofounderImg;

    document.getElementById(
      "cofounderDisplayImg"
    ).style.display = "block";

    document.getElementById(
      "cofounderFallbackIcon"
    ).style.display = "none";
  }

}


/* =========================================
   LOGOUT
========================================= */

function logout() {

  localStorage.removeItem("isLoggedIn");

  localStorage.removeItem("userRole");

  localStorage.removeItem("adminToken");

  window.location.href = "login.html";
}


/* =========================================
   DEMO ADMIN LOGIN
   REMOVE THIS IN PRODUCTION
========================================= */

/*
  ADMIN LOGIN:
*/

function demoAdminLogin() {

  localStorage.setItem(
    "isLoggedIn",
    "true"
  );

  localStorage.setItem(
    "userRole",
    "admin"
  );

  localStorage.setItem(
    "adminToken",
    "FP_ADMIN_2026_SECURE"
  );

  location.reload();
}

/*
  USER LOGIN:
*/

function demoUserLogin() {

  localStorage.setItem(
    "isLoggedIn",
    "true"
  );

  localStorage.setItem(
    "userRole",
    "student"
  );

  localStorage.removeItem(
    "adminToken"
  );

  location.reload();
}