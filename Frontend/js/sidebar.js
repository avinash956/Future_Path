// =====================================
// FUTURE PATH - ADVANCED SIDEBAR SYSTEM
// =====================================

document.addEventListener("DOMContentLoaded", function () {

  // =====================================
  // ELEMENTS
  // =====================================

  const sidebar =
    document.getElementById("sidebar");

  const toggleIcon =
    document.getElementById("toggleIcon");

  const buttons =
    document.querySelectorAll(".side-btn");

  const searchInput =
    document.getElementById("menuSearch");

  // =====================================
  // DEFAULT STATE
  // =====================================

  let isCollapsed = false;

  // =====================================
  // SIDEBAR TOGGLE
  // =====================================

  window.toggleSidebar = function () {

    if (!sidebar) return;

    isCollapsed = !isCollapsed;

    sidebar.classList.toggle(
      "collapsed",
      isCollapsed
    );

    // CHANGE ICON
    if (toggleIcon) {

      toggleIcon.className =
        isCollapsed
          ? "fa-solid fa-chevron-right"
          : "fa-solid fa-chevron-left";
    }
  };

  // =====================================
  // SECTION SWITCHING
  // =====================================

  window.showSection = function (sectionId) {

    // HIDE ALL
    document
      .querySelectorAll(".content-section")
      .forEach(section => {

        section.style.display = "none";

        section.classList.remove("active");
      });

    // SHOW TARGET
    const target =
      document.getElementById(sectionId);

    if (target) {

      target.style.display = "block";

      target.classList.add("active");
    }

    // REMOVE ACTIVE BUTTON
    buttons.forEach(btn => {
      btn.classList.remove("active");
    });

    // ADD ACTIVE BUTTON
    const activeBtn =
      Array.from(buttons).find(btn => {

        const clickAttr =
          btn.getAttribute("onclick");

        return (
          clickAttr &&
          clickAttr.includes(sectionId)
        );
      });

    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    // MOBILE AUTO COLLAPSE
    if (window.innerWidth <= 768) {

      sidebar.classList.add("collapsed");

      isCollapsed = true;

      if (toggleIcon) {

        toggleIcon.className =
          "fa-solid fa-chevron-right";
      }
    }
  };

  // =====================================
  // MENU SEARCH
  // =====================================

  if (searchInput) {

    searchInput.addEventListener(
      "keyup",
      function () {

        const value =
          this.value.toLowerCase();

        buttons.forEach(btn => {

          btn.style.display =
            btn.innerText
              .toLowerCase()
              .includes(value)
              ? "flex"
              : "none";
        });
      }
    );
  }

  // =====================================
  // LIVE CLOCK
  // =====================================

  setInterval(() => {

    const clock =
      document.getElementById("liveClock");

    if (clock) {

      const now = new Date();

      clock.innerHTML =
        now.toLocaleTimeString();
    }

  }, 1000);

  // =====================================
  // PRELOADER
  // =====================================

  window.addEventListener("load", () => {

    const preloader =
      document.getElementById("preloader");

    if (preloader) {

      setTimeout(() => {

        preloader.style.opacity = "0";

        preloader.style.visibility = "hidden";

      }, 500);
    }
  });

  // =====================================
  // DEFAULT SECTION
  // =====================================

  if (
    document.getElementById("facultySection")
  ) {

    showSection("facultySection");
  }

  // =====================================
  // ESC CLOSE
  // =====================================

  document.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Escape") {

        sidebar.classList.add(
          "collapsed"
        );

        isCollapsed = true;

        if (toggleIcon) {

          toggleIcon.className =
            "fa-solid fa-chevron-right";
        }
      }
    }
  );

});