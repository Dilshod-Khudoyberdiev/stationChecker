// /assets/js/api.js
import { auth } from "./auth.js";

/* ─── service base-URLs ──────────────────────────────────────────── */
export const SERVICES = {
    auth: "http://localhost:5198",
    users: "http://localhost:5010",
    events: "http://localhost:5278",
    logging: "http://localhost:5084",
    notify: "http://localhost:5245",
};

/* ─── thin fetch wrapper ─────────────────────────────────────────── */
async function request(
    svc,
    path,
    {
        method = "GET",
        body = undefined,
        /* accept *both* spellings for backwards-compatibility */
        auth: useAuth = true,
        useAuth: compat,
        isForm = false,
    } = {}
) {
    if (compat !== undefined) useAuth = compat;   // legacy flag

    /* auto-prefix Event-service paths with /api */
    if (svc === "events" && !path.startsWith("/api/")) {
        path = `/api${path}`;
    }

    const headers = {};
    if (body && !isForm) headers["Content-Type"] = "application/json";

    if (useAuth) {
        const token = auth.get();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${SERVICES[svc]}${path}`, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
        credentials: "include",
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API-Error ${res.status}: ${txt || res.statusText}`);
    }

    if (res.status === 204) return null;
    const ct = res.headers.get("Content-Type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
}

/* ─── grouped helpers ────────────────────────────────────────────── */
export const api = {
    /* legacy short-hands (filled just below) */
    get: null,
    post: null,
    put: null,
    delete: null,
    upload: null,

    auth: {
        me: () => request("auth", "/api/users/me"),
        login: creds => request("auth", "/api/auth/login",
            { method: "POST", body: creds, auth: false }),
        register: data => request("auth", "/api/auth/register",
            { method: "POST", body: data, auth: false }),
        updateMe: payload => request("auth", "/api/users/me",
            { method: "PUT", body: payload }),
    },

    users: {
        getAll: () => request("users", "/api/users"),
    },

    events: {
        get: (p, a = true) => request("events", p, { auth: a }),
        post: (p, b, a = true) => request("events", p,
            { method: "POST", body: b, auth: a }),
        put: (p, b, a = true) => request("events", p,
            { method: "PUT", body: b, auth: a }),
        delete: (p, a = true) => request("events", p,
            { method: "DELETE", auth: a }),
        upload: (p, f, a = true) => request("events", p,
            { method: "POST", body: f, isForm: true, auth: a }),

        getComments: id => request("events", `/events/${id}/comments`, { auth: false }),
        postComment: (id, b) =>
            request("events", `/events/${id}/comments`,
                { method: "POST", body: b }),
    },
};

/* ── wire up legacy short-hands on the named export ──────────────── */
api.get = (path, a = true) => api.events.get(path, a);
api.post = (path, b, a = true) => api.events.post(path, b, a);
api.put = (path, b, a = true) => api.events.put(path, b, a);
api.delete = (path, a = true) => api.events.delete(path, a);
api.upload = (path, file, a = true) => api.events.upload(path, file, a);

/* ─── default export (request + all helpers) ─────────────────────── */
const legacy = Object.assign(request, api);   // merges everything
export default legacy;
