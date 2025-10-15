// /assets/js/resident.js
import { api } from "./api.js";
import { auth } from "./auth.js";
import {
    createStatusBadge,
    formatDate,
    debounce
} from "./utils.js";
import { showEvent } from "./details.js";

/* ─── guard + greeting ─────────────────────────────────────────────── */
if (!auth.loggedIn()) {
    location.href = "login.html";
    throw "redirect";
}

const payload = auth.payload() || {};
const myEmail = payload.email ??
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ?? "";
const myEmailLC = myEmail.toLowerCase();
const myUserId = payload.sub ??
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"] ?? "";
const fullName = payload.fullName ??
    payload.name ??
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? "";

["welcome-msg", "welcome-msg-sm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fullName ? `Willkommen, ${fullName}!` : "Willkommen!";
});

document.querySelectorAll("#logout").forEach(btn => {
    btn.addEventListener("click", () => {
        auth.remove();
        location.href = "../../../index.html";
    });
});

/* ─── cache + filters ──────────────────────────────────────────────── */
const allGrid = document.getElementById("all-grid");
const mineGrid = document.getElementById("mine-grid");

const fQuery = document.getElementById("f-q-res");
const fStation = document.getElementById("f-sta-res");
const fStatus = document.getElementById("f-st-res");

let eventsCache = [];
[fQuery, fStation, fStatus].forEach(el =>
    el?.addEventListener("input", debounce(renderGrids, 250))
);

/* ─── card template ───────────────────────────────────────────────── */
function isValidPhotoUrl(u) { return typeof u === "string" && u.trim() && /^(https?:\/\/|\/)/.test(u); }
function cardHTML(e) {
    const photo = [e.imageUrl, e.bildUrl].find(isValidPhotoUrl);
    return `
  <div class="col">
    <div class="card h-100 shadow-sm hover-lift fade-in" role="button" data-id="${e.id}">
      ${photo
            ? `<img src="${photo}" class="card-img-top" style="height:220px;object-fit:cover">`
            : `<div class="card-no-photo">Kein Foto vorhanden</div>`}
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="fw-bold mb-0 me-2">${e.titel}</h5>
          ${createStatusBadge(e.status)}
        </div>
        <h6 class="card-subtitle mb-3 text-muted">
          <i class="bi bi-geo-alt-fill me-1"></i>${e.bahnhof}
        </h6>
        <p class="card-text small text-body-secondary">
          ${e.beschreibung.slice(0, 140)}${e.beschreibung.length > 140 ? "…" : ""}
        </p>
      </div>
      <div class="card-footer bg-white border-top-0 small text-muted">
        ${formatDate(e.createdAt)}
      </div>
    </div>
  </div>`;
}

/* ─── rendering ───────────────────────────────────────────────────── */
function cardsOrEmpty(list) {
    return list.length
        ? list.map(cardHTML).join("")
        : `<div class="col"><div class="text-center p-5 bg-light rounded-4 w-100">
               <p class="text-muted mb-0">Keine Meldungen gefunden.</p>
           </div></div>`;
}
function attachClicks() {
    document.querySelectorAll("[data-id]").forEach(card => {
        card.onclick = () => showEvent(card.dataset.id);
    });
}

function renderGrids() {
    const term = fQuery.value.toLowerCase();
    const sta = fStation.value;
    const stat = fStatus.value;

    const filtered = eventsCache.filter(e =>
        (!sta || e.bahnhof === sta) &&
        (!stat || e.status === stat) &&
        (!term || e.titel.toLowerCase().includes(term) ||
            e.beschreibung.toLowerCase().includes(term))
    );

    allGrid.innerHTML = cardsOrEmpty(filtered);

    mineGrid.innerHTML = cardsOrEmpty(filtered.filter(e =>
        (e.reporterEmail && e.reporterEmail.toLowerCase() === myEmailLC) ||
        (e.benutzerId && e.benutzerId === myUserId)
    ));
    attachClicks();
}

/* ─── initial load ────────────────────────────────────────────────── */
function skeleton(grid) {
    grid.innerHTML = Array(6).fill(0).map(() =>
        `<div class="col"><div class="skeleton-card"></div></div>`).join("");
}
async function load() {
    skeleton(allGrid); skeleton(mineGrid);
    try {
        const list = await api.events.get("/events", false);
        eventsCache = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        buildStationOptions(eventsCache);
        renderGrids();
    } catch (err) {
        const html = `<div class="alert alert-danger"><strong>Fehler:</strong> ${err.message}</div>`;
        allGrid.innerHTML = mineGrid.innerHTML = html;
    }
}
function buildStationOptions(list) {
    const opts = [...new Set(list.map(e => e.bahnhof))].sort();
    fStation.innerHTML =
        `<option value="">Bahnhof (alle)</option>` +
        opts.map(s => `<option>${s}</option>`).join("");
}

/* live updates from modal */
document.addEventListener("sc:statusChanged", ({ detail }) => {
    const badge = document.querySelector(`[data-id="${detail.id}"] .badge`);
    if (badge) badge.outerHTML = createStatusBadge(detail.status);
});
document.addEventListener("sc:deleted", ({ detail }) => {
    const col = document.querySelector(`[data-id="${detail.id}"]`)?.closest(".col");
    if (col) col.remove();
    eventsCache = eventsCache.filter(e => e.id !== detail.id);
    renderGrids();
});

load();
