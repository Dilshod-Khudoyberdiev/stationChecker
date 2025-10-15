import { api } from "./api.js";
import { clearAuthData } from "./auth.js";

const alertPlaceholder = document.getElementById("alertPlaceholder");
const form = document.getElementById("profileForm");
const logoutBtn = document.getElementById("logout");

let storedName = "";
let storedEmail = "";
let storedRole = "";

/** Show a Bootstrap alert in the placeholder */
function showAlert(message, type = "success", timeout = 4000) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    alertPlaceholder.append(wrapper);
    if (timeout) setTimeout(() => wrapper.remove(), timeout);
}

/** Load & display current user profile */
async function loadProfile() {
    try {
        const { fullName, email, role } = await api.auth.me();
        storedName = fullName;
        storedEmail = email;
        storedRole = role;

        document.getElementById("profileName").textContent = fullName;
        document.getElementById("profileEmail").textContent = email;
        document.getElementById("profileRole").textContent = role;
    } catch (err) {
        showAlert("Profil konnte nicht geladen werden.", "danger", 6000);
    }
}

/** Handle password-change form submit */
form.addEventListener("submit", async e => {
    e.preventDefault();

    const current = form.currentPassword.value;
    const next = form.newPassword.value;
    const confirm = form.confirmPassword.value;

    if (!current || !next || next !== confirm) {
        showAlert(
            "Bitte aktuelles Passwort eingeben und neues Passwort zweimal identisch eingeben.",
            "danger"
        );
        return;
    }

    try {
        await api.auth.updateMe({
            fullName: storedName,
            email: storedEmail,
            currentPassword: current,
            newPassword: next
        });
        showAlert("Passwort erfolgreich geändert.");
        ["currentPassword", "newPassword", "confirmPassword"].forEach(id => {
            form[id].value = "";
        });
    } catch (err) {
        showAlert(err.message || "Speichern fehlgeschlagen.", "danger");
    }
});

/** Toggle password visibility */
document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector("i");
        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("bi-eye", "bi-eye-slash");
        } else {
            input.type = "password";
            icon.classList.replace("bi-eye-slash", "bi-eye");
        }
    });
});

/** Logout button */
logoutBtn.addEventListener("click", () => {
    clearAuthData();
    window.location.href = "/assets/html/login.html";
});

loadProfile();
