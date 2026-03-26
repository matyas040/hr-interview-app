import { t, getLang, setLang } from './services/translations.js?v=37';
import { Store } from './store.js?v=37';
import { renderLogin } from './views/login.js?v=37';
import { renderDashboard } from './views/dashboard.js?v=37';
import { renderRoleManager } from './views/roleManager.js?v=37';
import { renderInterviewSetup } from './views/interviewSetup.js?v=37';
import { renderActiveInterview } from './views/activeInterview.js?v=37';
import { renderCandidateInterview } from './views/candidateInterview.js?v=37';
import { renderEvaluation } from './views/evaluation.js?v=37';
import { renderAdminPanel } from './views/adminPanel.js?v=37';
import { renderExitInterview } from './views/exitInterview.js?v=37';
import { renderHrStats } from './views/hrStats.js?v=37';

// Firebase Auth Bridge
class Auth {
    constructor(store) {
        this.store = store;
        this.currentUser = null;
        this.initialized = false;
        this.onReadyCallbacks = [];

        // Listen for Firebase Auth changes
        this.store.onAuthChange((fbUser) => {
            if (fbUser) {
                // Try matching by full email, or just the username prefix (e.g. "admin" from "admin@hr-app.com")
                const emailPrefix = fbUser.email.split('@')[0];
                const storedUser = this.store.users.find(u =>
                    u.username === fbUser.email || u.username === emailPrefix
                );
                this.currentUser = storedUser || {
                    id: fbUser.uid,
                    username: fbUser.email,
                    displayName: emailPrefix,
                    role: 'admin'
                };
            } else {
                this.currentUser = null;
            }
            this.initialized = true;
            this.onReadyCallbacks.forEach(cb => cb(this.currentUser));
            this.onReadyCallbacks = [];
        });
    }

    async onReady() {
        if (this.initialized) return this.currentUser;
        return new Promise(resolve => this.onReadyCallbacks.push(resolve));
    }

    isLoggedIn() { return !!this.currentUser; }
    getUser() { return this.currentUser; }
    async login(email, password) { return this.store.login(email, password); }
    async logout() { await this.store.logout(); location.reload(); }

    // Re-resolve the user from Firestore after store.init() loads
    refreshFromStore() {
        if (!this.currentUser) return;
        const emailPrefix = (this.currentUser.username || '').split('@')[0];
        const storedUser = this.store.users.find(u =>
            u.username === this.currentUser.username || u.username === emailPrefix
        );
        if (storedUser) {
            this.currentUser = { ...storedUser };
        }
        // Ensure role and displayName are always set
        if (!this.currentUser.role) this.currentUser.role = 'admin';
        if (!this.currentUser.displayName) this.currentUser.displayName = emailPrefix || 'HR';
    }
}

class App {
    constructor() {
        this.store = new Store();
        this.auth = new Auth(this.store);
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
                <div style="color: var(--text-secondary); font-weight: 500;">${t('app.syncing')}</div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            await this.store.init();
            // Wait for Firebase Auth to resolve before checking login
            await this.auth.onReady();
            // Now that Firestore is loaded, sync auth user with Firestore profile
            this.auth.refreshFromStore();
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

        // ⚠️ Check for public routes BEFORE waiting for auth
        // so a logged-in HR user can also open & refresh candidate links
        const urlParams = new URLSearchParams(window.location.search);
        const isCandidate = urlParams.has('candidate');
        const isExit = urlParams.has('exit');

        if (isCandidate) {
            const roleId        = urlParams.get('role');
            const candidateName = urlParams.get('name') || 'Jelölt';
            const issuedBy      = urlParams.get('issuedBy') || '';
            const issuedByName  = urlParams.get('issuedByName') || '';
            const header = document.querySelector('.app-header');
            if (header) header.style.display = 'none';
            this.navigate('candidateInterview', { roleId, candidateName, issuedBy, issuedByName });
            return;
        }

        if (isExit) {
            const employeeName = urlParams.get('name') || '';
            const issuedBy     = urlParams.get('issuedBy') || '';
            const issuedByName = urlParams.get('issuedByName') || '';
            const header = document.querySelector('.app-header');
            if (header) header.style.display = 'none';
            this.navigate('exitInterview', { employeeName, issuedBy, issuedByName });
            return;
        }

        // Wait for Firebase Auth to resolve before checking login
        await this.auth.onReady();

        this.updateHeader();

        // Guard: require login for all other routes
        if (!window.appAuth.isLoggedIn()) {
            this.navigate('login');
        } else {
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
        window.appAuth    = this.auth;
    }

    updateHeader() {
        const user = window.appAuth.getUser();
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const displayName = user ? (user.displayName || user.username || 'HR') : '';
        const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : '';
        const role = user ? (user.role || 'admin') : '';

        headerActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                ${user ? `
                    ${role === 'admin' ? `
                        <button class="btn btn-secondary" id="btn-stats" style="font-size: 0.8rem; padding: 0.4rem 1rem;">
                            <i data-lucide="bar-chart-2" style="width: 0.875rem;"></i> ${t('stats.title')}
                        </button>
                        <button class="btn btn-secondary" id="btn-admin" style="font-size: 0.8rem; padding: 0.4rem 1rem;">
                            <i data-lucide="shield" style="width: 0.875rem;"></i> ${t('role.admin')}
                        </button>
                    ` : ''}
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 2rem; height: 2rem; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; color: white;">${displayInitial}</div>
                        <div style="font-size: 0.875rem;">
                            <div style="font-weight: 500;">${displayName}</div>
                            <div style="color: var(--text-secondary); font-size: 0.75rem;">${role === 'admin' ? t('role.admin') : t('role.hr')}</div>
                        </div>
                    </div>
                ` : ''}
                <button id="lang-toggle" class="btn-icon" title="${t('lang.toggle')}">
                    <span style="font-size: 0.75rem; font-weight: 600;">${getLang().toUpperCase()}</span>
                </button>
                ${user ? `
                    <button id="btn-logout" class="btn-icon" title="${t('auth.logout')}">
                        <i data-lucide="log-out" style="width: 1.25rem; height: 1.25rem;"></i>
                    </button>
                ` : ''}
                <button id="theme-toggle" class="btn-icon" aria-label="${t('theme.toggle')}">
                    <i data-lucide="sun" class="icon-light"></i>
                    <i data-lucide="moon" class="icon-dark"></i>
                </button>
            </div>
        `;
        lucide.createIcons();

        // Attach listeners
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.addEventListener('click', () => {
                const current = getLang();
                const next = current === 'hu' ? 'en' : 'hu';
                setLang(next);
                location.reload();
            });
        }

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const root = document.documentElement;
                const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('hr_theme', newTheme);
            });
        }

        if (user) {
            document.getElementById('btn-logout')?.addEventListener('click', () => {
                window.appAuth.logout();
            });
            document.getElementById('btn-admin')?.addEventListener('click', () => {
                this.navigate('adminPanel');
            });
            document.getElementById('btn-stats')?.addEventListener('click', () => {
                this.navigate('hrStats');
            });
        }
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
