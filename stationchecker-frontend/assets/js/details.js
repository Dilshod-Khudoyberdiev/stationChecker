// /assets/js/details.js
import { api } from "./api.js";
import { auth } from "./auth.js";
import {
    createStatusBadge,
    formatDate,
    nl2br
} from "./utils.js";

/* ─── modal singleton ─────────────────────────────────────────────── */
let bsModal, mTitle, mBody, mFooter;
function ensureModal() {
    if (bsModal) return;
    bsModal = new bootstrap.Modal(document.getElementById("eventModal"));
    mTitle = document.getElementById("eventModalLabel");
    mBody = document.getElementById("eventModalBody");
    mFooter = document.querySelector("#eventModal .modal-footer");
}

/* ─── public helper ───────────────────────────────────────────────── */
export async function showEvent(id) {
    ensureModal();

    try {
        const [ev, comments] = await Promise.all([
            api.events.get(`/events/${id}`),
            api.events.get(`/events/${id}/comments`, false).catch(() => []),
        ]);

        renderContent(ev, comments);
        buildFooter(ev);
        bsModal.show();

    } catch (err) {
        console.error(err);
        alert("Fehler beim Laden der Meldung.");
    }
}

/* ─── content helpers ─────────────────────────────────────────────── */
function renderContent(ev, comments) {
    const photo = [ev.imageUrl, ev.bildUrl, ev.fotoUrl]
        .find(u => typeof u === "string" && u.trim());

    mTitle.textContent = `${ev.titel} (#${ev.id})`;
    mBody.innerHTML = `
        ${photo ? `<img src="${photo}" class="img-fluid rounded mb-3">` : ""}
        <p><strong>Status:</strong> <span id="status-badge">${createStatusBadge(ev.status)}</span></p>
        <p class="mb-1"><i class="bi-geo-alt-fill me-1"></i><strong>Bahnhof:</strong> ${ev.bahnhof}</p>
        <p class="mb-4"><i class="bi-calendar-event me-1"></i><strong>Gemeldet:</strong> ${formatDate(ev.createdAt)}</p>

        <p class="mb-5">${ev.beschreibung ? nl2br(ev.beschreibung) : "<em>Keine Beschreibung vorhanden.</em>"}</p>

        <h6 class="fw-bold mb-3">Kommentare</h6>
        <div id="comments">
            ${comments.length
            ? comments.map(renderComment).join("")
            : "<p class='text-muted'>Noch keine Kommentare.</p>"}
        </div>`;
}

function renderComment(c) {
    return `
        <div class="border rounded p-2 mb-2">
            <div class="small text-muted mb-1">
                <i class="bi-person-circle me-1"></i>${c.author} – ${formatDate(c.createdAt)}
            </div>
            <div>${nl2br(c.text)}</div>
        </div>`;
}

/* ─── footer with role-based actions ───────────────────────────────── */
function buildFooter(ev) {
    mFooter.innerHTML = "";

    const payload = auth.payload() || {};
    const role = payload.role ??
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
        "Guest";

    /* Admin controls -------------------------------------------------- */
    if (role === "Admin") {
        mFooter.insertAdjacentHTML("afterbegin", `
            <div class="d-flex flex-wrap gap-2 me-auto">
                <select id="admin-status-select" class="form-select form-select-sm" style="width:auto">
                    ${["Offen", "In Bearbeitung", "Gelöst", "Duplikat"].map(s =>
            `<option ${s === ev.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>
                <button id="admin-status-save" class="btn btn-primary btn-sm">
                    <i class="bi-check-circle me-1"></i> Speichern
                </button>
                <button id="admin-delete" class="btn btn-outline-danger btn-sm">
                    <i class="bi-trash me-1"></i> Löschen
                </button>
            </div>`);

        /* save status */
        document.getElementById("admin-status-save").onclick = async e => {
            const btn = e.currentTarget;
            const newStatus = document.getElementById("admin-status-select").value;
            if (newStatus === ev.status) return;

            try {
                await api.events.put(`/events/${ev.id}/status`, { status: newStatus });
                document.getElementById("status-badge").outerHTML = createStatusBadge(newStatus);

                document.dispatchEvent(new CustomEvent("sc:statusChanged", {
                    detail: { id: ev.id, status: newStatus }
                }));
                ev.status = newStatus;

                /* green feedback */
                const old = btn.innerHTML;
                btn.classList.remove("btn-primary"); btn.classList.add("btn-success");
                btn.innerHTML = "<i class='bi-check-circle-fill me-1'></i>Gespeichert";
                setTimeout(() => {
                    btn.classList.remove("btn-success"); btn.classList.add("btn-primary");
                    btn.innerHTML = old;
                }, 2000);

            } catch { alert("Fehler beim Speichern."); }
        };

        /* delete event */
        document.getElementById("admin-delete").onclick = async () => {
            if (!confirm("Meldung wirklich löschen?")) return;
            try {
                await api.events.delete(`/events/${ev.id}`, true);
                document.dispatchEvent(new CustomEvent("sc:deleted", { detail: { id: ev.id } }));
                bsModal.hide();
            } catch { alert("Fehler beim Löschen (bitte neu anmelden)."); }
        };
    }

    /* Comment box ----------------------------------------------------- */
    if (role === "Resident" || role === "Admin") {
        mFooter.insertAdjacentHTML("beforeend", `
            <form id="comment-form" class="flex-grow-1 d-flex gap-2">
                <input id="comment-text" required class="form-control" placeholder="Kommentar schreiben …">
                <button class="btn btn-primary"><i class="bi-send"></i></button>
            </form>`);

        document.getElementById("comment-form").onsubmit = async e => {
            e.preventDefault();
            const txt = document.getElementById("comment-text").value.trim();
            if (!txt) return;
            try {
                const c = await api.events.post(`/events/${ev.id}/comments`, {
                    text: txt,
                    author: payload.email || "Anonym"
                });
                document.getElementById("comments")
                    .insertAdjacentHTML("beforeend", renderComment(c));
                e.target.reset();
            } catch { alert("Kommentar konnte nicht gespeichert werden."); }
        };
    }

    /* close button ---------------------------------------------------- */
    mFooter.insertAdjacentHTML("beforeend",
        `<button class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>`);
}
