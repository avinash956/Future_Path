// =====================================
// GLOBAL UTILITIES & UI ALERTS
// =====================================
function showMessage(msg) {
  const el = document.getElementById("responseMessage");
  if (el) {
    el.style.color = "red";
    el.innerText = msg;
  }
}

function showSuccess(msg) {
  const el = document.getElementById("responseMessage");
  if (el) {
    el.style.color = "green";
    el.innerText = msg;
  }
}

// =====================================
// AUTHENTICATION SESSION MANAGEMENT
// =====================================
function logout() {
  localStorage.clear(); // Safely wipes all keys including token, role, and profilePic
  window.location.href = "login.html";
}

function protect(role) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }
  if (role !== "all" && role !== userRole) {
    alert("Unauthorized Access");
    window.location.href = "login.html";
  }
}

function protectRole(requiredRoles) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }
  if (!requiredRoles.includes(role)) {
    alert("Unauthorized Access");
    window.location.href = "login.html";
  }
}

// =====================================
// INITIALIZATION ENGINE
// =====================================
document.addEventListener("DOMContentLoaded", function () {

  // =====================================
  // CHANGE PASSWORD PAGE INIT
  // =====================================
  function initializeChangePasswordPage() {
    console.log("Change Password Page Loaded");
  }

  // Call it automatically
  initializeChangePasswordPage();

  // existing login code...
  
  // =====================================
  // UNIFIED LOGIN INTERFACE HANDLER
  // =====================================
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.onsubmit = null; // Wipe out inline event handlers safely

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Flexible extraction mapping to handle both multi-type inputs or standard email selectors
      const loginType = document.querySelector('input[name="loginType"]:checked')?.value || "email";
      const primaryInput = document.getElementById("loginInput")?.value?.trim() || 
                           document.getElementById("email")?.value?.trim() || "";
      const password = document.getElementById("password")?.value?.trim() || "";
      const role = document.getElementById("role")?.value || "";

      console.group("===== 🌐 AUTH.JS LOGIN DEBUG =====");
      console.log("1. Form Values Extracted:");
      console.log("   -> loginType:", JSON.stringify(loginType));
      console.log("   -> primaryInput:", JSON.stringify(primaryInput));
      console.log("   -> password length:", password ? password.length : 0);
      console.log("   -> role:", JSON.stringify(role));

      // Client validation checkpoint
      if (!primaryInput || !password || !role) {
        console.warn("❌ Client Validation Failed: One or more fields are empty!");
        console.groupEnd();
        showMessage("All fields required");
        return;
      }

      try {
        console.log("2. Sending request to:", window.BASE_URL + "/auth/login");
        console.log("   -> Using HTTP Method:", ["POST", "PUT"].includes(loginType) ? loginType : "POST");
        
        const response = await fetch(window.BASE_URL + "/auth/login", {
         method: ["POST", "PUT"].includes(loginType) ? loginType : "POST", // Dynamic method selection based on loginType 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            loginType: loginType, 
            loginInput: primaryInput,
            email: primaryInput, // Backward-compatibility fallback payload field
            password: password, 
            role: role 
          })
        });

        console.log("3. Server Network Response Status:", response.status, response.statusText);
        const data = await response.json();
        console.log("4. Server Parsed JSON Data Response:", data);

        if (!response.ok) {
          const errorMessage = data.message || data.error || data.msg || "Login Failed";
          console.error("❌ Login failed at server checkpoint. Error message:", errorMessage);
          console.groupEnd();
          showMessage(errorMessage);
          return;
        }

        // Committing persistent auth tokens and metadata profiles to LocalStorage
        console.log("5. Success! Committing to localStorage...");
        localStorage.setItem("token", data.token);

        if (data.user) {
          // New dynamic database schema payload parser
          console.log("   -> Saving using dynamic database schema parser:", data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("role", data.user.role || "");
          localStorage.setItem("name", data.user.name || "");
          localStorage.setItem("userEmail", data.user.email || primaryInput);
          localStorage.setItem("profilePic", data.user.profile_pic || "");
        } else {
          // Legacy direct flat schema response fallbacks
          console.log("   -> Saving using legacy flat schema response fallback.");
          localStorage.setItem("role", data.role || "");
          localStorage.setItem("name", data.name || "");
          localStorage.setItem("userEmail", data.email || primaryInput);
        }

        console.log("✅ LocalStorage commit finished successfully.");
        console.groupEnd();
        showSuccess("Login Successful");

        // Delayed route routing engine 
        setTimeout(function () {
          const targetRole = data.user ? data.user.role : data.role;
          if (targetRole === "admin") {
            window.location.href = "dashboard.html";
          } else if (targetRole === "management") {
            window.location.href = "management.html";
          } else if (targetRole === "faculty") {
            window.location.href = "faculty.html";
          } else {
            window.location.href = "student.html";
          }
        }, 800);

      } catch (error) {
        console.error("Connection Interface Error:", error);
        showMessage("Backend not reachable");
      }
      
    });
  }

 // =====================================
