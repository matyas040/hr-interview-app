import { t, getLang } from '../services/translations.js?v=24';
import { generateInterviewQuestions } from '../services/aiService.js?v=24';

export function renderRoleManager(container, params = {}) {
    const render = () => {
        const roles = window.appStore.getRoles();
        const activeRoleId = params.roleId || (roles.length > 0 ? roles[0].id : null);
        const activeRole = activeRoleId ? window.appStore.getRoleById(activeRoleId) : null;

        container.innerHTML = `
            <div class="simple-role-manager">
                <div class="flex justify-between items-center mb-10">
                    <div>
                        <button class="btn-back mb-2" onclick="window.navigateTo('dashboard')">
                            <i data-lucide="arrow-left" style="width: 14px;"></i> ${t('role.back')}
                        </button>
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${t('role.title')}</h2>
                    </div>
                    <button class="btn btn-primary" id="btn-add-role">
                        <i data-lucide="plus"></i> ${t('role.add_new')}
                    </button>
                </div>

                <div class="role-grid">
                    <!-- Sidebar: Roles -->
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

                    <!-- Main: Editor -->
                    <main class="editor-area">
                        ${activeRole ? `
                            <div class="edit-card">
                                <section class="editor-header mb-8">
                                    <input type="text" id="role-title-input" class="role-title-input" value="${activeRole.title}">
                                    <div class="flex items-center gap-2">
                                        <button class="btn btn-success" id="btn-save-role">${t('role.save')}</button>
                                        <button class="btn-icon-del" id="btn-delete-role"><i data-lucide="trash-2"></i></button>
                                    </div>
                                </section>

                                <section class="questions-section mb-10">
                                    <div class="flex items-center justify-between mb-6">
                                        <h3 class="section-title">${t('role.questions')}</h3>
                                        <span class="badge-count">${activeRole.questions.length}</span>
                                    </div>
                                    
                                    <div id="questions-list" class="q-stack">
                                        ${activeRole.questions.map((q, index) => `
                                            <div class="q-item">
                                                <div class="q-lead">${index + 1}</div>
                                                <div class="q-body">
                                                    <input type="text" class="q-input" data-qid="${q.id}" value="${q.text}">
                                                    <div class="q-meta">
                                                        <select class="q-type-select" data-qid="${q.id}">
                                                            <option value="short" ${(q.answerType || 'detailed') === 'short' ? 'selected' : ''}>${getLang() === 'hu' ? 'Rövid' : 'Short'}</option>
                                                            <option value="detailed" ${(q.answerType || 'detailed') === 'detailed' ? 'selected' : ''}>${getLang() === 'hu' ? 'Részletes' : 'Detailed'}</option>
                                                        </select>
                                                        <button class="btn-q-del" data-qid="${q.id}"><i data-lucide="x"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>

                                    <div class="add-q-bar mt-6">
                                        <input type="text" id="new-q-input" class="new-q-field" placeholder="${t('role.q_placeholder')}">
                                        <button class="btn btn-primary" id="btn-add-q">
                                            <i data-lucide="plus"></i>
                                        </button>
                                    </div>
                                </section>

                                <footer class="assets-footer">
                                    <div class="asset-group">
                                        <h4 class="asset-label">${t('role.jd_title')}</h4>
                                        <p class="asset-desc">${t('role.jd_subtitle')}</p>
                                        ${activeRole.jdFileName ? `
                                            <div class="asset-pill active">
                                                <i data-lucide="file-text"></i>
                                                <span class="name">${activeRole.jdFileName}</span>
                                                <button class="btn-pill-del" id="btn-remove-jd"><i data-lucide="x"></i></button>
                                            </div>
                                            <button class="btn btn-ai-simple w-full mt-2" id="btn-generate-qs">✨ ${t('role.jd_generate')}</button>
                                        ` : `
                                            <label class="simple-upload">
                                                <i data-lucide="upload"></i> Upload JD
                                                <input type="file" accept=".pdf,.txt,.docx" id="jd-upload-input" hidden>
                                            </label>
                                        `}
                                        <div id="jd-upload-status" class="status-box"></div>
                                    </div>

                                    <div class="asset-group">
                                        <h4 class="asset-label">${t('role.attachment_title')}</h4>
                                        <p class="asset-desc">${t('role.attachment_subtitle')}</p>
                                        ${activeRole.pdfName ? `
                                            <div class="asset-pill active">
                                                <i data-lucide="paperclip"></i>
                                                <span class="name">${activeRole.pdfName}</span>
                                                <div class="flex gap-2">
                                                    <button class="btn-pill-action" id="btn-preview-pdf"><i data-lucide="external-link"></i></button>
                                                    <button class="btn-pill-del" id="btn-remove-pdf"><i data-lucide="trash-2"></i></button>
                                                </div>
                                            </div>
                                        ` : `
                                            <label class="simple-upload">
                                                <i data-lucide="upload"></i> Upload Attachment
                                                <input type="file" accept=".pdf" id="pdf-upload-input" hidden>
                                            </label>
                                        `}
                                        <div id="pdf-upload-status" class="status-box"></div>
                                    </div>
                                </footer>
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
                .simple-role-manager { max-width: 1100px; margin: 0 auto; user-select: none; }
                .btn-back { background: transparent; border: none; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; font-weight: 500; }
                .btn-back:hover { color: var(--accent); }

                .role-grid { display: grid; grid-template-columns: 280px 1fr; gap: 3rem; align-items: flex-start; }
                
                /* Sidebar */
                .sidebar-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 1rem; font-weight: 600; padding-left: 0.5rem; }
                .role-scroller { display: flex; flex-direction: column; gap: 0.4rem; }
                .role-item-mini { 
                    padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer; transition: all 0.2s;
                    display: flex; flex-direction: column; border: 1px solid transparent; 
                }
                .role-item-mini:hover { background: rgba(0,0,0,0.03); }
                .role-item-mini.active { background: white; border-color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
                .role-item-mini .title { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
                .role-item-mini .count { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem; }
                .role-item-mini.active .title { color: var(--accent); }

                /* Editor Card */
                .edit-card { background: white; border-radius: 16px; border: 1px solid var(--border-color); padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
                
                .role-title-input { 
                    flex: 1; border: none; font-size: 1.75rem; font-weight: 700; color: var(--text-primary); 
                    outline: none; background: transparent; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: border-color 0.2s;
                }
                .role-title-input:focus { border-color: var(--accent-soft); }
                .btn-icon-del { width: 42px; height: 42px; border-radius: 10px; border: none; background: rgba(239, 68, 68, 0.05); color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-icon-del:hover { background: var(--danger); color: white; }

                .section-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
                .badge-count { background: var(--bg-primary); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); border: 1px solid var(--border-color); }

                /* Questions */
                .q-stack { display: flex; flex-direction: column; gap: 0.75rem; }
                .q-item { display: flex; gap: 1rem; align-items: flex-start; padding: 0.75rem; border-radius: 12px; transition: background 0.2s; }
                .q-item:hover { background: rgba(0,0,0,0.015); }
                .q-lead { width: 28px; height: 28px; border-radius: 8px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); flex-shrink: 0; margin-top: 2px; }
                .q-body { flex: 1; }
                .q-input { width: 100%; border: none; background: transparent; font-size: 1rem; color: var(--text-primary); outline: none; padding: 4px 0; border-bottom: 1px solid transparent; }
                .q-input:focus { border-color: var(--accent-soft); }
                .q-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.4rem; opacity: 0; transition: opacity 0.2s; }
                .q-item:hover .q-meta { opacity: 1; }
                .q-type-select { background: transparent; border: none; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; outline: none; }
                .btn-q-del { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 2px; }
                .btn-q-del:hover { color: var(--danger); }

                .add-q-bar { display: flex; gap: 0.75rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 12px; border: 1px dashed var(--border-color); }
                .new-q-field { flex: 1; border: none; background: transparent; padding: 0.5rem; font-size: 0.95rem; outline: none; }

                /* Assets Footer */
                .assets-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; border-top: 1px solid var(--border-color); padding-top: 2rem; }
                .asset-label { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem; }
                .asset-desc { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem; }
                
                .asset-pill { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-primary); }
                .asset-pill .name { flex: 1; font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .btn-pill-del { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }
                .btn-pill-del:hover { color: var(--danger); }
                .btn-pill-action { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }
                .btn-pill-action:hover { color: var(--accent); }

                .simple-upload { border: 2px dashed var(--border-color); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
                .simple-upload:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
                
                .btn-ai-simple { background: white; border: 1px solid var(--accent); color: var(--accent); font-weight: 600; font-size: 0.85rem; }
                .btn-ai-simple:hover { background: var(--accent); color: white; }

                .empty-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; color: var(--text-secondary); }
                .empty-placeholder i { width: 3rem; height: 3rem; margin-bottom: 1rem; opacity: 0.3; }
                .status-box { font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.5rem; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; display: inline-block; }
                .w-full { width: 100%; }
            </style>
        `;

        lucide.createIcons();
        attachEvents(activeRole);
    };

    const attachEvents = (activeRole) => {
        container.querySelectorAll('.role-item-mini').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                params.roleId = id;
                render();
            });
        });

        document.getElementById('btn-add-role')?.addEventListener('click', () => {
            const newRole = window.appStore.addRole(getLang() === 'hu' ? 'Új Munkakör' : 'New Role');
            params.roleId = newRole.id;
            render();
        });

        if (activeRole) {
            document.getElementById('btn-save-role')?.addEventListener('click', () => {
                const title = document.getElementById('role-title-input').value.trim();
                if (title) {
                    window.appStore.updateRole(activeRole.id, title);
                    render();
                }
            });

            document.getElementById('btn-delete-role')?.addEventListener('click', () => {
                if (confirm(t('role.delete_role_confirm'))) {
                    window.appStore.deleteRole(activeRole.id);
                    params.roleId = null;
                    render();
                }
            });

            container.querySelectorAll('.q-input').forEach(el => {
                el.addEventListener('change', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    const val = e.currentTarget.value.trim();
                    if (val) window.appStore.updateQuestion(activeRole.id, qId, val);
                });
            });

            container.querySelectorAll('.q-type-select').forEach(el => {
                el.addEventListener('change', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    const type = e.currentTarget.value;
                    window.appStore.updateQuestionType(activeRole.id, qId, type);
                });
            });

            container.querySelectorAll('.btn-del-q').forEach(el => {
                el.addEventListener('click', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    window.appStore.deleteQuestion(activeRole.id, qId);
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
                const statusEl = document.getElementById('jd-upload-status');
                statusEl.innerHTML = `⏳ ${t('role.uploading')}...`;
                const isPdf = file.name.toLowerCase().endsWith('.pdf');
                const isDocx = file.name.toLowerCase().endsWith('.docx');
                const reader = new FileReader();

                reader.onload = async () => {
                    try {
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
                    } catch (err) {
                        statusEl.innerHTML = `✗ Error`;
                    }
                };
                if (isPdf) reader.readAsDataURL(file);
                else if (isDocx) reader.readAsArrayBuffer(file);
                else reader.readAsText(file);
            });

            document.getElementById('btn-remove-jd')?.addEventListener('click', () => {
                if (confirm(t('role.remove_jd_confirm'))) {
                    window.appStore.clearRoleJobDesc(activeRole.id);
                    render();
                }
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

            document.getElementById('pdf-upload-input')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    window.appStore.updateRolePdf(activeRole.id, base64, file.name);
                    render();
                };
                reader.readAsDataURL(file);
            });

            document.getElementById('btn-preview-pdf')?.addEventListener('click', () => {
                const role = window.appStore.getRoleById(activeRole.id);
                if (role?.pdfBase64) window.open(`data:application/pdf;base64,${role.pdfBase64}`, '_blank');
            });

            document.getElementById('btn-remove-pdf')?.addEventListener('click', () => {
                if (confirm(t('role.remove_pdf_confirm'))) {
                    window.appStore.clearRolePdf(activeRole.id);
                    render();
                }
            });
        }
    };

    render();
}
