import api from "./api.js";
import { auth } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const existing = auth.payload();
    if (existing) {
        const role = existing[roleClaim] ?? existing.role ?? "Resident";
        const target = role === "Admin" ? "admin-dashboard.html" : "resident-dashboard.html";
        window.location.replace(`/assets/html/${target}`);
        return;
    }

    const form = document.getElementById("login-form");
    const errDiv = document.getElementById("err");

    form.addEventListener("submit", async e => {
        e.preventDefault();
        errDiv.classList.add("d-none");

        try {
            const res = await api("auth", "/api/auth/login", {
                method: "POST",
                body: {
                    email: form.email.value.trim(),
                    password: form.password.value
                },
                auth: false
            });

            const jwt = typeof res === "string"
                ? res
                : res.token ?? res.jwt ?? res.accessToken ?? res.access_token;
            if (!jwt || jwt.split(".").length !== 3)
                throw new Error("Der Server hat kein gültiges JWT zurückgegeben.");

            auth.save(jwt);
            const payload = auth.payload();
            const role = payload?.[roleClaim] ?? payload?.role ?? "Resident";
            const next = new URLSearchParams(window.location.search).get("next");
            const ok = next && next.endsWith(".html") && !next.includes("/") && !next.includes("%");
            const nextPage = ok
                ? next
                : (role === "Admin" ? "admin-dashboard.html" : "resident-dashboard.html");

            window.location.href = `/assets/html/${nextPage}`;
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