// ADVANCED CHANGE PASSWORD HANDLER
// =====================================
    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
        changePasswordForm.onsubmit = null; // Clear any inline handlers
        changePasswordForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const currentPassword = document.getElementById("currentPassword")?.value?.trim() || "";
            const newPassword = document.getElementById("newPassword")?.value?.trim() || "";
            const confirmPassword = document.getElementById("confirmPassword")?.value?.trim() || "";
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showMessage("All fields are required");
                return;
            }
            if (newPassword !== confirmPassword) {
                showMessage("New passwords do not match");
                return;
            }

            try {
                const token = localStorage.getItem("token");

                        if (!token) {
                                showMessage("Session expired. Please login again.");
                                return;
                                }
                const response = await fetch(window.BASE_URL + "/auth/change-password", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMessage = data.message || data.error || data.msg || "Password change failed";
                    showMessage(errorMessage);
                    return;
                }

                showSuccess("Password changed successfully");
                localStorage.clear();

              setTimeout(() => {
              window.location.href = "login.html";
                }, 1500);

            } catch (error) {
                console.error("Connection Interface Error:", error);
                showMessage("Backend not reachable");
            }
            function initializeChangePasswordPage() {
  console.log("Change Password Page Loaded");
}
        });
    }
}
);
// =======================================================
// FORGOT PASSWORD BACKEND API FETCH FUNCTIONS
// =======================================================

// =======================================================
// DYNAMIC NOTIFICATION SYSTEM (TOAST ALERTS)
// =======================================================

function showSuccess(message) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.cssText = `
    background-color: #10B981;
    color: white;
    padding: 12px 24px;
    margin-bottom: 10px;
    border-radius: 6px;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showMessage(message) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.cssText = `
    background-color: #EF4444;
    color: white;
    padding: 12px 24px;
    margin-bottom: 10px;
    border-radius: 6px;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =======================================================
// FORGOT PASSWORD BACKEND API FETCH FUNCTIONS
// =======================================================

async function forgotPasswordApiFetch(email) {
  const targetUrl = (window.BASE_URL || "/api") + "/auth/forgot-password";
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email?.trim() })
  });
  return await res.json();
}

async function verifyOtpApiFetch(email, otp) {
  const targetUrl = (window.BASE_URL || "/api") + "/auth/verify-otp";
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email?.trim(), otp: otp?.trim() })
  });
  return await res.json();
}

async function resetPasswordApiFetch(email, newPassword) {
  const targetUrl = (window.BASE_URL || "/api") + "/auth/reset-password";
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email?.trim(), newPassword: newPassword?.trim() })
  });
  return await res.json();
}

// =======================================================
// INTERACTIVE STATE MANAGEMENT FLOW HANDLERS
// =======================================================

