import { t } from '../services/translations.js?v=20';

export function renderAdminPanel(container) {
    const currentUser = window.appAuth.getUser();
    if (!currentUser || currentUser.role !== 'admin') {
        container.innerHTML = `<div class="card" style="max-width:500px; margin: 4rem auto; text-align: center; padding: 2rem;">
            <i data-lucide="shield-off" style="width: 3rem; height: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
            <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">${t('admin.access_denied')}</h2>
            <p style="color: var(--text-secondary);">${t('admin.access_denied_msg')}</p>
            <button class="btn btn-secondary mt-4" onclick="window.navigateTo('dashboard')">${t('common.back')}</button>
        </div>`;
        lucide.createIcons();
        return;
    }

    const render = () => {
        const users = window.appStore.getUsers();

        container.innerHTML = `
            <div class="mb-6">
                <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                    <i data-lucide="arrow-left"></i> ${t('role.back')}
                </button>
                <div class="flex justify-between items-center">
                    <div>
                        <h2 style="font-size: 1.5rem; font-weight: 600;">${t('admin.title')}</h2>
                        <p style="color: var(--text-secondary);" class="mt-1">${t('admin.subtitle')}</p>
                    </div>
                    <button class="btn btn-primary" id="btn-add-user">
                        <i data-lucide="user-plus"></i> ${t('admin.add_user')}
                    </button>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; flex-direction: column; gap: 0;">
                    <!-- Table header -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 120px 140px; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">
                        <span>${t('admin.table.user')}</span>
                        <span>${t('admin.table.pass')}</span>
                        <span>${t('admin.table.role')}</span>
                        <span style="text-align: right;">${t('admin.table.actions')}</span>
                    </div>

                    ${users.map(u => `
                        <div style="display: grid; grid-template-columns: 1fr 1fr 120px 140px; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color);" data-uid="${u.id}">
                            <div>
                                <div style="font-weight: 500;">${u.username}</div>
                                <div style="color: var(--text-secondary); font-size: 0.875rem;">${u.displayName}</div>
                            </div>
                            <div style="color: var(--text-secondary); font-family: monospace; font-size: 0.875rem; letter-spacing: 0.1em;">••••••••</div>
                            <div>
                                <span style="background: ${u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${u.role === 'admin' ? 'var(--accent)' : 'var(--success)'}; padding: 0.2rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600;">
                                    ${u.role === 'admin' ? 'Admin' : t('role.hr')}
                                </span>
                            </div>
                            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                                <button class="btn btn-secondary btn-edit-user" data-uid="${u.id}" style="padding: 0.375rem 0.75rem; font-size: 0.8rem;">
                                    <i data-lucide="pencil" style="width: 0.9rem; height: 0.9rem;"></i>
                                </button>
                                ${u.id !== 'u_admin' ? `<button class="btn btn-danger btn-del-user" data-uid="${u.id}" style="padding: 0.375rem 0.75rem; font-size: 0.8rem;">
                                    <i data-lucide="trash-2" style="width: 0.9rem; height: 0.9rem;"></i>
                                </button>` : `<button class="btn btn-secondary" disabled style="padding: 0.375rem 0.75rem; font-size: 0.8rem; opacity: 0.3;">
                                    <i data-lucide="shield" style="width: 0.9rem; height: 0.9rem;"></i>
                                </button>`}
                            </div>
                        </div>
                    `).join('')}

                    ${users.length === 0 ? `<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">${t('admin.no_users')}</p>` : ''}
                </div>
        </div>

        <!-- Gemini AI Settings -->
        <div class="card mt-6">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="brain-circuit" style="width: 1.125rem; color: var(--accent);"></i> ${t('admin.ai_settings')}
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">
                ${t('admin.ai_subtitle')}
                ${t('admin.ai_get_key')} <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--accent);">aistudio.google.com/apikey</a> (ingyenes).
            </p>
            <div style="display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap;">
                <input type="text" id="gemini-api-key-input" class="form-input" 
                    style="flex: 1; min-width: 280px; font-family: monospace; font-size: 0.85rem;"
                    placeholder="${t('admin.ai_key_placeholder')}" 
                    value="${localStorage.getItem('hr_gemini_api_key') || ''}">
                <button class="btn btn-primary" id="btn-save-api-key" style="white-space:nowrap;">
                    <i data-lucide="save"></i> ${t('role.save')}
                </button>
                <button class="btn btn-secondary" id="btn-test-api-key" style="white-space:nowrap;">
                    <i data-lucide="zap"></i> ${t('admin.ai_test')}
                </button>
            </div>
            <div id="api-key-status" style="margin-top: 0.75rem; font-size: 0.875rem;"></div>
        </div>

        <!-- Modal Overlay -->
            <div id="user-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: none; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px);">
                <div class="card" style="width: 100%; max-width: 440px; padding: 2rem; z-index: 201;" id="user-modal">
                    <h3 id="modal-title" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">${t('admin.add_user')}</h3>
                    <div class="form-group">
                        <label class="form-label">${t('admin.modal.name')}</label>
                        <input type="text" id="modal-displayName" class="form-input" placeholder="pl. Kovács Anna">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('admin.modal.username')}</label>
                        <input type="text" id="modal-username" class="form-input" placeholder="pl. kovacs.anna">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('admin.modal.pass')} <span id="pw-hint" style="font-weight: 400; color: var(--text-secondary);">${t('admin.modal.pass_hint')}</span></label>
                        <input type="text" id="modal-password" class="form-input" placeholder="${t('admin.modal.pass_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('admin.modal.role')}</label>
                        <select id="modal-role" class="form-input">
                            <option value="hr">${t('role.hr')}</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="flex gap-2 justify-between mt-6">
                        <button class="btn btn-secondary" id="modal-cancel">${t('admin.modal.cancel')}</button>
                        <button class="btn btn-primary" id="modal-save">${t('admin.modal.save')}</button>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
        attachEvents();
    };

    const openModal = (userId = null) => {
        const overlay = document.getElementById('user-modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const pwHint  = document.getElementById('pw-hint');

        overlay.style.display = 'flex';
        document.getElementById('modal-displayName').value = '';
        document.getElementById('modal-username').value = '';
        document.getElementById('modal-password').value = '';
        document.getElementById('modal-role').value = 'hr';

        if (userId) {
            const u = window.appStore.getUserById(userId);
            titleEl.textContent = t('admin.modal.title_edit');
            pwHint.style.display = 'inline';
            document.getElementById('modal-displayName').value = u.displayName;
            document.getElementById('modal-username').value = u.username;
            document.getElementById('modal-role').value = u.role;
            overlay.dataset.editId = userId;
        } else {
            titleEl.textContent = t('admin.modal.title_new');
            pwHint.style.display = 'none';
            delete overlay.dataset.editId;
        }
    };

    const closeModal = () => {
        document.getElementById('user-modal-overlay').style.display = 'none';
    };

    const attachEvents = () => {
        document.getElementById('btn-add-user')?.addEventListener('click', () => openModal());

        // Gemini API key
        document.getElementById('btn-save-api-key')?.addEventListener('click', () => {
            const key = document.getElementById('gemini-api-key-input').value.trim();
            localStorage.setItem('hr_gemini_api_key', key);
            const st = document.getElementById('api-key-status');
            st.innerHTML = key
                ? `<span style="color: var(--success);">✓ ${t('admin.ai_save_success')}</span>`
                : `<span style="color: var(--warning);">${t('admin.ai_delete_success')}</span>`;
        });

        document.getElementById('btn-test-api-key')?.addEventListener('click', async () => {
            const key = document.getElementById('gemini-api-key-input').value.trim();
            const st  = document.getElementById('api-key-status');
            if (!key) { st.innerHTML = `<span style="color: var(--danger);">⚠ ${t('admin.ai_input_error')}</span>`; return; }
            st.innerHTML = `<span style="color: var(--text-secondary);">⏳ ${t('admin.ai_testing')}</span>`;
            try {
                const { testApiKey } = await import('../services/aiService.js');
                await testApiKey(key);
                st.innerHTML = `<span style="color: var(--success);">✓ ${t('admin.ai_test_success')}</span>`;
            } catch(e) {
                st.innerHTML = `<span style="color: var(--danger);">✗ ${t('admin.ai_test_error')} ${e.message}</span>`;
            }
        });

        container.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.uid));
        });

        container.querySelectorAll('.btn-del-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uid = e.currentTarget.dataset.uid;
                const u = window.appStore.getUserById(uid);
                if (confirm(`${t('admin.delete_user_confirm')} (${u.displayName})`)) {
                    window.appStore.deleteUser(uid);
                    render();
                }
            });
        });

        document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

        document.getElementById('modal-save')?.addEventListener('click', () => {
            const overlay    = document.getElementById('user-modal-overlay');
            const displayName = document.getElementById('modal-displayName').value.trim();
            const username   = document.getElementById('modal-username').value.trim().toLowerCase();
            const password   = document.getElementById('modal-password').value;
            const role       = document.getElementById('modal-role').value;
            const editId     = overlay.dataset.editId;

            if (!displayName || !username) {
                alert(t('admin.modal.error'));
                return;
            }

            if (editId) {
                window.appStore.updateUser(editId, { displayName, username, role, password: password || undefined });
            } else {
                if (!password) { alert(t('admin.modal.error_pass')); return; }
                window.appStore.addUser({ displayName, username, password, role });
            }
            closeModal();
            render();
        });

        // Close on overlay click
        document.getElementById('user-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('user-modal-overlay')) closeModal();
        });
    };

    render();
}
