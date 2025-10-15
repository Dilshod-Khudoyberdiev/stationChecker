import { api } from "./api.js";
import { auth } from "./auth.js";

const form = document.getElementById("form");
const msgDiv = document.getElementById("msg");
const submitBtn = form.querySelector('button[type="submit"]');
const titleInput = document.getElementById("title");
const stationSel = document.getElementById("station");
const navAuth = document.getElementById("nav-auth-section");

// ── NAVIGATION BAR ────────────────────────────────────────────────────────────
// Show "Mein Dashboard" + logout if logged in, else login/register links
if (auth.loggedIn()) {
    navAuth.innerHTML = `
    <a class="btn btn-outline-primary me-2"
       href="resident-dashboard.html">Mein Dashboard</a>
    <button class="btn btn-outline-secondary" id="logout">
      <i class="bi-box-arrow-right"></i>
    </button>
  `;
    document.getElementById("logout").onclick = () => {
        auth.remove();
        location.href = "/index.html";
    };
} else {
    navAuth.innerHTML = `
    <a class="btn btn-outline-primary me-2" href="login.html">Anmelden</a>
    <a class="btn btn-primary" href="register.html">Registrieren</a>
  `;
}

// ── SIMPLE ALERT ──────────────────────────────────────────────────────────────
function show(message, type = "danger") {
    msgDiv.className = `alert alert-${type}`;
    msgDiv.textContent = message;
}

// ── BASIC FIELD VALIDATION ────────────────────────────────────────────────────
function required(field) {
    const ok = field.value.trim() !== "";
    field.classList.toggle("is-invalid", !ok);
    return ok;
}
titleInput.onblur = () => required(titleInput);
stationSel.onchange = () => required(stationSel);

// ── FORM SUBMIT ───────────────────────────────────────────────────────────────
form.onsubmit = async ev => {
    ev.preventDefault();
    msgDiv.className = "alert d-none";

    // client‐side required checks
    if (!required(titleInput) || !required(stationSel)) {
        return show("Bitte alle Pflichtfelder ausfüllen.", "warning");
    }

    // guests must log in first (UX choice)
    if (!auth.loggedIn()) {
        return location.href = "login.html?next=report.html";
    }

    // pick a photo from gallery or camera
    const gallery = form.photo.files[0];
    const camera = form.camera.files[0];
    const file = gallery || camera;
    if (file && file.size > 2 * 1024 * 1024) {
        return show("Bild > 2 MB.", "warning");
    }

    // disable & show spinner
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>Senden…
  `;

    try {
        // build payload; we always send reporterEmail when not anonymous
        const eventData = {
            titel: titleInput.value.trim(),
            beschreibung: form.desc.value.trim(),
            bahnhof: stationSel.value,
            istAnonym: form.anon.checked,
            // only include email if not anonymous
            reporterEmail: form.anon.checked ? null
                : auth.payload()?.email ?? null
        };

        // POST → sends Authorization header automatically if token exists
        const created = await api.post("/events", eventData);

        // if uploaded a file, send it
        if (file && created.id) {
            const fd = new FormData();
            fd.append("file", file);
            await api.upload(`/events/${created.id}/upload`, fd);
        }

        show("Danke! Meldung gespeichert – Weiterleitung …", "success");
        form.reset();

        // redirect after a brief pause
        setTimeout(() => location.href = "resident-dashboard.html", 1500);

    } catch (err) {
        // show error & re-enable button
        show("Fehler: " + err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML =
            '<i class="bi-send-fill me-1"></i> Meldung abschicken';
    }
};