let globalSessionResetEmail = "";

function toggleForgotPassword(event) {
  if (event) event.preventDefault();
  const targetBox = document.getElementById("forgotPasswordBox");
  if (targetBox) {
    targetBox.style.display = (targetBox.style.display === "none") ? "block" : "none";
  }
}

// Helper to prevent multiple clicks and manage visual state
function setButtonState(buttonSelector, isLoading, text) {
  const btn = document.querySelector(buttonSelector);
  if (btn) {
    btn.disabled = isLoading;
    btn.innerText = text;
  }
}

async function handleSendOtp() {
  const emailVal = document.getElementById("fpEmail")?.value || "";
  
  if (!emailVal.trim()) {
    showMessage("Please enter your email.");
    return;
  }

  try {
    // 1. Give instant feedback to user
    setButtonState("button[onclick*='handleSendOtp']", true, "Sending...");
    
    const data = await forgotPasswordApiFetch(emailVal);
    
    if (data.success) {
      globalSessionResetEmail = emailVal.trim();
      const emailInput = document.getElementById("fpEmail");
      if (emailInput) emailInput.disabled = true;
      showSuccess("OTP dispatched. Review server console.");
    } else {
      showMessage(data.message || "Failed to generate token.");
    }
  } catch (err) {
    console.error(err);
    showMessage("Server communication failed. Try again.");
  } finally {
    // 2. Reset button text back to normal
    setButtonState("button[onclick*='handleSendOtp']", false, "Send OTP");
  }
}

async function handleVerifyOtp() {
  const otpVal = document.getElementById("fpOtp")?.value || "";

  if (!globalSessionResetEmail) {
    showMessage("Session error. Please trigger an OTP generation request first.");
    return;
  }
  if (!otpVal.trim()) {
    showMessage("Please enter the 6-digit verification code.");
    return;
  }

  try {
    setButtonState("button[onclick*='handleVerifyOtp']", true, "Verifying...");
    const data = await verifyOtpApiFetch(globalSessionResetEmail, otpVal);

    if (data.success) {
      const otpInput = document.getElementById("fpOtp");
      if (otpInput) otpInput.disabled = true;
      showSuccess("OTP Approved! Enter your new password.");
    } else {
      showMessage(data.message || "Invalid or expired token.");
    }
  } catch (err) {
    console.error(err);
    showMessage("Verification failed due to a network error.");
  } finally {
    setButtonState("button[onclick*='handleVerifyOtp']", false, "Verify OTP");
  }
}

async function handleResetPassword() {
  const newPassVal = document.getElementById("newPassword")?.value || "";

  if (!globalSessionResetEmail) {
    showMessage("Session lost. Restart the recovery steps.");
    return;
  }
  if (!newPassVal.trim()) {
    showMessage("Password string cannot be empty.");
    return;
  }

  try {
    setButtonState("button[onclick*='handleResetPassword']", true, "Updating...");
    const data = await resetPasswordApiFetch(globalSessionResetEmail, newPassVal);

    if (data.success) {
      showSuccess("Password successfully changed!");
      
      const fpEmail = document.getElementById("fpEmail");
      const fpOtp = document.getElementById("fpOtp");
      const newPassword = document.getElementById("newPassword");
      const targetBox = document.getElementById("forgotPasswordBox");

      if (fpEmail) { fpEmail.value = ""; fpEmail.disabled = false; }
      if (fpOtp) { fpOtp.value = ""; fpOtp.disabled = false; }
      if (newPassword) newPassword.value = "";
      
      globalSessionResetEmail = "";
      if (targetBox) targetBox.style.display = "none";
    } else {
      showMessage(data.message || "Failed to register updates.");
    }
  } catch (err) {
    console.error(err);
    showMessage("Failed to update password. Server connection error.");
  } finally {
    setButtonState("button[onclick*='handleResetPassword']", false, "Update Password");
  }
}