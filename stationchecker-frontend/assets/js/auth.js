// --- JWT helper -------------------------------------------------------------
const JWT_KEY = "stationchecker_jwt";

/* quick sanity-check: has 3 dot-separated parts */
function looksLikeJwt(str) {
    return typeof str === "string" && str.split(".").length === 3;
}

export const auth = {
    /* Persist the JWT (only if valid) */
    save(token) {
        if (looksLikeJwt(token)) {
            localStorage.setItem(JWT_KEY, token);
        } else {
            console.warn("[auth] tried to save invalid JWT → ignored");
        }
    },

    /* Read a valid JWT or null */
    get() {
        const raw = localStorage.getItem(JWT_KEY);
        if (looksLikeJwt(raw)) return raw;
        localStorage.removeItem(JWT_KEY);
        return null;
    },

    /* Alias for get() */
    token() {
        return this.get();
    },

    /* Remove the JWT (logout) */
    remove() {
        localStorage.removeItem(JWT_KEY);
    },

    /* True if we have a valid JWT */
    loggedIn() {
        return !!this.get();
    },

    /* Decode payload or null */
    payload() {
        const t = this.get();
        if (!t) return null;
        try {
            return JSON.parse(atob(t.split(".")[1]));
        } catch {
            this.remove();
            return null;
        }
    }
};

/* Convenience wrappers */
export function getToken() { return auth.get(); }
export function clearAuthData() { auth.remove(); }

/* Optional global logout button */
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        auth.remove();
        window.location.href = "/assets/html/login.html";
    });
}
