import { Store } from './store.js?v=10';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderRoleManager } from './views/roleManager.js';
import { renderInterviewSetup } from './views/interviewSetup.js';
import { renderActiveInterview } from './views/activeInterview.js';
import { renderCandidateInterview } from './views/candidateInterview.js';
import { renderEvaluation } from './views/evaluation.js';
import { renderAdminPanel } from './views/adminPanel.js';
import { renderExitInterview } from './views/exitInterview.js';
import { renderHrStats } from './views/hrStats.js';

// Simple Auth Session Manager (sessionStorage for browser-tab scope)
class Auth {
    getCurrentUser() {
        const raw = sessionStorage.getItem('hr_current_user');
        return raw ? JSON.parse(raw) : null;
    }
    setCurrentUser(user) {
        sessionStorage.setItem('hr_current_user', JSON.stringify(user));
    }
    logout() {
        sessionStorage.removeItem('hr_current_user');
    }
    isLoggedIn() {
        return !!this.getCurrentUser();
    }
}

class App {
    constructor() {
        this.store = new Store();
        this.container = document.getElementById('app-container');
        this.initTheme();
        this.setupGlobals();
        // Defer routing to a separate method so we can await store.init()
    }

    async start() {
        // Show universal loading state while Firebase connects
        this.container.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
                <div style="width: 2rem; height: 2rem; border: 3px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <div style="color: var(--text-secondary); font-weight: 500;">Adatbázis szinkronizálása...</div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            await this.store.init();
        } catch (err) {
            console.error(err);
            this.container.innerHTML = `
                <div style="padding:2rem; text-align:center; max-width: 500px; margin: 0 auto;">
                    <div style="color:var(--danger); font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Hiba az adatbázis szinkronizálásakor</div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem; text-align: left; font-size: 0.875rem; margin-bottom: 1.5rem;">
                        <code>${err.message}</code>
                    </div>
                    <div style="text-align: left; font-size: 0.9rem; line-height: 1.5;">
                        <p>Valószínűleg a Firebase beállításoknál maradt le valami. Kérlek ellenőrizd ezeket:</p>
                        <ul style="padding-left: 1.5rem; margin-top: 0.5rem;">
                            <li>Létrehoztad a <b>Firestore Database</b>-t a Firebase konzolon?</li>
                            <li>Beállítottad a szabályokat (Rules) <b>Test mode</b>-ra (allow read, write: if true)?</li>
                            <li>Kiválasztottad a szerver helyét (Location)?</li>
                        </ul>
                    </div>
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 2rem;">🔄 Újrapróbálás</button>
                </div>
            `;
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('candidate')) {
            const roleId       = urlParams.get('role');
            const candidateName = urlParams.get('name') || 'Jelölt';
            const issuedBy     = urlParams.get('issuedBy') || '';
            const issuedByName = urlParams.get('issuedByName') || '';
            const header = document.querySelector('.app-header');
            if (header) header.style.display = 'none';
            this.navigate('candidateInterview', { roleId, candidateName, issuedBy, issuedByName });
            return;
        }

        if (urlParams.has('exit')) {
            const employeeName = urlParams.get('name') || '';
            const issuedBy     = urlParams.get('issuedBy') || '';
            const issuedByName = urlParams.get('issuedByName') || '';
            const header = document.querySelector('.app-header');
            if (header) header.style.display = 'none';
            this.navigate('exitInterview', { employeeName, issuedBy, issuedByName });
            return;
        }

