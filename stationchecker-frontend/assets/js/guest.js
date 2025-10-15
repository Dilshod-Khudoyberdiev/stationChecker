import { api } from "./api.js";
import { auth } from "./auth.js";
import { createStatusBadge, formatDate, debounce } from "./utils.js";

/* ---------- 0. Helpers --------------------------------------------------- */
/** true  ⇢ url is a non-empty string containing “http” or a slash  */
const hasValidPhoto = url => typeof url === "string" && /https?:|\/./.test(url);

/* ---------- 1. DOM refs -------------------------------------------------- */
const grid = document.getElementById("grid");
const stationFilter = document.getElementById("f-sta");
const statusFilter = document.getElementById("f-st");
const queryFilter = document.getElementById("f-q");
const guestAlert = document.getElementById("guest-overlay");

/* ---------- 2. State ----------------------------------------------------- */
let eventsCache = [];

/* ---------- 3. Filters --------------------------------------------------- */
const renderDebounced = debounce(renderCards, 250);
[stationFilter, statusFilter].forEach(el => el.addEventListener("input", renderCards));
queryFilter.addEventListener("input", renderDebounced);

/* ---------- 4. Card template -------------------------------------------- */
function cardHTML(e) {
    const photo = e.imageUrl ?? e.bildUrl;
    return `
  <div class="card guest-card h-100 shadow-sm fade-in">
    ${hasValidPhoto(photo)
            ? `<img src="${photo}" class="card-img-top" style="height:220px;object-fit:cover">`
            : `<div class="card-no-photo d-flex justify-content-center align-items-center">
             <span class="text-muted">Kein Foto vorhanden</span>
           </div>`
        }
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="fw-bold mb-0 me-2">${e.titel}</h5>
        ${createStatusBadge(e.status)}
      </div>
      <h6 class="card-subtitle mb-3 text-muted">
        <i class="bi-geo-alt-fill me-1"></i>${e.bahnhof}
      </h6>
      <p class="card-text small text-body-secondary">
        ${e.beschreibung.slice(0, 140)}${e.beschreibung.length > 140 ? "…" : ""}
      </p>
    </div>
    <div class="card-footer bg-white border-top-0 d-flex justify-content-between small">
      <span class="text-muted">${formatDate(e.createdAt)}</span>
      ${e.isAnonym
            ? '<span class="text-muted"><i class="bi-eye-slash-fill me-1"></i>Anonym</span>'
            : ""
        }
    </div>

    <!-- Hover overlay -->
    <div class="login-overlay d-flex flex-column">
      <p class="small mb-2">Details ansehen?<br><strong>Bitte anmelden</strong></p>
      <div class="d-flex gap-2">
        <a href="login.html"    class="btn btn-outline-primary btn-sm">Anmelden</a>
        <a href="register.html" class="btn btn-primary btn-sm">Registrieren</a>
      </div>
    </div>
  </div>`;
}

/* ---------- 5. Render / filter ------------------------------------------ */
function renderCards() {
    const sta = stationFilter.value;
    const stat = statusFilter.value;
    const term = queryFilter.value.toLowerCase();

    const list = eventsCache.filter(e =>
        (!sta || e.bahnhof === sta) &&
        (!stat || e.status === stat) &&
        (!term || e.titel.toLowerCase().includes(term) ||
            e.beschreibung.toLowerCase().includes(term))
    );

    grid.innerHTML = list.length
        ? list.map(cardHTML).join("")
        : `<div class="text-center p-5 bg-light rounded-4">
         <p class="text-muted mb-0">Keine Meldungen gefunden.</p>
       </div>`;
}

/* ---------- 6. Skeleton + initial load ---------------------------------- */
function skeleton() {
    grid.innerHTML = Array.from({ length: 6 }, () =>
        '<div class="skeleton-card col-12 col-md-6 col-lg-4"></div>').join("");
}

async function init() {
    guestAlert.classList.remove("d-none");
    skeleton();

    try {
        eventsCache = await api.get("/events", false);
        eventsCache.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderCards();
    } catch (err) {
        grid.innerHTML = `<div class="alert alert-danger">
                        <strong>Fehler:</strong> ${err.message}
                      </div>`;
    }
}
init();
