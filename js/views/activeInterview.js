import { t } from '../services/translations.js?v=31';

export function renderActiveInterview(container, params = {}) {
    const { roleId, candidateName, date } = params;
    const role = window.appStore.getRoleById(roleId);

    if (!role || role.questions.length === 0) {
        container.innerHTML = `<p>${t('eval.error.no_role')}</p><button onclick="window.navigateTo('dashboard')">${t('common.back')}</button>`;
        return;
    }

    let phase = 'intro';
    let personalData = { email: '', birthDate: '', address: '' };

    let currentIndex = 0;
    const totalQuestions = role.questions.length;
    let startTime = null;
    let timerInterval = null;
    let secondsElapsed = 0;
    
    // answers format: { qId: { value: 'yes'|'no'|'na', note: '' } }
    let answers = {};
    role.questions.forEach(q => {
        answers[q.id] = { value: null, note: '' };
    });

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const updateTimerUI = () => {
        const timerEl = document.getElementById('interview-timer');
        if (timerEl) {
            timerEl.innerText = formatTime(secondsElapsed);
            
            // Visual pulse for timer
            if (secondsElapsed > 0) {
                timerEl.style.color = secondsElapsed % 2 === 0 ? 'var(--text-primary)' : 'var(--accent)';
            }
        }
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerUI();
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval) clearInterval(timerInterval);
    };

    const render = () => {
        container.innerHTML = '';
        window.scrollTo(0, 0);

        if (phase === 'intro') {
            container.innerHTML = `
                <div style="max-width: 640px; margin: 0 auto; padding-top: 2rem;">
                    <div style="text-align: center; margin-bottom: 2.5rem;">
                        <h2 style="font-size: 1.75rem; font-weight: 600;">${t('admin.modal.title_new')}: ${candidateName}</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">${t('admin.table.role').split(' /')[0]}: <strong style="color: var(--text-primary);">${role.title}</strong></p>
                    </div>

                    <div class="card" style="padding: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user" style="width: 1.25rem; color: var(--accent);"></i> ${t('setup.candidate_name')}
                        </h3>

                        <div class="form-group">
                            <label class="form-label">${t('setup.candidate_email')} *</label>
                            <input type="email" id="active-email" class="form-input" placeholder="pl. pelda@email.com" value="${personalData.email}">
                        </div>

                        <div class="form-group">
                            <label class="form-label">${getLang()==='hu'?'Születési idő':'Birth date'}</label>
                            <input type="date" id="active-birthdate" class="form-input" max="${new Date().toISOString().slice(0, 10)}" value="${personalData.birthDate}">
                        </div>

                        <div class="form-group mb-0">
                            <label class="form-label">${getLang()==='hu'?'Lakcím':'Address'}</label>
                            <input type="text" id="active-address" class="form-input" placeholder="pl. 1051 Budapest, Fő utca 1." value="${personalData.address}">
                        </div>

                        <div class="mt-6 flex justify-end">
                            <button class="btn btn-primary" id="btn-start-active" style="padding: 0.75rem 2rem; font-size: 1rem;">
                                ${getLang()==='hu'?'Tovább az interjúhoz':'Continue to interview'} <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();

            document.getElementById('btn-start-active')?.addEventListener('click', () => {
                const ce = document.getElementById('active-email').value.trim();
                const bd = document.getElementById('active-birthdate').value;
                const ad = document.getElementById('active-address').value.trim();

                if (!ce || !ce.includes('@')) { alert(getLang()==='hu'?'Kérlek adj meg egy érvényes email címet a jelölt számára!':'Please enter a valid email for the candidate!'); return; }
                if (!bd) { alert(getLang()==='hu'?'Kérlek add meg a jelölt születési dátumát!':'Please enter the candidate\'s birth date!'); return; }
                if (!ad) { alert(getLang()==='hu'?'Kérlek add meg a jelölt lakcímét!':'Please enter the candidate\'s address!'); return; }

                // Duplicate check
                const existingInterviews = window.appStore.getInterviews();
                const alreadyCompleted = existingInterviews.some(i => 
                    (i.roleId === roleId) && 
                    (i.candidateEmail || '').toLowerCase() === ce.toLowerCase()
                );
                if (alreadyCompleted) {
                    alert(getLang()==='hu'?'Ezzel az email címmel már van lezárt interjú ehhez a munkakörhöz!':'An interview with this email address already exists for this role!');
                    return;
                }

                personalData.email = ce;
                personalData.birthDate = bd;
                personalData.address = ad;

                phase = 'questions';
                startTime = Date.now();
                startTimer();
                render();
            });
            return;
        }

        const question = role.questions[currentIndex];
        const progressPercent = ((currentIndex) / totalQuestions) * 100;

        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding-top: 1rem;">
                
                <!-- Header Info & Timer -->
                <div class="card mb-6 flex justify-between items-center" style="padding: 1rem 1.5rem;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 600;">${candidateName}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">${t('admin.table.role').split(' /')[0]}: ${role.title}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${getLang()==='hu'?'Eltelt idő':'Elapsed time'}</div>
                        <div id="interview-timer" style="font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; transition: color 0.5s;">${formatTime(secondsElapsed)}</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="mb-6">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <span>${getLang()==='hu'?'Kérdés':'Question'} ${currentIndex + 1} / ${totalQuestions}</span>
                        <span>${Math.round(progressPercent)}% ${getLang()==='hu'?'elkészült':'completed'}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${progressPercent}%; background: var(--accent); transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <!-- Current Question Card -->
                <div class="card mb-6" style="padding: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 2rem; line-height: 1.6;">${question.text}</h3>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 2rem;" id="answer-buttons">
                        <button class="btn btn-secondary ans-btn ${answers[question.id].value === 'yes' ? 'active-yes' : ''}" data-val="yes" style="flex: 1; padding: 1rem; font-size: 1rem;">
                            <i data-lucide="check-circle-2"></i> ${getLang()==='hu'?'Igen':'Yes'}
                        </button>
                        <button class="btn btn-secondary ans-btn ${answers[question.id].value === 'no' ? 'active-no' : ''}" data-val="no" style="flex: 1; padding: 1rem; font-size: 1rem;">
                            <i data-lucide="x-circle"></i> ${getLang()==='hu'?'Nem':'No'}
                        </button>
                        <button class="btn btn-secondary ans-btn ${answers[question.id].value === 'na' ? 'active-na' : ''}" data-val="na" style="flex: 1; padding: 1rem; font-size: 1rem;">
                            <i data-lucide="help-circle"></i> N/A
                        </button>
                    </div>

                    <div class="form-group mb-0">
                        <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="message-square" style="width: 1rem; height: 1rem;"></i> ${t('eval.hr_note')} ${getLang()==='hu'?'(opcionális)':'(optional)'}</label>
                        <textarea id="q-note" class="form-textarea" placeholder="${getLang()==='hu'?'Írd ide a jelölt válaszának részleteit...':'Write details of the candidate\'s answer here...'}">${answers[question.id].note}</textarea>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex justify-between items-center">
                    <button class="btn btn-secondary" id="btn-prev" ${currentIndex === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        <i data-lucide="chevron-left"></i> ${t('iv.prev')}
                    </button>
                    
                    ${currentIndex === totalQuestions - 1 ? `
                        <button class="btn btn-primary" id="btn-finish" style="padding-left: 2rem; padding-right: 2rem;">
                            <i data-lucide="flag"></i> ${getLang()==='hu'?'Interjú lezárása':'Finish Interview'}
                        </button>
                    ` : `
                        <button class="btn btn-primary" id="btn-next">
                            ${t('iv.next')} <i data-lucide="chevron-right"></i>
                        </button>
                    `}
                </div>
            </div>
            
            <style>
                .ans-btn.active-yes { background-color: rgba(16, 185, 129, 0.1); border-color: var(--success); color: var(--success); }
                .ans-btn.active-no { background-color: rgba(239, 68, 68, 0.1); border-color: var(--danger); color: var(--danger); }
                .ans-btn.active-na { background-color: rgba(245, 158, 11, 0.1); border-color: var(--warning); color: var(--warning); }
            </style>
        `;

        lucide.createIcons();
        attachEvents();
    };

    const attachEvents = () => {
        const qId = role.questions[currentIndex].id;

        // Save Note on blur or change
        const noteEl = document.getElementById('q-note');
        if(noteEl) {
            noteEl.addEventListener('change', (e) => {
                answers[qId].note = e.target.value;
            });
        }

        // Answer buttons
        document.querySelectorAll('.ans-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.currentTarget.dataset.val;
                answers[qId].value = val;
                answers[qId].note = document.getElementById('q-note').value; // Save note before re-render
                render(); // Quick re-render to update selected button state
            });
        });

        // Prev
        document.getElementById('btn-prev')?.addEventListener('click', () => {
            answers[qId].note = document.getElementById('q-note').value;
            if (currentIndex > 0) {
                currentIndex--;
                render();
            }
        });

        // Next
        document.getElementById('btn-next')?.addEventListener('click', () => {
            answers[qId].note = document.getElementById('q-note').value;
            if (currentIndex < totalQuestions - 1) {
                currentIndex++;
                render();
            }
        });

        // Finish
        document.getElementById('btn-finish')?.addEventListener('click', () => {
            answers[qId].note = document.getElementById('q-note').value; // save last
            stopTimer();
            
            // Save to store
            window.appStore.saveInterview({
                roleId,
                candidateName,
                candidateEmail: personalData.email,
                date,
                duration: secondsElapsed,
                personalData,
                answers,
                isSelfAssessment: false,
                issuedBy: window.appAuth.getUser().id || '',
                issuedByName: window.appAuth.getUser().displayName || ''
            });
            
            // Navigate to dashboard
            window.navigateTo('dashboard');
        });
    };

    // Initialize
    render();
}