        // Guard: require login
        if (!window.appAuth.isLoggedIn()) {
            this.navigate('login');
        } else {
            this.updateHeader();
            this.navigate('dashboard');
        }
    }

    initTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        const savedTheme = localStorage.getItem('hr_theme');
        if (savedTheme) {
            root.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }

        toggleBtn.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('hr_theme', newTheme);
        });
    }

    setupGlobals() {
        window.navigateTo = this.navigate.bind(this);
        window.appStore   = this.store;
        window.appAuth    = new Auth();
    }

    updateHeader() {
        const user = window.appAuth.getCurrentUser();
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions || !user) return;

        headerActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                ${user.role === 'admin' ? `
                    <button class="btn btn-secondary" id="btn-stats" style="font-size: 0.8rem; padding: 0.4rem 1rem;">
                        <i data-lucide="bar-chart-2" style="width: 0.875rem;"></i> Statisztika
                    </button>
                    <button class="btn btn-secondary" id="btn-admin" style="font-size: 0.8rem; padding: 0.4rem 1rem;">
                        <i data-lucide="shield" style="width: 0.875rem;"></i> Admin
                    </button>
                ` : ''}
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2rem; height: 2rem; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; color: white;">${user.displayName.charAt(0)}</div>
                    <div style="font-size: 0.875rem;">
                        <div style="font-weight: 500;">${user.displayName}</div>
                        <div style="color: var(--text-secondary); font-size: 0.75rem;">${user.role === 'admin' ? 'Admin' : 'HR Kolléga'}</div>
                    </div>
                </div>
                <button id="btn-logout" class="btn-icon" title="Kijelentkezés">
                    <i data-lucide="log-out" style="width: 1.25rem; height: 1.25rem;"></i>
                </button>
                <button id="theme-toggle" class="btn-icon" aria-label="Téma váltása">
                    <i data-lucide="sun" class="icon-light"></i>
                    <i data-lucide="moon" class="icon-dark"></i>
                </button>
            </div>
        `;
        lucide.createIcons();

        // Re-attach theme toggle (since updateHeader replaced the DOM node)
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const root = document.documentElement;
                const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('hr_theme', newTheme);
            });
        }

        document.getElementById('btn-logout')?.addEventListener('click', () => {
            window.appAuth.logout();
            // Reset header to default
            headerActions.innerHTML = `
                <button id="theme-toggle" class="btn-icon" aria-label="Téma váltása">
                    <i data-lucide="sun" class="icon-light"></i>
                    <i data-lucide="moon" class="icon-dark"></i>
                </button>
            `;
            // Re-attach theme toggle
            document.getElementById('theme-toggle').addEventListener('click', () => {
                const root = document.documentElement;
                const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('hr_theme', newTheme);
            });
            lucide.createIcons();
            this.navigate('login');
        });

        document.getElementById('btn-admin')?.addEventListener('click', () => {
            this.navigate('adminPanel');
        });
        document.getElementById('btn-stats')?.addEventListener('click', () => {
            this.navigate('hrStats');
        });
    }

    navigate(viewName, params = {}) {
        // Auth guard for all protected routes
        const publicRoutes = ['login', 'candidateInterview', 'exitInterview'];
        if (!publicRoutes.includes(viewName) && !window.appAuth.isLoggedIn()) {
            viewName = 'login';
        }

        this.container.innerHTML = '';
        window.scrollTo(0, 0);

        switch (viewName) {
            case 'login':
                renderLogin(this.container);
                break;
            case 'dashboard':
                this.updateHeader();
                renderDashboard(this.container);
                break;
            case 'roleManager':
                this.updateHeader();
                renderRoleManager(this.container, params);
                break;
            case 'interviewSetup':
                this.updateHeader();
                renderInterviewSetup(this.container, params);
                break;
            case 'activeInterview':
                this.updateHeader();
                renderActiveInterview(this.container, params);
                break;
            case 'candidateInterview':
                renderCandidateInterview(this.container, params);
                break;
            case 'evaluation':
                this.updateHeader();
                renderEvaluation(this.container, params);
                break;
            case 'adminPanel':
                this.updateHeader();
                renderAdminPanel(this.container);
                break;
            case 'exitInterview':
                renderExitInterview(this.container, params);
                break;
            case 'hrStats':
                this.updateHeader();
                renderHrStats(this.container);
                break;
            default:
                renderDashboard(this.container);
        }
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    lucide.createIcons();
    window.app.start();
});
