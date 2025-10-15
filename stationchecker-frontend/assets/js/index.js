// assets/js/index.js
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.navbar-nav');

    if (auth.loggedIn()) {
        nav.innerHTML = `
            <a class="btn btn-outline-primary me-lg-2 mb-2 mb-lg-0" href="assets/html/resident-dashboard.html">
                Mein&nbsp;Dashboard
            </a>
            <button class="btn btn-outline-secondary" id="logout">
                <i class="bi-box-arrow-right"></i>
            </button>
        `;
        nav.querySelector('#logout').addEventListener('click', () => {
            auth.remove();
            location.reload();
        });
    }

    const reportBtn = document.getElementById('report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', (e) => {
            if (!auth.loggedIn()) {
                e.preventDefault();
                location.href = 'assets/html/login.html?next=report.html';
            }
        });
    }
});
