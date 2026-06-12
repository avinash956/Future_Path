/* =========================================
   REGISTER STUDENT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const registerForm =
        document.getElementById("registerForm");

    if (!registerForm) {
        console.error("Register form not found");
        return;
    }

    registerForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const registerMessage =
                document.getElementById(
                    "registerMessage"
                );

            registerMessage.innerHTML = "";

            try {

                const name =
                    document.getElementById("name").value.trim();

                const mobile =
                    document.getElementById("mobile").value.trim();

                const email =
                    document.getElementById("email").value.trim();

                const role =
                    document.getElementById("role").value;

                const course =
                    document.getElementById("course").value.trim();

                const photoInput =
                    document.getElementById("photo");

                /* =========================
                   VALIDATION
                ========================= */

                if (!name) {
                    registerMessage.innerHTML =
                        "Please enter your name";
                    return;
                }

                if (!mobile) {
                    registerMessage.innerHTML =
                        "Please enter mobile number";
                    return;
                }

                if (!email) {
                    registerMessage.innerHTML =
                        "Please enter email";
                    return;
                }

                if (!course) {
                    registerMessage.innerHTML =
                        "Please enter required course";
                    return;
                }

                if (
                    !photoInput ||
                    !photoInput.files ||
                    photoInput.files.length === 0
                ) {
                    registerMessage.innerHTML =
                        "Please upload your photo";
                    return;
                }

                const photo =
                    photoInput.files[0];

                console.log("Selected Photo:", photo);

                /* =========================
                   FORM DATA
                ========================= */

                const formData =
                    new FormData();

                formData.append(
                    "name",
                    name
                );

                formData.append(
                    "mobile",
                    mobile
                );

                formData.append(
                    "email",
                    email
                );

                formData.append(
                    "role",
                    role
                );

                formData.append(
                    "course",
                    course
                );

                formData.append(
                    "photo",
                    photo
                );

                console.log(
                    "Submitting registration..."
                );

                /* =========================
                   API CALL
                ========================= */

                const response =
                    await fetch(
                        "http://localhost:5000/api/register",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                console.log(
                    "Server Response:",
                    data
                );

                registerMessage.innerHTML =
                    data.message;

                if (
                    response.ok &&
                    data.success
                ) {

                    registerMessage.style.color =
                        "#16a34a";
                    registerMessage.innerHTML ="✅ Registration successful. Await admin approval.";

                    registerForm.reset();

                }
                else {

                    registerMessage.style.color =
                        "#ef4444";

                }

            }
            catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );

                registerMessage.innerHTML =
                    "Registration failed. Please try again.";

                registerMessage.style.color =
                    "#ef4444";

            }

        }
    );

});