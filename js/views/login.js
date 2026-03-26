import { t } from '../services/translations.js?v=34';

export function renderLogin(container) {
    container.innerHTML = `
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center;">
            <div class="card" style="width: 100%; max-width: 420px; padding: 2.5rem;">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 4rem; height: 4rem; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);">
                        <i data-lucide="lock" style="width: 1.75rem; height: 1.75rem; color: white;"></i>
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 600;">${t('login.welcome')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">${t('login.subtitle')}</p>
                </div>

                <div id="login-error" style="display: none; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: 1.25rem;">
                    ${t('login.error')}
                </div>

                <div class="form-group">
                    <label class="form-label">${t('login.email_placeholder')}</label>
                    <input type="text" id="login-username" class="form-input" placeholder="pl. admin" autocomplete="username" autofocus>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('login.password_placeholder')}</label>
                    <div style="position: relative;">
                        <input type="password" id="login-password" class="form-input" placeholder="••••••••" autocomplete="current-password" style="padding-right: 3rem;">
                        <button id="toggle-pw" class="btn-icon" style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">
                            <i data-lucide="eye" id="eye-icon" style="width: 1.25rem; height: 1.25rem;"></i>
                        </button>
                    </div>
                </div>

                <button class="btn btn-primary" id="btn-login" style="width: 100%; padding: 0.75rem; font-size: 1rem; margin-top: 0.5rem;">
                    ${t('login.submit')}
                </button>
            </div>
        </div>
    `;

    lucide.createIcons();

    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    const errorEl    = document.getElementById('login-error');
    const togglePWBtn = document.getElementById('toggle-pw');

    // Toggle password visibility
    togglePWBtn.addEventListener('click', () => {
        const isPassword = passwordEl.type === 'password';
        passwordEl.type = isPassword ? 'text' : 'password';
        document.getElementById('eye-icon').setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        lucide.createIcons();
    });

    // Submit on Enter
    passwordEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptLogin(); });
    usernameEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptLogin(); });

    document.getElementById('btn-login').addEventListener('click', attemptLogin);

    async function attemptLogin() {
        const btn = document.getElementById('btn-login');
        let username = usernameEl.value.trim();
        const password = passwordEl.value;
        
        if (!username || !password) return;

        // Auto-append default domain if only username is provided
        if (!username.includes('@')) {
            username += '@hr-app.com';
        }

        btn.disabled = true;
        btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> ${t('login.submit')}...`;
        errorEl.style.display = 'none';

        try {
            await window.appAuth.login(username, password);
            window.navigateTo('dashboard');
        } catch (err) {
            console.error("Login hiba:", err);
            errorEl.style.display = 'block';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                errorEl.innerText = t('login.error');
            } else {
                errorEl.innerText = t('login.error') + ": " + err.message;
            }
            passwordEl.value = '';
            passwordEl.focus();
        } finally {
            btn.disabled = false;
            btn.innerText = t('login.submit');
        }
    }
}
