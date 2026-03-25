export function renderActiveInterview(container, params = {}) {
    const { roleId, candidateName, date } = params;
    const role = window.appStore.getRoleById(roleId);

    if (!role || role.questions.length === 0) {
        container.innerHTML = `<p>Hiba a munkakör betöltésekor.</p><button onclick="window.navigateTo('dashboard')">Vissza</button>`;
        return;
    }

    let currentIndex = 0;
    const totalQuestions = role.questions.length;
    let startTime = Date.now();
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
        const question = role.questions[currentIndex];
        const progressPercent = ((currentIndex) / totalQuestions) * 100;
        
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding-top: 1rem;">
                
                <!-- Header Info & Timer -->
                <div class="card mb-6 flex justify-between items-center" style="padding: 1rem 1.5rem;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 600;">${candidateName}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">Munkakör: ${role.title}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Eltelt idő</div>
                        <div id="interview-timer" style="font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; transition: color 0.5s;">${formatTime(secondsElapsed)}</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="mb-6">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <span>Kérdés ${currentIndex + 1} / ${totalQuestions}</span>
                        <span>${Math.round(progressPercent)}% elkészült</span>
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
                            <i data-lucide="check-circle-2"></i> Igen
                        </button>
                        <button class="btn btn-secondary ans-btn ${answers[question.id].value === 'no' ? 'active-no' : ''}" data-val="no" style="flex: 1; padding: 1rem; font-size: 1rem;">
                            <i data-lucide="x-circle"></i> Nem
                        </button>
                        <button class="btn btn-secondary ans-btn ${answers[question.id].value === 'na' ? 'active-na' : ''}" data-val="na" style="flex: 1; padding: 1rem; font-size: 1rem;">
                            <i data-lucide="help-circle"></i> N/A
                        </button>
                    </div>

                    <div class="form-group mb-0">
                        <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="message-square" style="width: 1rem; height: 1rem;"></i> Megjegyzés (opcionális)</label>
                        <textarea id="q-note" class="form-textarea" placeholder="Írd ide a jelölt válaszának részleteit...">${answers[question.id].note}</textarea>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex justify-between items-center">
                    <button class="btn btn-secondary" id="btn-prev" ${currentIndex === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        <i data-lucide="chevron-left"></i> Előző
                    </button>
                    
                    ${currentIndex === totalQuestions - 1 ? `
                        <button class="btn btn-primary" id="btn-finish" style="padding-left: 2rem; padding-right: 2rem;">
                            <i data-lucide="flag"></i> Interjú lezárása
                        </button>
                    ` : `
                        <button class="btn btn-primary" id="btn-next">
                            Következő <i data-lucide="chevron-right"></i>
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
                date,
                duration: secondsElapsed,
                answers
            });
            
            // Navigate to dashboard
            window.navigateTo('dashboard');
        });
    };

    // Initialize
    startTimer();
    render();
}
