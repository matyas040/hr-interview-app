import { t, getLang } from '../services/translations.js?v=37';

export function renderCandidateInterview(container, params = {}) {
    const { roleId, candidateName, issuedBy, issuedByName } = params;
    const role = window.appStore.getRoleById(roleId);

    if (!role || role.questions.length === 0) {
        container.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 4rem auto; text-align: center;">
                <i data-lucide="alert-circle" style="width: 3rem; height: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h2 style="font-size: 1.5rem; font-weight: 600;" class="mb-2">${getLang()==='hu'?'Érvénytelen link':'Invalid link'}</h2>
                <p style="color: var(--text-secondary);">${getLang()==='hu'?'A megadott interjú link nem található vagy a munkakörhöz nem tartoznak kérdések.':'The provided interview link was not found or the role has no questions.'}</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Phase: 'intro' | 'pdf' | 'questions' | 'done'
    let phase = 'intro';
    let personalData = { birthDate: '', address: '', email: '' };

    let currentIndex = 0;
    const totalQuestions = role.questions.length;
    let startTime = null;
    
    let answers = {};
    role.questions.forEach(q => { answers[q.id] = { value: null, note: '', text: '' }; });

    const render = () => {
        container.innerHTML = '';
        window.scrollTo(0, 0);

        if (phase === 'done') {
            const subject = encodeURIComponent(`Új interjú kitöltés: ${candidateName} - ${role.title}`);
            const body = encodeURIComponent(`Kedves HR!\n\n${candidateName} sikeresen kitöltötte a(z) ${role.title} munkakörhöz tartozó kérdéssort.\nAz eredmények már elérhetőek a HR Interjú Kezelő rendszerben.\n\nÜdvözlettel,\nA Rendszer`);
            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
                    <div style="width: 4rem; height: 4rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                        <i data-lucide="check" style="width: 2rem; height: 2rem;"></i>
                    </div>
                    <h2 style="font-size: 2rem; font-weight: 600;" class="mb-2">${t('iv.completed')} ${candidateName}!</h2>
                    <p style="color: var(--text-secondary); font-size: 1.125rem;">${t('iv.completed_msg')}</p>
                    <div class="mt-6">
                        <a href="mailto:?subject=${subject}&body=${body}" class="btn btn-secondary" style="font-size: 0.9rem;">
                            <i data-lucide="mail"></i> ${t('exit.notify_hr')}
                        </a>
                    </div>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        if (phase === 'intro') {
            container.innerHTML = `
                <div style="max-width: 640px; margin: 0 auto; padding-top: 2rem;">
                    <div style="text-align: center; margin-bottom: 2.5rem;">
                        <div style="width: 5rem; height: 5rem; background: var(--accent-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: var(--shadow-glow); border: 4px solid var(--bg-secondary);">
                            <i data-lucide="clipboard-list" style="width: 2.5rem; height: 2.5rem; color: white;"></i>
                        </div>
                        <h2 style="font-size: 2.25rem; font-weight: 700; color: var(--text-primary);">${t('iv.welcome')} ${candidateName}!</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 1.125rem;">${t('admin.table.role').split(' /')[0]}: <strong style="color: var(--accent);">${role.title}</strong></p>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">${totalQuestions} ${t('setup.questions_count')} ${role.pdfName ? ` · 📎 ${t('role.attachment_title')}` : ''}</p>
                    </div>

                    <div class="card" style="padding: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user" style="width: 1.25rem; color: var(--accent);"></i> ${getLang()==='hu'?'Személyes adatok':'Personal Info'}
                        </h3>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">${getLang()==='hu'?'Kérlek add meg az alábbi adatokat':'Please provide the following details'} <strong>${getLang()==='hu'?'a kérdőív megkezdése előtt':'before starting the questionnaire'}</strong>.</p>

                        <div class="form-group">
                            <label class="form-label">${t('exit.email_label')}</label>
                            <input type="email" id="cand-email" class="form-input" placeholder="pl. pelda@email.com" value="${personalData.email}">
                        </div>

                        <div class="form-group">
                            <label class="form-label">${getLang()==='hu'?'Születési idő':'Birth date'}</label>
                            <input type="date" id="cand-birthdate" class="form-input" max="${new Date().toISOString().slice(0, 10)}" value="${personalData.birthDate}">
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label">${getLang()==='hu'?'Lakcím':'Address'}</label>
                            <input type="text" id="cand-address" class="form-input" placeholder="pl. 1051 Budapest, Fő utca 1." value="${personalData.address}">
                        </div>

                        <div class="form-group mb-0">
                            <label class="form-label">${getLang() === 'hu' ? 'Önéletrajz (CV) feltöltése (opcionális)' : 'Upload CV (optional)'}</label>
                            <div id="cv-upload-container" class="mt-2">
                                <input type="file" id="cand-cv-file" style="display: none;" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                                <button class="btn btn-secondary w-full" id="btn-trigger-cv" style="width: 100%; border-style: dashed; border-width: 2px;">
                                    <i data-lucide="upload"></i> ${getLang() === 'hu' ? 'Fájl választása' : 'Select File'}
                                </button>
                                <div id="cand-cv-preview" class="mt-3" style="display: none; font-size: 0.85rem; padding: 0.75rem; background: var(--accent-soft); border-radius: 8px; border: 1px solid var(--accent);">
                                    <div class="flex justify-between items-center">
                                        <span id="cand-cv-filename" style="font-weight: 600;"></span>
                                        <button id="btn-remove-cv" style="color: var(--danger);"><i data-lucide="x" style="width: 14px;"></i></button>
                                    </div>
                                    <div id="cand-cv-ai-status" class="mt-1" style="color: var(--text-secondary); font-style: italic;"></div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end">
                            <button class="btn btn-primary" id="btn-start-questions" style="padding: 0.75rem 2rem; font-size: 1rem;">
                                ${role.pdfBase64 ? (getLang()==='hu'?'Tovább a dokumentumhoz':'Continue to document') : (getLang()==='hu'?'Tovább a kérdésekhez':'Continue to questions')} <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();

            let uploadedCv = { base64: null, mimeType: null, fileName: null, analysis: null };

            const cvInput = document.getElementById('cand-cv-file');
            const triggerBtn = document.getElementById('btn-trigger-cv');
            const previewDiv = document.getElementById('cand-cv-preview');
            const filenameSpan = document.getElementById('cand-cv-filename');
            const aiStatus = document.getElementById('cand-cv-ai-status');

            if (triggerBtn) {
                triggerBtn.addEventListener('click', () => cvInput.click());
                cvInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    uploadedCv.fileName = file.name;
                    uploadedCv.mimeType = file.type;
                    filenameSpan.innerText = file.name;
                    previewDiv.style.display = 'block';
                    triggerBtn.style.display = 'none';
                    aiStatus.innerText = getLang() === 'hu' ? '⏳ Elemzés...' : '⏳ Analyzing...';

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64 = event.target.result;
                        uploadedCv.base64 = base64;
                        try {
                            const { analyzeCv } = await import('../services/aiService.js?v=61');
                            const analysis = await analyzeCv(base64, file.type, role.title);
                            uploadedCv.analysis = analysis;
                            aiStatus.innerText = `✨ AI: ${analysis.substring(0, 80)}...`;
                        } catch (err) {
                            aiStatus.innerText = '❌ AI error';
                        }
                    };
                    reader.readAsDataURL(file);
                });
                document.getElementById('btn-remove-cv')?.addEventListener('click', () => {
                    uploadedCv = { base64: null, mimeType: null, fileName: null, analysis: null };
                    previewDiv.style.display = 'none';
                    triggerBtn.style.display = 'block';
                    cvInput.value = '';
                });
            }


            document.getElementById('btn-start-questions')?.addEventListener('click', () => {
                const ce = document.getElementById('cand-email').value.trim();
                const bd = document.getElementById('cand-birthdate').value;
                const ad = document.getElementById('cand-address').value.trim();

                if (!ce || !ce.includes('@')) { alert(getLang()==='hu'?'Kérlek adj meg egy érvényes email címet!':'Please enter a valid email!'); return; }
                if (!bd) { alert(getLang()==='hu'?'Kérlek add meg a születési dátumod!':'Please enter your birth date!'); return; }
                if (!ad) { alert(getLang()==='hu'?'Kérlek add meg a lakcímed!':'Please enter your address!'); return; }

                // Check for duplicate submission based on email and role
                const existingInterviews = window.appStore.getInterviews();
                const alreadyCompleted = existingInterviews.some(i => 
                    i.type === 'candidate' && 
                    i.roleId === roleId && 
                    (i.candidateEmail || '').toLowerCase() === ce.toLowerCase()
                );
                if (alreadyCompleted) {
                    alert(getLang()==='hu'?'Ezzel az email címmel már kitöltötted ezt az interjút!':'You have already completed this interview with this email address!');
                    return;
                }

                personalData.email     = ce;
                personalData.birthDate = bd;
                personalData.address   = ad;

                if (role.pdfBase64) {
                    phase = 'pdf';
                } else {
                    startTime = Date.now();
                    phase = 'questions';
                }
                render();
            });
            return;
        }

        // Phase: PDF reading
        if (phase === 'pdf') {
            container.innerHTML = `
                <div style="max-width: 900px; margin: 0 auto; padding-top: 2rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 600;">${t('iv.pdf_required')}</h2>
                            <p style="color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.875rem;">
                                <i data-lucide="file-text" style="width: 0.9rem; display: inline-block; vertical-align: middle;"></i> ${role.pdfName}
                            </p>
                        </div>
                    </div>

                    <div class="card mb-4" style="padding: 0; overflow: hidden;">
                        <iframe src="data:application/pdf;base64,${role.pdfBase64}"
                            style="width: 100%; height: 70vh; border: none; display: block;"
                            title="Olvasnivaló dokumentum">
                        </iframe>
                    </div>

                    <div class="card" style="padding: 1.25rem 1.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                            <input type="checkbox" id="pdf-read-confirm" style="width: 1.25rem; height: 1.25rem; accent-color: var(--accent);">
                            <span style="font-weight: 500;">${t('iv.pdf_confirm')}</span>
                        </label>
                        <div class="mt-4 flex justify-end">
                            <button class="btn btn-primary" id="btn-continue-after-pdf" disabled style="padding: 0.75rem 2rem; font-size: 1rem; opacity: 0.5;">
                                ${getLang()==='hu'?'Tovább a kérdésekhez':'Continue to questions'} <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();

            const confirmBox = document.getElementById('pdf-read-confirm');
            const continueBtn = document.getElementById('btn-continue-after-pdf');
            confirmBox.addEventListener('change', () => {
                continueBtn.disabled = !confirmBox.checked;
                continueBtn.style.opacity = confirmBox.checked ? '1' : '0.5';
            });
            continueBtn.addEventListener('click', () => {
                startTime = Date.now();
                phase = 'questions';
                render();
            });
            return;
        }

        // Phase: questions
        const question = role.questions[currentIndex];
        const progressPercent = (currentIndex / totalQuestions) * 100;
        
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding-top: 2rem;">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${candidateName}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">${t('admin.table.role').split(' /')[0]}: ${role.title}</p>
                </div>

                <!-- Progress Bar -->
                <div class="mb-6">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <span>${getLang()==='hu'?'Kérdés':'Question'} ${currentIndex + 1} / ${totalQuestions}</span>
                        <span>${Math.round(progressPercent)}% ${getLang()==='hu'?'kitöltve':'completed'}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${progressPercent}%; background: var(--accent); transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <!-- Question Card -->
                <div class="card mb-6" style="padding: 2.5rem;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1.5rem; font-weight: 500; line-height: 1.6; flex: 1;">${question.text}</h3>
                    </div>
                    <div class="q-input-container">
                        ${(() => {
                            const type = question.answerType || 'detailed';
                            const ans = answers[question.id];
                            
                            if (type === 'yes-no' || type === 'yes-no-reason') {
                                return `
                                    <div style="display: flex; gap: 1rem; margin-bottom: 2rem;" id="answer-buttons">
                                        <button class="btn btn-secondary ans-btn ${ans.value === 'yes' ? 'active-yes' : ''}" data-val="yes" style="flex: 1; padding: 1rem;">
                                            <i data-lucide="check-circle-2"></i> ${getLang()==='hu'?'Igen':'Yes'}
                                        </button>
                                        <button class="btn btn-secondary ans-btn ${ans.value === 'no' ? 'active-no' : ''}" data-val="no" style="flex: 1; padding: 1rem;">
                                            <i data-lucide="x-circle"></i> ${getLang()==='hu'?'Nem':'No'}
                                        </button>
                                        <button class="btn btn-secondary ans-btn ${ans.value === 'na' ? 'active-na' : ''}" data-val="na" style="flex: 1; padding: 1rem;">
                                            <i data-lucide="help-circle"></i> N/A
                                        </button>
                                    </div>
                                    ${type === 'yes-no-reason' ? `
                                        <div class="form-group mb-0">
                                            <label class="form-label">${getLang()==='hu'?'Indoklás':'Reason'}</label>
                                            <textarea id="cand-note" class="form-textarea" placeholder="${getLang()==='hu'?'Írd ide az indoklást...':'Type the reason here...'}">${ans.note || ''}</textarea>
                                        </div>
                                    ` : ''}
                                `;
                            } else if (type === 'date') {
                                return `
                                    <div class="form-group mb-0">
                                        <input type="date" id="cand-ans" class="form-input" style="font-size: 1.2rem; padding: 1rem;" value="${ans.text || ''}">
                                    </div>
                                `;
                            } else if (type === 'number') {
                                return `
                                    <div class="form-group mb-0">
                                        <input type="number" id="cand-ans" class="form-input" style="font-size: 1.2rem; padding: 1rem;" placeholder="0" value="${ans.text || ''}">
                                    </div>
                                `;
                            } else if (type === 'short') {
                                return `
                                    <div class="form-group mb-0">
                                        <input type="text" id="cand-ans" class="form-input" style="font-size: 1.1rem; padding: 1rem;" placeholder="${getLang()==='hu'?'Rövid válasz...':'Short answer...'}" value="${ans.text || ''}">
                                    </div>
                                `;
                            } else {
                                // detailed
                                return `
                                    <div class="form-group mb-0">
                                        <textarea id="cand-ans" class="form-textarea" placeholder="${getLang()==='hu'?'Részletes válasz...':'Detailed answer...'}" style="min-height: 200px; font-size: 1.05rem;">${ans.text || ''}</textarea>
                                    </div>
                                `;
                            }
                        })()}
                    </div>
                </div>

                <style>
                    .ans-btn.active-yes { background-color: rgba(16, 185, 129, 0.1); border-color: var(--success); color: var(--success); }
                    .ans-btn.active-no { background-color: rgba(239, 68, 68, 0.1); border-color: var(--danger); color: var(--danger); }
                    .ans-btn.active-na { background-color: rgba(245, 158, 11, 0.1); border-color: var(--warning); color: var(--warning); }
                </style>

                <!-- Navigation -->
                <div class="flex justify-between items-center">
                    <button class="btn btn-secondary" id="btn-prev" ${currentIndex === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        <i data-lucide="chevron-left"></i> ${t('iv.prev')}
                    </button>
                    ${currentIndex === totalQuestions - 1 ? `
                        <button class="btn btn-primary" id="btn-finish" style="padding-left: 2rem; padding-right: 2rem; font-size: 1.125rem;">
                            <i data-lucide="send"></i> ${getLang()==='hu'?'Beküldés':'Submit'}
                        </button>
                    ` : `
                        <button class="btn btn-primary" id="btn-next">
                            ${t('iv.next')} <i data-lucide="chevron-right"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
        lucide.createIcons();
        attachQuestionEvents();
    };

    const attachQuestionEvents = () => {
        const qId = role.questions[currentIndex].id;

        document.getElementById('cand-ans')?.addEventListener('change', (e) => {
            answers[qId].text = e.target.value;
        });
        
        document.getElementById('cand-note')?.addEventListener('change', (e) => {
            answers[qId].note = e.target.value;
        });

        document.querySelectorAll('.ans-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.currentTarget.dataset.val;
                answers[qId].value = val;
                const noteEl = document.getElementById('cand-note');
                if (noteEl) answers[qId].note = noteEl.value;
                const ansEl = document.getElementById('cand-ans');
                if (ansEl) answers[qId].text = ansEl.value;
                render();
            });
        });

        document.getElementById('btn-prev')?.addEventListener('click', () => {
            const ansEl = document.getElementById('cand-ans');
            if (ansEl) answers[qId].text = ansEl.value;
            const noteEl = document.getElementById('cand-note');
            if (noteEl) answers[qId].note = noteEl.value;

            if (currentIndex > 0) { currentIndex--; render(); }
        });

        document.getElementById('btn-next')?.addEventListener('click', () => {
            const ansEl = document.getElementById('cand-ans');
            if (ansEl) answers[qId].text = ansEl.value;
            const noteEl = document.getElementById('cand-note');
            if (noteEl) answers[qId].note = noteEl.value;

            if (currentIndex < totalQuestions - 1) { currentIndex++; render(); }
        });

        document.getElementById('btn-finish')?.addEventListener('click', () => {
            const ansEl = document.getElementById('cand-ans');
            if (ansEl) answers[qId].text = ansEl.value;
            const noteEl = document.getElementById('cand-note');
            if (noteEl) answers[qId].note = noteEl.value;

            const durationSecs = Math.floor((Date.now() - startTime) / 1000);
            
            window.appStore.saveInterview({
                roleId,
                candidateName,
                date: new Date().toISOString(),
                duration: durationSecs,
                answers,
                isSelfAssessment: true,
                personalData,
                issuedBy:     issuedBy     || '',
                issuedByName: issuedByName || '',
                cvText: uploadedCv.analysis,
                cvData: uploadedCv.base64 ? {
                    fileName: uploadedCv.fileName,
                    mimeType: uploadedCv.mimeType,
                    base64: uploadedCv.base64
                } : null
            });
            
            phase = 'done';
            render();
        });
    };

    render();
}


