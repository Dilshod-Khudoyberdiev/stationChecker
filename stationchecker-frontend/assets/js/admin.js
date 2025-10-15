// /assets/js/admin.js
import { api } from "./api.js";
import { auth } from "./auth.js";
import {
    createStatusBadge,
    formatDate,
    debounce
} from "./utils.js";
import { showEvent } from "./details.js";

/* ─── guard ────────────────────────────────────────────────────────── */
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const payload = auth.payload() || {};
if (!payload || (payload[ROLE_CLAIM] ?? payload.role) !== "Admin") {
    location.replace("login.html?next=admin-dashboard.html");
    throw "redirect-non-admin";
}

/* ─── greeting & logout ───────────────────────────────────────────── */
const fullName = payload.fullName ?? payload.name ?? "";
const greetSm = document.getElementById("welcome-msg-sm");
if (greetSm) greetSm.textContent = fullName;

document.querySelectorAll("#logout").forEach(btn => {
    btn.addEventListener("click", () => {
        auth.remove();
        location.href = "../../index.html";
    });
});

/* ─── DOM refs ────────────────────────────────────────────────────── */
const tbody = document.getElementById("events-body");
const fQ = document.getElementById("f-q-adm");
const fSta = document.getElementById("f-sta-adm");
const fStat = document.getElementById("f-st-adm");

const statOpen = document.getElementById("stat-open");
const statProg = document.getElementById("stat-progress");
const statSolved = document.getElementById("stat-solved");
const statDup = document.getElementById("stat-dup");

/* ─── cache + filters ─────────────────────────────────────────────── */
let cache = [];
[fQ, fSta, fStat].forEach(el => el.addEventListener("input", debounce(render, 250)));

/* ─── helpers ─────────────────────────────────────────────────────── */
function isValidEmail(e) { return typeof e === "string" && e.trim().includes("@"); }
function buildRow(e) {
    const tr = document.createElement("tr");
    tr.dataset.id = e.id;
    const reporter = isValidEmail(e.reporterEmail)
        ? e.reporterEmail
        : "<span class='text-muted'>Anonym</span>";

    tr.innerHTML = `
        <td class="p-3 fw-bold">#${e.id}</td>
        <td class="p-3">${e.titel}</td>
        <td class="p-3">${e.bahnhof}</td>
        <td class="p-3">${reporter}</td>
        <td class="p-3">${formatDate(e.createdAt)}</td>
        <td class="p-3 status-cell">${createStatusBadge(e.status)}</td>`;
    return tr;
}
function render() {
    const q = fQ.value.toLowerCase();
    const sta = fSta.value;
    const stat = fStat.value;

    const list = cache.filter(e =>
        (!sta || e.bahnhof === sta) &&
        (!stat || e.status === stat) &&
        (!q || e.titel.toLowerCase().includes(q) ||
            e.beschreibung?.toLowerCase().includes(q))
    );

    tbody.innerHTML = list.length
        ? list.map(buildRow).map(r => r.outerHTML).join("")
        : `<tr><td colspan="6" class="text-center p-4 text-muted">
               Keine Meldungen gefunden.
           </td></tr>`;

    const c = s => list.filter(x => x.status === s).length;
    statOpen.textContent = c("Offen");
    statProg.textContent = c("In Bearbeitung");
    statSolved.textContent = c("Gelöst");
    statDup.textContent = c("Duplikat");
}

/* ─── initial load ───────────────────────────────────────────────── */
async function load() {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">
                           <div class="spinner-border text-primary"></div>
                       </td></tr>`;
    try {
        cache = await api.events.get("/events");
        cache.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const opts = [...new Set(cache.map(e => e.bahnhof))].sort();
        fSta.innerHTML =
            `<option value="">Bahnhof (alle)</option>` +
            opts.map(o => `<option>${o}</option>`).join("");

        render();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">
                               Fehler: ${err.message}
                           </td></tr>`;
    }
}
load();

/* ─── interactions & live updates ─────────────────────────────────── */
tbody.addEventListener("click", ev => {
    const row = ev.target.closest("tr[data-id]");
    if (row) showEvent(row.dataset.id);
});
document.addEventListener("sc:statusChanged", ({ detail }) => {
    const row = tbody.querySelector(`tr[data-id="${detail.id}"]`);
    if (row) row.querySelector(".status-cell").innerHTML = createStatusBadge(detail.status);
    render();
});
document.addEventListener("sc:deleted", ({ detail }) => {
    const row = tbody.querySelector(`tr[data-id="${detail.id}"]`);
    if (row) row.remove();
    cache = cache.filter(e => e.id !== detail.id);
    render();
});
