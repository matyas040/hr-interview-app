import { t, getLang } from '../services/translations.js?v=37';

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
        const exitQs = window.appStore.getExitQuestions();

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
                </div>
            </div>

            <!-- Users Management -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h3 style="font-size: 1.125rem; font-weight: 600;">${getLang() === 'hu' ? 'Felhasználók kezelése' : 'User Management'}</h3>
                    <button class="btn btn-primary" id="btn-add-user">
                        <i data-lucide="user-plus"></i> ${t('admin.add_user')}
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 120px 140px; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">
                        <span>${t('admin.table.user')}</span>
                        <span>${t('admin.table.pass')}</span>
                        <span>${t('admin.table.role')}</span>
                        <span style="text-align: right;">${t('admin.table.actions')}</span>
                    </div>

                    ${users.map(u => `
                        <div style="display: grid; grid-template-columns: 1fr 1fr 120px 140px; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color);">
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
                                ${u.id !== 'u_admin' ? `
                                    <button class="btn btn-danger btn-del-user" data-uid="${u.id}" style="padding: 0.375rem 0.75rem; font-size: 0.8rem;">
                                        <i data-lucide="trash-2" style="width: 0.9rem; height: 0.9rem;"></i>
                                    </button>
                                ` : `
                                    <button class="btn btn-secondary" disabled style="padding: 0.375rem 0.75rem; font-size: 0.8rem; opacity: 0.3;">
                                        <i data-lucide="shield" style="width: 0.9rem; height: 0.9rem;"></i>
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Exit Interview Questions -->
            <div class="card mt-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 style="font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="help-circle" style="width: 1.125rem; color: var(--accent);"></i> ${getLang() === 'hu' ? 'Kilépő interjú kérdések' : 'Exit Interview Questions'}
                    </h3>
                    <button class="btn btn-secondary" id="btn-add-exit-q" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">
                        <i data-lucide="plus"></i> ${getLang() === 'hu' ? 'Kérdés hozzáadása' : 'Add Question'}
                    </button>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${exitQs.map(q => `
                        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);">
                            <div style="width: 24px; font-weight: 800; color: var(--text-secondary); opacity: 0.5;">${q.order || ''}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 0.9rem;">${q.text}</div>
                                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">
                                    Típus: ${q.type} ${q.options ? `(${q.options})` : ''}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.4rem;">
                                <button class="btn-icon-admin btn-edit-exit-q" data-id="${q.id}">
                                    <i data-lucide="pencil" style="width: 14px;"></i>
                                </button>
                                <button class="btn-icon-admin btn-del-exit-q" data-id="${q.id}">
                                    <i data-lucide="trash-2" style="width: 14px; color: var(--danger);"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    ${exitQs.length === 0 ? `<p style="text-align:center; color:var(--text-secondary); padding: 1rem;">Nincsenek kérdések.</p>` : ''}
                </div>
            </div>

            <!-- Gemini AI Settings -->
            <div class="card mt-6">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="brain-circuit" style="width: 1.125rem; color: var(--accent);"></i> ${t('admin.ai_settings')}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">
                    ${t('admin.ai_subtitle')}
                    ${t('admin.ai_get_key')} <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--accent);">aistudio.google.com/apikey</a>.
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

            <!-- User Modal -->
            <div id="user-modal-overlay" class="adm-modal-overlay" style="display: none;">
                <div class="card modal-card">
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

            <!-- Exit Question Modal -->
            <div id="exq-modal-overlay" class="adm-modal-overlay" style="display: none;">
                <div class="card modal-card">
                    <h3 id="exq-modal-title" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">Kérdés</h3>
                    <div class="form-group">
                        <label class="form-label">Kérdés szövege</label>
                        <input type="text" id="exq-text" class="form-input" placeholder="pl. Hogy érezted magad?">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Típus</label>
                        <select id="exq-type" class="form-input">
                            <option value="text">Szöveg (textarea)</option>
                            <option value="select">Legördülő (select)</option>
                            <option value="radio">Választógomb (radio)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Opciók (vesszővel elválasztva)</label>
                        <input type="text" id="exq-options" class="form-input" placeholder="Igen,Nem,Talán">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sorrend</label>
                        <input type="number" id="exq-order" class="form-input" placeholder="1">
                    </div>
                    <div class="flex gap-2 justify-between mt-6">
                        <button class="btn btn-secondary" id="exq-modal-cancel">Mégse</button>
                        <button class="btn btn-primary" id="exq-modal-save">Mentés</button>
                    </div>
                </div>
            </div>

            <style>
                .adm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
                .modal-card { width: 100%; max-width: 440px; padding: 2rem; }
                .btn-icon-admin { background: white; border: 1px solid var(--border-color); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .btn-icon-admin:hover { border-color: var(--accent); background: var(--bg-primary); }
            </style>
        `;

        lucide.createIcons();
        attachEvents();
    };

    const attachEvents = () => {
        // User CRUD
        document.getElementById('btn-add-user')?.addEventListener('click', () => openUserModal());
        container.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => openUserModal(e.currentTarget.dataset.uid));
        });
        container.querySelectorAll('.btn-del-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uid = e.currentTarget.dataset.uid;
                if (confirm(t('admin.delete_user_confirm'))) {
                    window.appStore.deleteUser(uid);
                    render();
                }
            });
        });

        // Exit Q CRUD
        document.getElementById('btn-add-exit-q')?.addEventListener('click', () => openExqModal());
        container.querySelectorAll('.btn-edit-exit-q').forEach(btn => {
            btn.addEventListener('click', (e) => openExqModal(e.currentTarget.dataset.id));
        });
        container.querySelectorAll('.btn-del-exit-q').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Biztosan törlöd ezt a kérdést?')) {
                    window.appStore.deleteExitQuestion(e.currentTarget.dataset.id);
                    render();
                }
            });
        });

        // API Key
        document.getElementById('btn-save-api-key')?.addEventListener('click', () => {
            const key = document.getElementById('gemini-api-key-input').value.trim();
            localStorage.setItem('hr_gemini_api_key', key);
            document.getElementById('api-key-status').innerHTML = `<span style="color: var(--success);">✓ Mentve!</span>`;
        });
        document.getElementById('btn-test-api-key')?.addEventListener('click', async () => {
            const key = document.getElementById('gemini-api-key-input').value.trim();
            const st  = document.getElementById('api-key-status');
            if (!key) return;
            st.innerHTML = `<span>⏳ Tesztelés...</span>`;
            try {
                const { testApiKey } = await import('../services/aiService.js?v=61');
                await testApiKey(key);
                st.innerHTML = `<span style="color: var(--success);">✓ Sikeres teszt!</span>`;
            } catch(e) {
                st.innerHTML = `<span style="color: var(--danger);">✗ Hiba: ${e.message}</span>`;
            }
        });

        // User Modal Actions
        document.getElementById('modal-cancel')?.addEventListener('click', () => { document.getElementById('user-modal-overlay').style.display = 'none'; });
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const overlay = document.getElementById('user-modal-overlay');
            const displayName = document.getElementById('modal-displayName').value.trim();
            const username = document.getElementById('modal-username').value.trim().toLowerCase();
            const password = document.getElementById('modal-password').value;
            const role = document.getElementById('modal-role').value;
            const editId = overlay.dataset.editId;

            if (!displayName || !username) return;
            if (editId) {
                window.appStore.updateUser(editId, { displayName, username, role, password: password || undefined });
            } else {
                if (!password) return;
                window.appStore.addUser({ displayName, username, password, role });
            }
            overlay.style.display = 'none';
            render();
        });

        // Exit Q Modal Actions
        document.getElementById('exq-modal-cancel')?.addEventListener('click', () => { document.getElementById('exq-modal-overlay').style.display = 'none'; });
        document.getElementById('exq-modal-save')?.addEventListener('click', () => {
            const overlay = document.getElementById('exq-modal-overlay');
            const text = document.getElementById('exq-text').value.trim();
            const type = document.getElementById('exq-type').value;
            const options = document.getElementById('exq-options').value.trim();
            const order = parseInt(document.getElementById('exq-order').value) || 0;
            const editId = overlay.dataset.editId;

            if (!text) return;
            if (editId) {
                window.appStore.updateExitQuestion(editId, { text, type, options, order });
            } else {
                window.appStore.addExitQuestion(text, type, options, order);
            }
            overlay.style.display = 'none';
            render();
        });
    };

    const openUserModal = (userId = null) => {
        const overlay = document.getElementById('user-modal-overlay');
        overlay.style.display = 'flex';
        document.getElementById('modal-displayName').value = '';
        document.getElementById('modal-username').value = '';
        document.getElementById('modal-password').value = '';
        document.getElementById('modal-role').value = 'hr';

        if (userId) {
            const u = window.appStore.getUserById(userId);
            document.getElementById('modal-displayName').value = u.displayName;
            document.getElementById('modal-username').value = u.username;
            document.getElementById('modal-role').value = u.role;
            overlay.dataset.editId = userId;
        } else {
            delete overlay.dataset.editId;
        }
    };

    const openExqModal = (id = null) => {
        const overlay = document.getElementById('exq-modal-overlay');
        overlay.style.display = 'flex';
        document.getElementById('exq-text').value = '';
        document.getElementById('exq-type').value = 'text';
        document.getElementById('exq-options').value = '';
        document.getElementById('exq-order').value = '';

        if (id) {
            const q = window.appStore.getExitQuestions().find(x => x.id === id);
            document.getElementById('exq-text').value = q.text;
            document.getElementById('exq-type').value = q.type;
            document.getElementById('exq-options').value = q.options || '';
            document.getElementById('exq-order').value = q.order || '';
            overlay.dataset.editId = id;
        } else {
            delete overlay.dataset.editId;
        }
    };

    render();
}
