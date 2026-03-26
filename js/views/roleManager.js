import { t, getLang } from '../services/translations.js?v=23';
import { generateInterviewQuestions } from '../services/aiService.js?v=23';

export function renderRoleManager(container, params = {}) {
    const render = () => {
        const roles = window.appStore.getRoles();
        const activeRoleId = params.roleId || (roles.length > 0 ? roles[0].id : null);
        const activeRole = activeRoleId ? window.appStore.getRoleById(activeRoleId) : null;

        container.innerHTML = `
            <div class="role-manager-layout">
                <!-- Sidebar -->
                <aside class="role-sidebar card">
                    <div class="flex items-center justify-between mb-6">
                        <h2 style="font-size: 1.1rem; font-weight: 700; letter-spacing: -0.01em;">${t('role.list_title')}</h2>
                        <button class="btn-icon btn-add-circle" id="btn-add-role" title="${t('role.add_new')}">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                    
                    <div class="role-list">
                        ${roles.map(r => `
                            <div class="role-card ${r.id === activeRoleId ? 'active' : ''}" data-id="${r.id}">
                                <div class="role-card-info">
                                    <span class="role-card-title">${r.title}</span>
                                    <span class="role-card-meta">${r.questions.length} ${getLang() === 'hu' ? 'kérdés' : 'questions'}</span>
                                </div>
                                ${r.pdfName || r.jdFileName ? '<i data-lucide="paperclip" class="role-card-icon"></i>' : ''}
                            </div>
                        `).join('')}
                        ${roles.length === 0 ? `<div class="empty-state-small">${t('role.no_roles')}</div>` : ''}
                    </div>
                </aside>

                <!-- Content Area -->
                <main class="role-main">
                    ${activeRole ? `
                        <header class="role-header card mb-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4 flex-1">
                                    <button class="btn-icon" onclick="window.navigateTo('dashboard')">
                                        <i data-lucide="chevron-left"></i>
                                    </button>
                                    <input type="text" id="role-title-input" class="role-title-field" value="${activeRole.title}">
                                </div>
                                <div class="flex items-center gap-2">
                                    <button class="btn btn-primary" id="btn-save-role">
                                        <i data-lucide="check"></i> ${t('role.save')}
                                    </button>
                                    <button class="btn btn-secondary btn-danger-hover" id="btn-delete-role">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        </header>

                        <!-- Two Column Actions & Questions -->
                        <div class="role-content-grid">
                            <!-- Left: Questions List -->
                            <section class="card question-section">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 style="font-size: 1rem; font-weight: 500;">${t('role.questions')}</h3>
                                    <span class="badge">${activeRole.questions.length}</span>
                                </div>

                                <div class="questions-scroll-area">
                                    <div id="questions-list" class="questions-compact-list">
                                        ${activeRole.questions.map((q, index) => `
                                            <div class="q-row">
                                                <div class="q-number">${index + 1}</div>
                                                <div class="q-content">
                                                    <input type="text" class="q-text-input q-input" data-qid="${q.id}" value="${q.text}">
                                                    <div class="q-actions">
                                                        <select class="q-type-select q-type-minimal" data-qid="${q.id}">
                                                            <option value="short" ${(q.answerType || 'detailed') === 'short' ? 'selected' : ''}>⚡ ${getLang() === 'hu' ? 'Rövid' : 'Short'}</option>
                                                            <option value="detailed" ${(q.answerType || 'detailed') === 'detailed' ? 'selected' : ''}>📝 ${getLang() === 'hu' ? 'Részletes' : 'Detailed'}</option>
                                                        </select>
                                                        <button class="btn-icon btn-del-q" data-qid="${q.id}"><i data-lucide="x"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                        ${activeRole.questions.length === 0 ? `<div class="empty-state-small">${t('role.no_questions')}</div>` : ''}
                                    </div>
                                </div>

                                <div class="add-q-container mt-6">
                                    <input type="text" id="new-q-input" class="form-input-minimal" placeholder="${t('role.q_placeholder')}">
                                    <button class="btn-add-square" id="btn-add-q"><i data-lucide="plus"></i></button>
                                </div>
                            </section>

                            <!-- Right: Role Assets (JD & PDF) -->
                            <div class="role-assets">
                                <!-- AI Section -->
                                <section class="card ai-card mb-4 highlight-border">
                                    <div class="ai-header mb-4">
                                        <div class="flex items-center gap-2">
                                            <div class="ai-icon-bg"><i data-lucide="sparkles"></i></div>
                                            <div>
                                                <h4 style="font-size: 0.9rem; font-weight: 600;">${t('role.jd_title')}</h4>
                                                <p style="font-size: 0.75rem; color: var(--text-secondary);">${t('role.jd_subtitle')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    ${activeRole.jdFileName ? `
                                        <div class="file-pill ai-file mb-4">
                                            <i data-lucide="file-text"></i>
                                            <span class="file-name">${activeRole.jdFileName}</span>
                                            <button class="btn-icon-small" id="btn-remove-jd"><i data-lucide="x"></i></button>
                                        </div>
                                        <button class="btn btn-ai w-full" id="btn-generate-qs">
                                            <i data-lucide="wand-2"></i> ${t('role.jd_generate')}
                                        </button>
                                    ` : `
                                        <label class="upload-dropzone">
                                            <i data-lucide="upload-cloud"></i>
                                            <span>${t('role.jd_upload')}</span>
                                            <input type="file" accept=".pdf,.txt,.docx" id="jd-upload-input" hidden>
                                        </label>
                                    `}
                                    <div id="jd-upload-status" class="status-msg"></div>
                                </section>

                                <!-- PDF Section -->
                                <section class="card">
                                    <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem;">${t('role.attachment_title')}</h4>
                                    ${activeRole.pdfName ? `
                                        <div class="file-pill mb-4">
                                            <i data-lucide="book-open"></i>
                                            <span class="file-name">${activeRole.pdfName}</span>
                                            <button class="btn-icon-small" id="btn-preview-pdf"><i data-lucide="external-link"></i></button>
                                            <button class="btn-icon-small" id="btn-remove-pdf"><i data-lucide="trash-2"></i></button>
                                        </div>
                                    ` : `
                                        <label class="btn btn-secondary w-full" style="cursor: pointer;">
                                            <i data-lucide="upload"></i> ${t('role.pdf_upload')}
                                            <input type="file" accept=".pdf" id="pdf-upload-input" hidden>
                                        </label>
                                    `}
                                    <div id="pdf-upload-status" class="status-msg"></div>
                                </section>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state-full card">
                            <div class="empty-icon-lg"><i data-lucide="briefcase"></i></div>
                            <h3>${t('role.select_role')}</h3>
                            <p>${t('role.select_role_subtitle')}</p>
                            <button class="btn btn-primary mt-6" id="btn-add-role-empty"><i data-lucide="plus"></i> ${t('role.add_new')}</button>
                        </div>
                    `}
                </main>
            </div>

            <style>
                .role-manager-layout { display: flex; gap: 2rem; align-items: flex-start; min-height: 80vh; }
                .role-sidebar { width: 300px; flex-shrink: 0; position: sticky; top: 100px; padding: 1.5rem; height: fit-content; }
                .role-main { flex: 1; min-width: 0; }
                
                /* Sidebar List */
                .role-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .role-card { 
                    padding: 1rem; border-radius: 12px; border: 1px solid transparent; cursor: pointer;
                    display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;
                    background: rgba(255,255,255,0.03);
                }
                .role-card:hover { background: var(--bg-primary); border-color: var(--border-color); }
                .role-card.active { 
                    background: var(--bg-secondary); border-color: var(--accent);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .role-card-title { display: block; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.15rem; }
                .role-card-meta { font-size: 0.75rem; color: var(--text-secondary); }
                .role-card-icon { width: 1rem; color: var(--accent); opacity: 0.7; }

                /* Header Area */
                .role-header { padding: 1.25rem 1.75rem; }
                .role-title-field { 
                    background: transparent; border: none; font-size: 1.35rem; font-weight: 700; 
                    color: var(--text-primary); width: 100%; outline: none;
                }
                
                /* Grid Content */
                .role-content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
                
                /* Question Rows */
                .questions-compact-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .q-row { 
                    display: flex; gap: 1rem; align-items: flex-start; padding: 0.75rem; 
                    border-radius: 12px; transition: background 0.2s;
                }
                .q-row:hover { background: rgba(0,0,0,0.02); }
                [data-theme="dark"] .q-row:hover { background: rgba(255,255,255,0.02); }
                
                .q-number { width: 24px; height: 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-top: 8px; flex-shrink: 0; }
                .q-content { flex: 1; min-width: 0; }
                .q-text-input { background: transparent; border: none; border-bottom: 1px solid transparent; width: 100%; padding: 4px 0; font-size: 0.95rem; color: var(--text-primary); outline: none; transition: border-color 0.2s; }
                .q-text-input:focus { border-color: var(--accent); }
                .q-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 4px; opacity: 0; transition: opacity 0.2s; }
                .q-row:hover .q-actions { opacity: 1; }
                
                .q-type-minimal { background: transparent; border: none; font-size: 0.7rem; color: var(--text-secondary); outline: none; cursor: pointer; padding: 2px 4px; }
                .q-type-minimal:hover { color: var(--accent); }
                
                .add-q-container { display: flex; gap: 0.5rem; background: var(--bg-primary); border: 1px dotted var(--border-color); padding: 6px; border-radius: 12px; }
                .form-input-minimal { flex: 1; background: transparent; border: none; padding: 0.5rem; font-size: 0.875rem; outline: none; }
                .btn-add-square { width: 34px; height: 34px; background: var(--accent); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-add-square:hover { transform: scale(1.05); }

                /* AI Card Special */
                .highlight-border { border: 1.5px solid rgba(139,92,246,0.2); }
                .ai-icon-bg { width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
                .btn-ai { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; box-shadow: 0 4px 12px rgba(139,92,246,0.3); font-weight: 600; }
                .btn-ai:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(139,92,246,0.4); }
                
                /* File Pills */
                .file-pill { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-primary); border-radius: 10px; border: 1px solid var(--border-color); }
                .file-name { flex: 1; font-size: 0.85rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .btn-icon-small { padding: 4px; border-radius: 4px; color: var(--text-secondary); transition: all 0.2s; }
                .btn-icon-small:hover { background: rgba(0,0,0,0.05); color: var(--danger); }
                
                /* Dropzone */
                .upload-dropzone { 
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem; 
                    padding: 1.5rem; border: 2px dashed var(--border-color); border-radius: 12px; 
                    cursor: pointer; transition: all 0.2s; color: var(--text-secondary);
                }
                .upload-dropzone:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
                
                /* Empty States */
                .empty-state-full { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4rem 2rem; }
                .empty-icon-lg { font-size: 3rem; color: var(--accent-soft); margin-bottom: 1.5rem; }
                .empty-state-small { padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem; font-style: italic; }
                .badge { font-size: 0.7rem; background: var(--accent-soft); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-weight: 700; }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .w-full { width: 100%; }
            </style>
        `;

        lucide.createIcons();
        attachEvents(activeRole);
    };

    const attachEvents = (activeRole) => {
        // Switch role (now using the card class)
        container.querySelectorAll('.role-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                params.roleId = id;
                render();
            });
        });

        // Add role
        document.getElementById('btn-add-role')?.addEventListener('click', () => {
            const newRole = window.appStore.addRole(getLang() === 'hu' ? 'Új Munkakör' : 'New Role');
            params.roleId = newRole.id;
            render();
        });
        document.getElementById('btn-add-role-empty')?.addEventListener('click', () => {
            document.getElementById('btn-add-role').click();
        });

        if (activeRole) {
            // Save role title
            document.getElementById('btn-save-role')?.addEventListener('click', () => {
                const title = document.getElementById('role-title-input').value.trim();
                if (title) {
                    window.appStore.updateRole(activeRole.id, title);
                    render();
                }
            });

            // Delete role
            document.getElementById('btn-delete-role')?.addEventListener('click', () => {
                if (confirm(t('role.delete_role_confirm'))) {
                    window.appStore.deleteRole(activeRole.id);
                    params.roleId = null;
                    render();
                }
            });

            // Update existing question text (change event)
            container.querySelectorAll('.q-input').forEach(el => {
                el.addEventListener('change', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    const val = e.currentTarget.value.trim();
                    if (val) window.appStore.updateQuestion(activeRole.id, qId, val);
                });
            });

            // Update existing question type
            container.querySelectorAll('.q-type-select').forEach(el => {
                el.addEventListener('change', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    const type = e.currentTarget.value;
                    window.appStore.updateQuestionType(activeRole.id, qId, type);
                });
            });

            // Delete question
            container.querySelectorAll('.btn-del-q').forEach(el => {
                el.addEventListener('click', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    window.appStore.deleteQuestion(activeRole.id, qId);
                    render();
                });
            });

            // Add new question
            document.getElementById('btn-add-q')?.addEventListener('click', () => {
                const val  = document.getElementById('new-q-input').value.trim();
                if (val) {
                    window.appStore.addQuestion(activeRole.id, val, 'detailed');
                    render();
                }
            });
            document.getElementById('new-q-input')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('btn-add-q')?.click();
            });

            // JD: file upload
            document.getElementById('jd-upload-input')?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const statusEl = document.getElementById('jd-upload-status');
                statusEl.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.75rem;">⏳ ${t('role.uploading')}</span>`;
                
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
                        statusEl.innerHTML = `<span style="color: var(--danger); font-size: 0.75rem;">✗ ${t('role.upload_error')}</span>`;
                    }
                };
                if (isPdf) reader.readAsDataURL(file);
                else if (isDocx) reader.readAsArrayBuffer(file);
                else reader.readAsText(file);
            });

            // JD: remove
            document.getElementById('btn-remove-jd')?.addEventListener('click', () => {
                if (confirm(t('role.remove_jd_confirm'))) {
                    window.appStore.clearRoleJobDesc(activeRole.id);
                    render();
                }
            });

            // JD: AI Generate Questions
            document.getElementById('btn-generate-qs')?.addEventListener('click', async () => {
                const btn = document.getElementById('btn-generate-qs');
                const originalHtml = btn.innerHTML;
                
                if (!activeRole.jdText && !activeRole.jdPdfBase64) {
                    alert(getLang() === 'hu' ? "Előbb tölts fel egy munkaköri leírást!" : "Please upload a job description first!");
                    return;
                }

                btn.disabled = true;
                btn.innerHTML = `<i class="spin" data-lucide="loader-2"></i> ${t('role.jd_generating')}`;
                if (window.lucide) lucide.createIcons();

                try {
                    const qs = await generateInterviewQuestions(activeRole.jdText, activeRole.jdPdfBase64, activeRole);
                    if (Array.isArray(qs) && qs.length > 0) {
                        window.appStore.appendRoleQuestions(activeRole.id, qs);
                        render();
                    } else { throw new Error("Format error"); }
                } catch (err) {
                    alert("AI Error: " + (err.message || "Failed"));
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    if (window.lucide) lucide.createIcons();
                }
            });

            // PDF: file upload
            document.getElementById('pdf-upload-input')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const statusEl = document.getElementById('pdf-upload-status');
                statusEl.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.8rem;">⏳ ${t('role.uploading')}</span>`;
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
                if (role?.pdfBase64) {
                    const url = `data:application/pdf;base64,${role.pdfBase64}`;
                    window.open(url, '_blank');
                }
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
