import { t, getLang } from '../services/translations.js?v=31';

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
    role.questions.forEach(q => { answers[q.id] = { text: '' }; });

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
                        <div style="width: 4rem; height: 4rem; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 8px 24px rgba(59,130,246,0.25);">
                            <i data-lucide="clipboard-list" style="width: 2rem; height: 2rem; color: white;"></i>
                        </div>
                        <h2 style="font-size: 1.75rem; font-weight: 600;">${t('iv.welcome')} ${candidateName}!</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">${t('admin.table.role').split(' /')[0]}: <strong style="color: var(--text-primary);">${role.title}</strong></p>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">${totalQuestions} ${t('setup.questions_count')} ${role.pdfName ? ` · 📎 ${t('role.attachment_title')}` : ''}</p>
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

                        <div class="form-group mb-0">
                            <label class="form-label">${getLang()==='hu'?'Lakcím':'Address'}</label>
                            <input type="text" id="cand-address" class="form-input" placeholder="pl. 1051 Budapest, Fő utca 1." value="${personalData.address}">
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
                        ${question.answerType === 'short'
                            ? `<span style="flex-shrink: 0; background: rgba(245,158,11,0.12); color: #d97706; border: 1px solid rgba(245,158,11,0.3); border-radius: 1rem; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; white-space: nowrap; margin-top: 0.25rem;">⚡ ${getLang()==='hu'?'Rövid válasz':'Short answer'}</span>`
                            : `<span style="flex-shrink: 0; background: rgba(59,130,246,0.1); color: var(--accent); border: 1px solid rgba(59,130,246,0.25); border-radius: 1rem; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; white-space: nowrap; margin-top: 0.25rem;">📝 ${getLang()==='hu'?'Részletes válasz':'Detailed answer'}</span>`
                        }
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="edit-3" style="width: 1rem; height: 1rem;"></i> ${getLang()==='hu'?'Válaszod':'Your answer'}
                            ${question.answerType === 'short'
                                ? `<span style="font-weight: 400; color: var(--text-secondary); font-size: 0.8rem;">${getLang()==='hu'?'(1-2 mondat elegendő)':'(1-2 sentences are enough)'}</span>`
                                : `<span style="font-weight: 400; color: var(--text-secondary); font-size: 0.8rem;">${getLang()==='hu'?'(fejtsd ki részletesen)':'(explain in detail)'}</span>`
                            }
                        </label>
                        <textarea id="cand-ans" class="form-textarea"
                            placeholder="${question.answerType === 'short' ? (getLang()==='hu'?'Írj egy rövid, tömör választ...':'Write a short, concise answer...') : (getLang()==='hu'?'Kérlek írd le részletesen a tapasztalataidat, gondolataidat...':'Please describe your experiences and thoughts in detail...')}"
                            style="min-height: ${question.answerType === 'short' ? '80px' : '180px'}; font-size: 1rem;"
                        >${answers[question.id].text}</textarea>
                    </div>
                </div>

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

        document.getElementById('btn-prev')?.addEventListener('click', () => {
            answers[qId].text = document.getElementById('cand-ans').value;
            if (currentIndex > 0) { currentIndex--; render(); }
        });

        document.getElementById('btn-next')?.addEventListener('click', () => {
            answers[qId].text = document.getElementById('cand-ans').value;
            if (currentIndex < totalQuestions - 1) { currentIndex++; render(); }
        });

        document.getElementById('btn-finish')?.addEventListener('click', () => {
            answers[qId].text = document.getElementById('cand-ans').value;
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
                issuedByName: issuedByName || ''
            });
            
            phase = 'done';
            render();
            
        });
    };

    render();
}


