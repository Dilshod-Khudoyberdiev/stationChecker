import api from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const errDiv = document.getElementById("err");
    const okDiv = document.getElementById("ok");

    form.addEventListener("submit", async e => {
        e.preventDefault();
        errDiv.classList.add("d-none");
        okDiv.classList.add("d-none");

        try {
            await api("auth", "/api/auth/register", {
                method: "POST",
                body: {
                    fullName: document.getElementById("name").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    password: document.getElementById("password").value
                },
                auth: false
            });
            okDiv.classList.remove("d-none");
        } catch (err) {
            errDiv.textContent = err.message;
            errDiv.classList.remove("d-none");
        }
    });

    // eye toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });
    });
});
