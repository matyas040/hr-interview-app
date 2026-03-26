import { t, getLang } from '../services/translations.js?v=27';
import { generateInterviewQuestions } from '../services/aiService.js?v=27';

export function renderRoleManager(container, params = {}) {
    const render = () => {
        const roles = window.appStore.getRoles();
        const activeRoleId = params.roleId || (roles.length > 0 ? roles[0].id : null);
        const activeRole = activeRoleId ? window.appStore.getRoleById(activeRoleId) : null;
        
        const isFullView = params.fullView === true;

        container.innerHTML = `
            <div class="role-manager-v27 ${isFullView ? 'mode-full' : 'mode-split'}">
                <!-- TOP NAV BAR -->
                <nav class="role-nav">
                    <div class="nav-left">
                        <button class="nav-back" onclick="window.navigateTo('dashboard')">
                            <i data-lucide="chevron-left"></i> ${t('role.back')}
                        </button>
                    </div>
                    <div class="nav-right">
                        ${!isFullView ? `
                            <button class="btn-minimal" id="btn-add-role">
                                <i data-lucide="plus"></i> ${getLang() === 'hu' ? 'Új munkakör' : 'New Role'}
                            </button>
                        ` : `
                            <button class="btn-minimal" id="btn-exit-full">
                                <i data-lucide="x"></i> ${getLang() === 'hu' ? 'Bezárás' : 'Close'}
                            </button>
                        `}
                    </div>
                </nav>

                <div class="role-content">
                    <!-- SIDEBAR (only in split mode) -->
                    ${!isFullView ? `
                        <aside class="role-sidebar-v27">
                            <h3 class="group-label">${t('role.list_title')}</h3>
                            <div class="role-list-v27">
                                ${roles.map(r => `
                                    <div class="role-pivot ${r.id === activeRoleId ? 'is-active' : ''}" data-id="${r.id}">
                                        <span class="title">${r.title}</span>
                                        <span class="meta">${r.questions.length} ${getLang() === 'hu' ? 'kérdés' : 'questions'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </aside>
                    ` : ''}

                    <!-- MAIN EDITOR AREA -->
                    <main class="role-main-v27">
                        ${activeRole ? `
                            <div class="role-canvas">
                                ${isFullView ? `
                                    <!-- FULL MANAGEMENT VIEW -->
                                    <header class="canvas-header-full">
                                        <h1 class="canvas-title">${activeRole.title}</h1>
                                        <div class="canvas-actions">
                                            <button class="btn-action-minimal danger" id="btn-delete-role">
                                                <i data-lucide="trash-2"></i> ${getLang() === 'hu' ? 'Munkakör törlése' : 'Delete Role'}
                                            </button>
                                        </div>
                                    </header>

                                    <!-- FULL VIEW TOOLS -->
                                    <div class="canvas-tools">
                                        <div class="tool-section">
                                            <label class="tool-label">${getLang() === 'hu' ? 'Kérdés hozzáadása' : 'Add Question'}</label>
                                            <div class="premium-input-group">
                                                <input type="text" id="new-q-input" class="premium-field" placeholder="${t('role.q_placeholder')}">
                                                <button class="btn-premium-action" id="btn-add-q">
                                                    <i data-lucide="plus"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="tool-section">
                                            <label class="tool-label">${t('role.jd_title')} & AI</label>
                                            <div class="flex gap-4 items-center">
                                                ${activeRole.jdFileName ? `
                                                    <div class="jd-marker">
                                                        <i data-lucide="file-check"></i>
                                                        <span>${activeRole.jdFileName}</span>
                                                        <button class="jd-clear" id="btn-remove-jd"><i data-lucide="x"></i></button>
                                                    </div>
                                                    <button class="btn-ai-v27" id="btn-generate-qs">
                                                        <i data-lucide="sparkles"></i> ${t('role.jd_generate')}
                                                    </button>
                                                ` : `
                                                    <label class="premium-upload">
                                                        <i data-lucide="cloud-upload"></i> ${getLang() === 'hu' ? 'Leírás feltöltése AI generáláshoz...' : 'Upload JD for AI generation...'}
                                                        <input type="file" accept=".pdf,.txt,.docx" id="jd-upload-input" hidden>
                                                    </label>
                                                `}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- FULL QUESTION LIST -->
                                    <section class="canvas-list-full">
                                        <div class="list-header">
                                            <h3>${t('role.questions')}</h3>
                                            <span class="count-pill">${activeRole.questions.length}</span>
                                        </div>
                                        <div class="q-grid-v27">
                                            ${activeRole.questions.map((q, index) => `
                                                <div class="q-card-v27">
                                                    <div class="q-num">${index + 1}</div>
                                                    <div class="q-main">
                                                        <textarea class="q-edit-area" data-qid="${q.id}">${q.text}</textarea>
                                                        <div class="q-footer">
                                                            <div class="q-type-selector">
                                                                <button class="type-btn ${ (q.answerType || 'detailed') === 'short' ? 'active' : ''}" data-qid="${q.id}" data-type="short">Rövid</button>
                                                                <button class="type-btn ${ (q.answerType || 'detailed') === 'detailed' ? 'active' : ''}" data-qid="${q.id}" data-type="detailed">Részletes</button>
                                                            </div>
                                                            <button class="q-trash" data-qid="${q.id}"><i data-lucide="trash-2"></i></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </section>
                                ` : `
                                    <!-- SIMPLE OVERVIEW VIEW -->
                                    <header class="canvas-header">
                                        <input type="text" id="role-title-input" class="role-title-minimal" value="${activeRole.title}">
                                        <button class="btn-save-minimal" id="btn-save-role">${getLang() === 'hu' ? 'Mentés' : 'Save'}</button>
                                    </header>

                                    <section class="canvas-summary">
                                        <div class="flex justify-between items-center mb-6">
                                            <h4 class="canvas-label">${t('role.questions')} (3 legutóbbi)</h4>
                                            <button class="btn-link" id="btn-open-full">
                                                ${getLang() === 'hu' ? 'Összes kezelése' : 'Manage all'} <i data-lucide="arrow-right"></i>
                                            </button>
                                        </div>

                                        <div class="q-preview-stack">
                                            ${activeRole.questions.length > 0 ? 
                                                activeRole.questions.slice(-3).reverse().map(q => `
                                                    <div class="q-mini-row">
                                                        <div class="q-bullet"></div>
                                                        <p class="q-text">${q.text}</p>
                                                    </div>
                                                `).join('') 
                                                : `<div class="empty-state-v27">${t('role.no_questions')}</div>`
                                            }
                                        </div>

                                        <div class="quick-add-v27">
                                            <input type="text" id="new-q-input" class="field-v27" placeholder="${t('role.q_placeholder')}">
                                            <button class="btn-add-v27" id="btn-add-q">
                                                <i data-lucide="plus"></i>
                                            </button>
                                        </div>
                                    </section>
                                `}
                            </div>
                        ` : `
                            <div class="empty-canvas">
                                <i data-lucide="layout"></i>
                                <p>${t('role.select_role')}</p>
                            </div>
                        `}
                    </main>
                </div>
            </div>

            <style>
                .role-manager-v27 { max-width: 1400px; margin: 0 auto; color: var(--text-primary); min-height: 80vh; display: flex; flex-direction: column; }
                
                /* Nav Bar */
                .role-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
                .nav-back { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; }
                .nav-back:hover { color: var(--accent); }
                .btn-minimal { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 12px; border: 1px solid var(--border-color); font-size: 0.85rem; font-weight: 600; cursor: pointer; background: white; }
                .btn-minimal:hover { border-color: var(--accent); background: var(--bg-primary); }

                /* Layout */
                .role-content { display: flex; gap: 4rem; flex: 1; }
                .mode-full .role-content { display: block; }
                
                /* Sidebar */
                .role-sidebar-v27 { width: 300px; flex-shrink: 0; }
                .group-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); margin-bottom: 1.5rem; }
                .role-list-v27 { display: flex; flex-direction: column; gap: 0.75rem; }
                .role-pivot { 
                    padding: 1.25rem; border-radius: 16px; background: white; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s ease;
                    display: flex; flex-direction: column; gap: 0.25rem;
                }
                .role-pivot:hover { transform: translateX(5px); border-color: var(--accent-light); }
                .role-pivot.is-active { border-color: var(--accent); box-shadow: 0 10px 30px rgba(197, 160, 89, 0.08); }
                .role-pivot .title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
                .role-pivot .meta { font-size: 0.75rem; color: var(--text-secondary); }
                .role-pivot.is-active .title { color: var(--accent); }

                /* Main Canvas */
                .role-main-v27 { flex: 1; min-width: 0; }
                .role-canvas { background: white; border-radius: 24px; border: 1px solid var(--border-color); padding: 3rem; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
                .mode-full .role-canvas { padding: 4rem; border: none; background: transparent; box-shadow: none; }

                .role-title-minimal { width: 100%; border: none; font-size: 2.4rem; font-weight: 800; color: var(--text-primary); outline: none; background: transparent; }
                .canvas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; gap: 2rem; }
                .btn-save-minimal { font-size: 0.85rem; font-weight: 700; color: var(--accent); text-transform: uppercase; cursor: pointer; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--accent); }
                .btn-save-minimal:hover { background: var(--accent); color: white; }

                .canvas-label { font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); }
                .btn-link { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: var(--accent); cursor: pointer; }
                .btn-link:hover { text-decoration: underline; }

                .q-preview-stack { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
                .q-mini-row { display: flex; gap: 1rem; align-items: flex-start; padding: 1.25rem; background: var(--bg-primary); border-radius: 16px; border: 1px solid rgba(0,0,0,0.02); }
                .q-bullet { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); margin-top: 0.6rem; flex-shrink: 0; }
                .q-text { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); line-height: 1.5; }

                .quick-add-v27 { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 16px; border: 1px dashed var(--border-color); }
                .field-v27 { flex: 1; border: none; background: transparent; padding: 1rem; font-size: 0.95rem; outline: none; font-weight: 600; }
                .btn-add-v27 { width: 48px; height: 48px; border-radius: 12px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }

                /* Full View Elements */
                .canvas-header-full { display: flex; justify-content: space-between; items-center; margin-bottom: 4rem; }
                .canvas-title { font-size: 3rem; font-weight: 800; color: var(--text-primary); }
                .btn-action-minimal { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; }
                .btn-action-minimal.danger:hover { color: var(--danger); }

                .canvas-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 5rem; padding: 2.5rem; background: white; border-radius: 24px; border: 1px solid var(--border-color); }
                .tool-section { display: flex; flex-direction: column; gap: 1rem; }
                .tool-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em; }

                .premium-input-group { display: flex; gap: 0.5rem; background: var(--bg-primary); padding: 0.5rem; border-radius: 16px; border: 1px solid var(--border-color); }
                .premium-field { flex: 1; border: none; background: transparent; padding: 0.75rem 1rem; font-size: 0.95rem; outline: none; font-weight: 600; }
                .btn-premium-action { width: 42px; height: 42px; border-radius: 10px; background: var(--text-primary); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }

                .jd-marker { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; border-radius: 14px; background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent); font-size: 0.85rem; font-weight: 700; }
                .jd-clear { border: none; background: transparent; color: var(--accent); cursor: pointer; margin-left: 0.5rem; }
                .btn-ai-v27 { padding: 0.75rem 1.5rem; border-radius: 14px; background: var(--accent-gradient); color: white; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; box-shadow: var(--shadow-glow); }
                .premium-upload { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border: 2px dashed var(--border-color); border-radius: 16px; color: var(--text-secondary); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .premium-upload:hover { border-color: var(--accent); color: var(--accent); }

                /* Full Question Cards */
                .list-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; }
                .list-header h3 { font-size: 1.5rem; font-weight: 800; }
                .count-pill { padding: 0.25rem 0.75rem; background: var(--bg-primary); border-radius: 8px; font-size: 0.85rem; font-weight: 800; border: 1px solid var(--border-color); }
                
                .q-grid-v27 { display: grid; gap: 2rem; }
                .q-card-v27 { display: flex; gap: 1.5rem; padding: 2rem; border-radius: 20px; background: white; border: 1px solid var(--border-color); transition: all 0.3s ease; }
                .q-card-v27:hover { border-color: var(--accent-light); box-shadow: 0 10px 40px rgba(0,0,0,0.03); }
                .q-num { width: 40px; height: 40px; border-radius: 12px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 800; color: var(--text-secondary); flex-shrink: 0; }
                .q-main { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }
                .q-edit-area { width: 100%; border: none; font-size: 1.1rem; font-weight: 500; line-height: 1.6; color: var(--text-primary); outline: none; background: transparent; resize: none; min-height: 60px; }
                .q-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem; }
                .q-type-selector { display: flex; gap: 0.5rem; background: var(--bg-primary); padding: 0.25rem; border-radius: 10px; }
                .type-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; }
                .type-btn.active { background: white; color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .q-trash { font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; }
                .q-trash:hover { color: var(--danger); }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; display: inline-block; }
            </style>
        `;

        lucide.createIcons();
        attachEvents(activeRole, isFullView);
    };

    const attachEvents = (activeRole, isFullView) => {
        container.querySelectorAll('.role-pivot').forEach(el => {
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

            container.querySelectorAll('.q-edit-area').forEach(el => {
                el.addEventListener('change', (e) => {
                    window.appStore.updateQuestion(activeRole.id, e.currentTarget.dataset.qid, e.currentTarget.value.trim());
                });
            });

            container.querySelectorAll('.type-btn').forEach(el => {
                el.addEventListener('click', (e) => {
                    const qId = e.currentTarget.dataset.qid;
                    const type = e.currentTarget.dataset.type;
                    window.appStore.updateQuestionType(activeRole.id, qId, type);
                    render();
                });
            });

            container.querySelectorAll('.q-trash').forEach(el => {
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
