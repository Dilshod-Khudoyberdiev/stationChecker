/**
 * Creates a formatted Bootstrap 5 badge for a given status.
 * @param {string} status - The status string (e.g., 'Offen', 'In Bearbeitung').
 * @returns {string} HTML string for the badge.
 */
export function createStatusBadge(status) {
    const statusMap = {
        'Offen': 'offen',
        'In Bearbeitung': 'in-bearbeitung',
        'Gelöst': 'gelöst',
        'Duplikat': 'duplikat',
    };
    const statusClass = statusMap[status] || 'duplikat';
    return `<span class="badge rounded-pill fs-9 fw-semibold status-${statusClass}">${status}</span>`;
}

/**
 * Formats a date string into a user-friendly format.
 * @param {string} dateString - ISO date string.
 * @returns {string} Formatted date (e.g., '17.06.2025').
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
export function nl2br(txt) {
    return txt.replace(/\n/g, "<br>");
}
