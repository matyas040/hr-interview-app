import { t, getLang } from '../services/translations.js?v=26';
import { generateInterviewQuestions } from '../services/aiService.js?v=26';

export function renderRoleManager(container, params = {}) {
    const render = () => {
        const roles = window.appStore.getRoles();
        const activeRoleId = params.roleId || (roles.length > 0 ? roles[0].id : null);
        const activeRole = activeRoleId ? window.appStore.getRoleById(activeRoleId) : null;
        
        const isFullView = params.fullView === true;

        container.innerHTML = `
            <div class="simple-role-manager ${isFullView ? 'full-width' : ''}">
                <div class="flex justify-between items-center mb-8">
                    <div style="flex: 1; min-width: 0;">
                        <button class="btn-back mb-2" onclick="window.navigateTo('dashboard')">
                            <i data-lucide="arrow-left" style="width: 14px;"></i> ${t('role.back')}
                        </button>
                        <h2 class="page-title">${t('role.title')}</h2>
                    </div>
                    ${!isFullView ? `
                        <button class="btn btn-primary" id="btn-add-role">
                            <i data-lucide="plus"></i> ${t('role.add_new')}
                        </button>
                    ` : ''}
                </div>

                <div class="role-layout ${isFullView ? 'full' : 'split'}">
                    <!-- Sidebar: Roles (Hidden in Full View) -->
                    ${!isFullView ? `
                        <aside class="simple-sidebar">
                            <h3 class="sidebar-label">${t('role.list_title')}</h3>
                            <div class="role-scroller">
                                ${roles.map(r => `
                                    <div class="role-item-mini ${r.id === activeRoleId ? 'active' : ''}" data-id="${r.id}">
                                        <span class="title">${r.title}</span>
                                        <span class="count">${r.questions.length} questions</span>
                                    </div>
                                `).join('')}
                            </div>
                        </aside>
                    ` : ''}

                    <!-- Main: Editor -->
                    <main class="editor-area">
                        ${activeRole ? `
                            <div class="edit-card ${isFullView ? 'full-p' : ''}">
                                ${isFullView ? `
                                    <!-- FULL VIEW: Reordered Layout -->
                                    <header class="full-header mb-10">
                                        <div class="flex justify-between items-center w-full mb-6">
                                            <button class="btn-back-small" id="btn-exit-full">
                                                <i data-lucide="arrow-left"></i> ${getLang() === 'hu' ? 'Vissza az áttekintéshez' : 'Back to overview'}
                                            </button>
                                            <div class="flex items-center gap-2">
                                                <button class="btn btn-icon-del" id="btn-delete-role"><i data-lucide="trash-2"></i></button>
                                            </div>
                                        </div>
                                        <h3 class="full-role-title">${activeRole.title}</h3>
                                    </header>

                                    <!-- TOP: INPUT & AI -->
                                    <div class="full-top-controls mb-12">
                                        <div class="control-grid">
                                            <div class="control-box">
                                                <h4 class="control-label">${getLang() === 'hu' ? 'Új kérdés hozzáadása' : 'Add new question'}</h4>
                                                <div class="add-q-bar">
                                                    <input type="text" id="new-q-input" class="new-q-field" placeholder="${t('role.q_placeholder')}">
                                                    <button class="btn btn-primary" id="btn-add-q">
                                                        <i data-lucide="plus"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="control-box">
                                                <h4 class="control-label">${t('role.jd_title')} & AI</h4>
                                                ${activeRole.jdFileName ? `
                                                    <div class="flex gap-2">
                                                        <div class="jd-pill-mini">
                                                            <i data-lucide="file-text"></i>
                                                            <span>${activeRole.jdFileName}</span>
                                                            <button class="btn-pill-del" id="btn-remove-jd"><i data-lucide="x"></i></button>
                                                        </div>
                                                        <button class="btn btn-ai-action" id="btn-generate-qs">
                                                            <i data-lucide="sparkles"></i> ${t('role.jd_generate')}
                                                        </button>
                                                    </div>
                                                ` : `
                                                    <label class="simple-upload-mini">
                                                        <i data-lucide="upload"></i> ${getLang() === 'hu' ? 'Leírás feltöltése AI-hoz' : 'Upload JD for AI'}
                                                        <input type="file" accept=".pdf,.txt,.docx" id="jd-upload-input" hidden>
                                                    </label>
                                                `}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- BOTTOM: QUESTION LIST -->
                                    <section class="questions-full">
                                        <div class="flex items-center justify-between mb-6 border-b pb-4">
                                            <h4 class="section-title">${t('role.questions')}</h4>
                                            <span class="badge-count">${activeRole.questions.length}</span>
                                        </div>
                                        <div id="questions-list" class="q-stack-full">
                                            ${activeRole.questions.map((q, index) => `
                                                <div class="q-item-full">
                                                    <div class="q-lead">${index + 1}</div>
                                                    <div class="q-body-full">
                                                        <input type="text" class="q-input-full" data-qid="${q.id}" value="${q.text}">
                                                        <div class="q-actions">
                                                            <select class="q-type-select-mini" data-qid="${q.id}">
                                                                <option value="short" ${(q.answerType || 'detailed') === 'short' ? 'selected' : ''}>${getLang() === 'hu' ? 'Rövid' : 'Short'}</option>
                                                                <option value="detailed" ${(q.answerType || 'detailed') === 'detailed' ? 'selected' : ''}>${getLang() === 'hu' ? 'Részletes' : 'Detailed'}</option>
                                                            </select>
                                                            <button class="btn-q-del" data-qid="${q.id}"><i data-lucide="trash-2"></i></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </section>
                                ` : `
                                    <!-- MAIN VIEW: 3 Questions Summary -->
                                    <section class="editor-header mb-8">
                                        <div style="flex: 1; min-width: 0;">
                                            <input type="text" id="role-title-input" class="role-title-input" value="${activeRole.title}">
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button class="btn btn-success" id="btn-save-role">${t('role.save')}</button>
                                            <button class="btn-icon-del" id="btn-delete-role"><i data-lucide="trash-2"></i></button>
                                        </div>
                                    </section>

                                    <section class="summary-area mb-8">
                                        <h4 class="sidebar-label mb-4">${t('role.questions')} (3 legutóbbi)</h4>
                                        <div class="q-preview-list">
                                            ${activeRole.questions.length > 0 ? 
                                                activeRole.questions.slice(-3).reverse().map(q => `
                                                    <div class="q-preview-item">
                                                        <i data-lucide="help-circle"></i>
                                                        <p class="text">${q.text}</p>
                                                    </div>
                                                `).join('') 
                                                : `<div class="empty-state-small">${t('role.no_questions')}</div>`
                                            }
                                        </div>
                                        
                                        <div class="add-q-bar mt-6">
                                            <input type="text" id="new-q-input" class="new-q-field" placeholder="${t('role.q_placeholder')}">
                                            <button class="btn btn-primary" id="btn-add-q">
                                                <i data-lucide="plus"></i>
                                            </button>
                                        </div>
                                    </section>

                                    <button class="btn btn-secondary w-full" id="btn-open-full">
                                        <i data-lucide="maximize-2"></i> ${getLang() === 'hu' ? 'Teljes szerkesztés és AI generálás' : 'Full edit & AI generation'}
                                    </button>
                                `}
                            </div>
                        ` : `
                            <div class="empty-placeholder">
                                <i data-lucide="briefcase"></i>
                                <p>${t('role.select_role')}</p>
                            </div>
                        `}
                    </main>
                </div>
            </div>

            <style>
                .simple-role-manager { max-width: 1100px; margin: 0 auto; transition: all 0.3s ease; }
                .simple-role-manager.full-width { max-width: 100%; padding: 0 2rem; }
                
                .page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .role-layout { display: grid; gap: 3rem; align-items: flex-start; }
                .role-layout.split { grid-template-columns: 280px 1fr; }
                .role-layout.full { grid-template-columns: 1fr; }
                
                /* Sidebar */
                .sidebar-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); font-weight: 700; margin-bottom: 1rem; }
                .role-scroller { display: flex; flex-direction: column; gap: 0.5rem; }
                .role-item-mini { 
                    padding: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;
                    display: flex; flex-direction: column; border: 1px solid var(--border-color); background: white;
                }
                .role-item-mini:hover { border-color: var(--accent-soft); transform: translateY(-2px); }
                .role-item-mini.active { border-color: var(--accent); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
                .role-item-mini .title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
                .role-item-mini .count { font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.4rem; font-weight: 500; }
                .role-item-mini.active .title { color: var(--accent); }

                /* Editor Card */
                .edit-card { background: white; border-radius: 20px; border: 1px solid var(--border-color); padding: 2.5rem; box-shadow: 0 15px 40px rgba(0,0,0,0.03); }
                .edit-card.full-p { padding: 3rem; }
                
                .role-title-input { 
                    width: 100%; border: none; font-size: 1.8rem; font-weight: 800; color: var(--text-primary); 
                    outline: none; background: transparent; padding: 0.5rem 0; border-bottom: 2px solid transparent;
                }
                .role-title-input:focus { border-color: var(--accent-soft); }
                .full-role-title { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 1rem; }

                /* Overview Preview */
                .q-preview-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .q-preview-item { 
                    display: flex; gap: 0.75rem; padding: 1rem; background: var(--bg-primary); 
                    border-radius: 12px; border: 1px solid rgba(0,0,0,0.03); align-items: center;
                }
                .q-preview-item i { width: 16px; height: 16px; color: var(--accent); flex-shrink: 0; }
                .q-preview-item .text { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

                /* Full View Controls */
                .control-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .control-box { background: var(--bg-primary); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); }
                .control-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--text-secondary); margin-bottom: 1rem; letter-spacing: 0.05em; }

                /* Questions List Full */
                .q-stack-full { display: flex; flex-direction: column; gap: 1rem; }
                .q-item-full { display: flex; gap: 1rem; padding: 1.25rem; border-radius: 12px; background: white; border: 1px solid var(--border-color); transition: all 0.2s; }
                .q-item-full:hover { border-color: var(--accent-light); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .q-lead { width: 32px; height: 32px; border-radius: 10px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); flex-shrink: 0; }
                .q-body-full { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
                .q-input-full { width: 100%; border: none; font-size: 1rem; font-weight: 500; color: var(--text-primary); outline: none; background: transparent; }
                .q-actions { display: flex; items-center gap: 1.5rem; border-top: 1px solid rgba(0,0,0,0.03); pt-3; margin-top: 0.2rem; }
                .q-type-select-mini { background: transparent; border: none; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; }

                .add-q-bar { display: flex; gap: 0.75rem; padding: 0.5rem; background: white; border-radius: 12px; border: 1px solid var(--border-color); }
                .new-q-field { flex: 1; border: none; background: transparent; padding: 0.5rem; font-size: 0.9rem; outline: none; font-weight: 500; }

                .jd-pill-mini { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 8px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; }
                .btn-ai-action { background: var(--accent); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
                .btn-ai-action:hover { opacity: 0.9; }
                .simple-upload-mini { border: 1px dashed var(--accent); border-radius: 8px; padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem; color: var(--accent); font-size: 0.75rem; font-weight: 600; cursor: pointer; }

                .btn-icon-del { width: 42px; height: 42px; border-radius: 12px; border: none; background: rgba(239, 68, 68, 0.05); color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .btn-icon-del:hover { background: var(--danger); color: white; }

                .btn-back-small { background: rgba(0,0,0,0.03); border: none; color: var(--text-secondary); height: 32px; padding: 0 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
                .btn-back-small:hover { background: var(--accent-light); color: var(--accent); }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; display: inline-block; }
            </style>
        `;

        lucide.createIcons();
        attachEvents(activeRole, isFullView);
    };

    const attachEvents = (activeRole, isFullView) => {
        container.querySelectorAll('.role-item-mini').forEach(el => {
            el.addEventListener('click', (e) => {
                params.roleId = e.currentTarget.dataset.id;
                render();
            });
        });

        document.getElementById('btn-add-role')?.addEventListener('click', () => {
            const newRole = window.appStore.addRole(getLang() === 'hu' ? 'Új Munkakör' : 'New Role');
            params.roleId = newRole.id;
            params.fullView = false;
            render();
        });

        if (activeRole) {
            document.getElementById('btn-open-full')?.addEventListener('click', () => {
                params.fullView = true;
                render();
            });

            document.getElementById('btn-exit-full')?.addEventListener('click', () => {
                params.fullView = false;
                render();
            });

            document.getElementById('btn-save-role')?.addEventListener('click', () => {
                const title = document.getElementById('role-title-input').value.trim();
                if (title) { window.appStore.updateRole(activeRole.id, title); render(); }
            });

            document.getElementById('btn-delete-role')?.addEventListener('click', () => {
                if (confirm(t('role.delete_role_confirm'))) {
                    window.appStore.deleteRole(activeRole.id);
                    params.roleId = null;
                    render();
                }
            });

            container.querySelectorAll('.q-input-full').forEach(el => {
                el.addEventListener('change', (e) => {
                    window.appStore.updateQuestion(activeRole.id, e.currentTarget.dataset.qid, e.currentTarget.value.trim());
                });
            });

            container.querySelectorAll('.q-type-select-mini').forEach(el => {
                el.addEventListener('change', (e) => {
                    window.appStore.updateQuestionType(activeRole.id, e.currentTarget.dataset.qid, e.currentTarget.value);
                });
            });

            container.querySelectorAll('.btn-q-del').forEach(el => {
                el.addEventListener('click', (e) => {
                    window.appStore.deleteQuestion(activeRole.id, e.currentTarget.dataset.qid);
                    render();
                });
            });

            document.getElementById('btn-add-q')?.addEventListener('click', () => {
                const val  = document.getElementById('new-q-input').value.trim();
                if (val) {
                    window.appStore.addQuestion(activeRole.id, val, 'detailed');
                    render();
                }
            });

            document.getElementById('jd-upload-input')?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const isPdf = file.name.toLowerCase().endsWith('.pdf');
                const isDocx = file.name.toLowerCase().endsWith('.docx');
                const reader = new FileReader();
                reader.onload = async () => {
                    if (isPdf) {
                        const base64 = reader.result.split(',')[1];
                        window.appStore.updateRoleJobDesc(activeRole.id, { jdPdfBase64: base64, jdFileName: file.name, jdText: null });
                    } else if (isDocx) {
                        const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
                        window.appStore.updateRoleJobDesc(activeRole.id, { jdText: result.value, jdFileName: file.name, jdPdfBase64: null });
                    } else {
                        window.appStore.updateRoleJobDesc(activeRole.id, { jdText: reader.result, jdFileName: file.name, jdPdfBase64: null });
                    }
                    render();
                };
                if (isPdf) reader.readAsDataURL(file);
                else if (isDocx) reader.readAsArrayBuffer(file);
                else reader.readAsText(file);
            });

            document.getElementById('btn-remove-jd')?.addEventListener('click', () => {
                if (confirm(t('role.remove_jd_confirm'))) { window.appStore.clearRoleJobDesc(activeRole.id); render(); }
            });

            document.getElementById('btn-generate-qs')?.addEventListener('click', async () => {
                const btn = document.getElementById('btn-generate-qs');
                const originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<span class="spin"><i data-lucide="loader-2" style="width:14px;"></i></span> ${t('role.jd_generating')}`;
                lucide.createIcons();

                try {
                    const qs = await generateInterviewQuestions(activeRole.jdText, activeRole.jdPdfBase64, activeRole);
                    window.appStore.appendRoleQuestions(activeRole.id, qs);
                    render();
                } catch (err) {
                    alert("Error: " + err.message);
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    lucide.createIcons();
                }
            });
        }
    };

    render();
}
