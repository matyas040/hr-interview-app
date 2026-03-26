console.log("🛠️ roleManager.js v21 loaded");
import { t, getLang } from '../services/translations.js?v=21';
import { generateInterviewQuestions } from '../services/aiService.js?v=20';

export function renderRoleManager(container, params = {}) {
    const render = () => {
        const roles = window.appStore.getRoles();
        const activeRoleId = params.roleId || (roles.length > 0 ? roles[0].id : null);
        const activeRole = activeRoleId ? window.appStore.getRoleById(activeRoleId) : null;

        container.innerHTML = `
            <div class="mb-6">
                <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                    <i data-lucide="arrow-left"></i> ${t('role.back')}
                </button>
                <div class="flex justify-between items-center">
                    <h2 style="font-size: 1.5rem; font-weight: 600;">${t('role.title')}</h2>
                    <button class="btn btn-primary" id="btn-add-role">
                        <i data-lucide="plus"></i> ${t('role.add_new')}
                    </button>
                </div>
            </div>

            <div style="display: flex; gap: 2rem; align-items: flex-start;">
                <!-- Sidebar: Roles List -->
                <div class="card" style="flex: 0 0 300px; padding: 1rem;">
                    <h3 class="mb-4" style="font-size: 1rem; font-weight: 600; padding: 0 0.5rem;">${t('role.list_title')}</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${roles.map(r => `
                            <button 
                                class="role-item ${r.id === activeRoleId ? 'active' : ''}" 
                                style="text-align: left; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: ${r.id === activeRoleId ? 'var(--bg-primary)' : 'transparent'}; border: 1px solid ${r.id === activeRoleId ? 'var(--border-color)' : 'transparent'}; width: 100%; transition: all 0.2s;"
                                data-id="${r.id}"
                            >
                                <div style="font-weight: ${r.id === activeRoleId ? '600' : '400'}; color: ${r.id === activeRoleId ? 'var(--accent)' : 'var(--text-primary)'};">${r.title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${r.questions.length} ${getLang() === 'hu' ? 'kérdés' : 'questions'}${r.pdfName ? ' · 📎 PDF' : ''}</div>
                            </button>
                        `).join('')}
                        ${roles.length === 0 ? `<p style="color: var(--text-secondary); padding: 1rem;">${t('role.no_roles')}</p>` : ''}
                    </div>
                </div>

                <!-- Main: Role Editor -->
                <div style="flex: 1;">
                    ${activeRole ? `
                        <div class="card mb-4">
                            <div class="form-group mb-0 flex gap-2">
                                <input type="text" id="role-title-input" class="form-input" value="${activeRole.title}" style="flex: 1; font-size: 1.25rem; font-weight: 600;">
                                <button class="btn btn-success" id="btn-save-role">${t('role.save')}</button>
                                <button class="btn btn-danger" id="btn-delete-role"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>

                        <div class="card mb-4">
                            <div class="flex justify-between items-center mb-4">
                                <h3 style="font-size: 1.125rem; font-weight: 500;">${t('role.questions')} (${activeRole.questions.length})</h3>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;" id="questions-list">
                                ${activeRole.questions.map((q, index) => `
                                    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                                        <div style="background: var(--bg-primary); width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); border: 1px solid var(--border-color); flex-shrink: 0; margin-top: 0.5rem;">${index + 1}</div>
                                        <input type="text" class="form-input q-input" data-qid="${q.id}" value="${q.text}" style="flex: 1;">
                                        <select class="form-input q-type-select" data-qid="${q.id}" style="width: auto; min-width: 130px; font-size: 0.82rem; margin-top: 0;" title="Válasz típusa">
                                            <option value="short" ${(q.answerType || 'detailed') === 'short' ? 'selected' : ''}>⚡ ${getLang() === 'hu' ? 'Rövid' : 'Short'}</option>
                                            <option value="detailed" ${(q.answerType || 'detailed') === 'detailed' ? 'selected' : ''}>📝 ${getLang() === 'hu' ? 'Részletes' : 'Detailed'}</option>
                                        </select>
                                        <button class="btn btn-icon btn-danger-text btn-del-q" data-qid="${q.id}" style="margin-top: 0.25rem;"><i data-lucide="x"></i></button>
                                    </div>
                                `).join('')}
                                ${activeRole.questions.length === 0 ? `<p style="color: var(--text-secondary);">${t('role.no_questions')}</p>` : ''}
                            </div>

                            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                                <input type="text" id="new-q-input" class="form-input" placeholder="${t('role.q_placeholder')}" style="flex: 1; min-width: 200px;">
                                <select id="new-q-type" class="form-input" style="width: auto; min-width: 140px; font-size: 0.85rem;">
                                    <option value="detailed">📝 ${getLang() === 'hu' ? 'Részletes válasz' : 'Detailed answer'}</option>
                                    <option value="short">⚡ ${getLang() === 'hu' ? 'Rövid válasz' : 'Short answer'}</option>
                                </select>
                                <button class="btn btn-primary" id="btn-add-q"><i data-lucide="plus"></i> ${t('role.add_q')}</button>
                            </div>
                        </div>

                        <!-- Job Description Section (for AI) -->
                        <div class="card mb-4">
                            <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="brain-circuit" style="width: 1rem; color: #8b5cf6;"></i> ${t('role.jd_title')}
                                <span style="font-size: 0.7rem; background: rgba(139,92,246,0.12); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); border-radius: 1rem; padding: 0.15rem 0.55rem; font-weight: 700;">${t('role.jd_ai_badge')}</span>
                            </h3>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.25rem;">
                                ${t('role.jd_subtitle')}
                            </p>
                            ${activeRole.jdFileName ? `
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.875rem 1rem; background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); border-radius: var(--radius-md); margin-bottom: 1rem;">
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <i data-lucide="file-badge" style="width: 1.5rem; color: #8b5cf6; flex-shrink: 0;"></i>
                                        <div>
                                            <div style="font-weight: 500;">${activeRole.jdFileName}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${t('role.jd_title')}</div>
                                        </div>
                                    </div>
                                    <button class="btn btn-danger" id="btn-remove-jd" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                                <button class="btn btn-primary w-full" id="btn-generate-qs" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; font-weight: 600; padding: 0.75rem;">
                                   <i data-lucide="sparkles"></i> ${t('role.jd_generate')}
                                </button>
                            ` : `
                                <label class="btn btn-secondary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="upload"></i> ${t('role.jd_upload')}
                                    <input type="file" accept=".pdf,.txt,.docx" id="jd-upload-input" style="display: none;">
                                </label>
                            `}
                            <div id="jd-upload-status" style="margin-top: 0.5rem; font-size: 0.875rem;"></div>
                        </div>

                        <!-- PDF Attachment Section (candidate reading material) -->
                        <div class="card">
                            <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="file-text" style="width: 1rem; color: var(--accent);"></i> ${t('role.attachment_title')}
                            </h3>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.25rem;">
                                ${t('role.attachment_subtitle')}
                            </p>
                            ${activeRole.pdfName ? `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.2); border-radius: var(--radius-md); margin-bottom: 1rem;">
                                <i data-lucide="file-text" style="width: 1.5rem; color: var(--accent); flex-shrink: 0;"></i>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeRole.pdfName}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${getLang() === 'hu' ? 'Csatolt dokumentum' : 'Attached document'}</div>
                                </div>
                                <button class="btn btn-secondary" id="btn-preview-pdf" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                                    <i data-lucide="eye"></i> ${t('role.pdf_preview')}
                                </button>
                                <button class="btn btn-danger" id="btn-remove-pdf" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                                    <i data-lucide="trash-2" style="width: 1rem;"></i>
                                </button>
                            </div>
                            ` : ''}
                            <label class="btn btn-secondary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="upload"></i> ${activeRole.pdfName ? t('role.pdf_replace') : t('role.pdf_upload')}
                                <input type="file" accept=".pdf" id="pdf-upload-input" style="display: none;">
                            </label>
                            <div id="pdf-upload-status" style="margin-top: 0.5rem; font-size: 0.875rem;"></div>
                        </div>

                    ` : `
                        <div class="card flex flex-col items-center justify-center text-center" style="min-height: 300px;">
                            <i data-lucide="file-question" style="width: 3rem; height: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                            <h3 style="font-size: 1.25rem; font-weight: 500;" class="mb-2">${t('role.select_role')}</h3>
                            <p style="color: var(--text-secondary);">${t('role.select_role_subtitle')}</p>
                        </div>
                    `}
                </div>
            </div>
            <style>
                .role-item:hover { background-color: var(--bg-primary) !important; }
                .btn-danger-text { color: var(--danger); }
                .btn-danger-text:hover { background-color: rgba(239, 68, 68, 0.1); }
                .w-full { width: 100%; }
            </style>
        `;

        lucide.createIcons();
        attachEvents(activeRole);
    };

    const attachEvents = (activeRole) => {
        // Switch role
        container.querySelectorAll('.role-item').forEach(el => {
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
                const type = document.getElementById('new-q-type').value;
                if (val) {
                    window.appStore.addQuestion(activeRole.id, val, type);
                    render();
                }
            });
            document.getElementById('new-q-input')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('btn-add-q')?.click();
            });

            // JD: file upload (PDF or TXT or Word)
            document.getElementById('jd-upload-input')?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const statusEl = document.getElementById('jd-upload-status');
                statusEl.innerHTML = `<span style="color: var(--text-secondary);">⏳ ${t('role.uploading')}</span>`;
                
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
                        statusEl.innerHTML = `<span style="color: var(--success);">✓ ${file.name} ${t('role.upload_success')}</span>`;
                        setTimeout(() => render(), 800);
                    } catch (err) {
                        statusEl.innerHTML = `<span style="color: var(--danger);">✗ ${t('role.upload_error')}</span>`;
                    }
                };
                reader.onerror = () => {
                    statusEl.innerHTML = `<span style="color: var(--danger);">✗ ${t('role.upload_error')}</span>`;
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
                    console.log("🤖 AI Generation start for role:", activeRole.id);
                    const qs = await generateInterviewQuestions(activeRole.jdText, activeRole.jdPdfBase64);
                    console.log("🤖 AI Generated:", qs.length, "questions");
                    
                    if (Array.isArray(qs) && qs.length > 0) {
                        window.appStore.appendRoleQuestions(activeRole.id, qs);
                        render();
                    } else {
                        throw new Error("Invalid format from AI");
                    }
                } catch (err) {
                    console.error("❌ AI Generation Error:", err);
                    alert("AI Error: " + (err.message || "Ismeretlen hiba történt. Ellenőrizd az API kulcsot!"));
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
                statusEl.innerHTML = `<span style="color: var(--text-secondary);">⏳ ${t('role.uploading')}</span>`;
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    window.appStore.updateRolePdf(activeRole.id, base64, file.name);
                    statusEl.innerHTML = `<span style="color: var(--success);">✓ ${file.name} ${getLang() === 'hu' ? 'sikeresen csatolva.' : 'successfully attached.'}</span>`;
                    setTimeout(() => render(), 800);
                };
                reader.onerror = () => {
                    statusEl.innerHTML = `<span style="color: var(--danger);">✗ ${t('role.upload_error')}</span>`;
                };
                reader.readAsDataURL(file);
            });

            // PDF: remove
            document.getElementById('btn-remove-pdf')?.addEventListener('click', () => {
                if (confirm(t('role.remove_pdf_confirm'))) {
                    window.appStore.clearRolePdf(activeRole.id);
                    render();
                }
            });

            // PDF: preview in new tab
            document.getElementById('btn-preview-pdf')?.addEventListener('click', () => {
                const role = window.appStore.getRoleById(activeRole.id);
                if (role?.pdfBase64) {
                    const url = `data:application/pdf;base64,${role.pdfBase64}`;
                    window.open(url, '_blank');
                }
            });
        }
    };

    render();
}
