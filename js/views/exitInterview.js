/**
 * Exit Interview — dynamic form for departing employees.
 * Fetches questions from store.js (Firestore).
 */
import { t, getLang } from '../services/translations.js?v=32';

export function renderExitInterview(container, params = {}) {
    const { employeeName, issuedBy, issuedByName } = params;

    let isFinished = false;
    let startTime  = Date.now();

    // Check if already completed
    const existingInterviews = window.appStore.getInterviews();
    
    const renderForm = () => {
        const questions = window.appStore.getExitQuestions();

        container.innerHTML = `
            <div style="max-width: 640px; margin: 0 auto; padding-top: 2rem;">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="width: 4rem; height: 4rem; background: rgba(245,158,11,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid var(--warning);">
                        <i data-lucide="log-out" style="width: 2rem; height: 2rem; color: var(--warning);"></i>
                    </div>
                    <h2 style="font-size: 1.75rem; font-weight: 600;">${t('exit.title')}</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                        ${employeeName ? (getLang() === 'hu' ? `Köszönjük, <strong style="color: var(--text-primary);">${employeeName}</strong>!` : `Thank you, <strong style="color: var(--text-primary);">${employeeName}</strong>!`) : ''} 
                        ${t('exit.subtitle')}
                    </p>
                </div>

                <div class="card" style="padding: 2rem;">
                    <div class="form-group">
                        <label class="form-label">${t('exit.email_label')}</label>
                        <input type="email" id="exit-email" class="form-input" placeholder="pl. pelda@email.com">
                    </div>

                    <div class="form-group">
                        <label class="form-label">${t('exit.name_label')}</label>
                        <input type="text" id="exit-name" class="form-input" placeholder="pl. Kovács János" value="${employeeName || ''}">
                    </div>

                    <div id="dynamic-questions-container">
                        ${questions.map(q => renderField(q)).join('')}
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button class="btn btn-primary" id="btn-exit-submit" style="padding: 0.75rem 2rem; font-size: 1rem;">
                            <i data-lucide="send"></i> ${t('exit.submit')}
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('btn-exit-submit')?.addEventListener('click', () => {
            const email = document.getElementById('exit-email').value.trim();
            const name  = document.getElementById('exit-name').value.trim();

            if (!email || !email.includes('@')) { 
                alert(getLang() === 'hu' ? 'Kérlek adj meg egy érvényes email címet!' : 'Please enter a valid email!'); 
                return; 
            }
            if (!name) { 
                alert(getLang() === 'hu' ? 'Kérlek add meg a neved!' : 'Please enter your name!'); 
                return; 
            }

            // Collect dynamic answers
            const exitData = {};
            let allFilled = true;
            questions.forEach(q => {
                let val = '';
                if (q.type === 'text') {
                    val = document.getElementById(`exq-${q.id}`).value.trim();
                } else if (q.type === 'select') {
                    val = document.getElementById(`exq-${q.id}`).value;
                } else if (q.type === 'radio') {
                    const checked = document.querySelector(`input[name="exq-${q.id}"]:checked`);
                    val = checked ? checked.value : '';
                }
                
                if (!val) allFilled = false;
                exitData[q.text] = val;
            });

            if (!allFilled) {
                if (!confirm(getLang() === 'hu' ? 'Nem minden kérdést válaszoltál meg. Biztosan elküldöd?' : 'Not all questions are answered. Send anyway?')) {
                    return;
                }
            }

            // Check if already completed
            const alreadyCompleted = window.appStore.getInterviews().some(i => 
                i.type === 'exit' && (i.candidateEmail || '').toLowerCase() === email.toLowerCase()
            );

            if (alreadyCompleted) {
                alert(getLang() === 'hu' ? 'Ezzel az email címmel már kitöltötted a kérdőívet!' : 'Already filled with this email!');
                return;
            }

            const durationSecs = Math.floor((Date.now() - startTime) / 1000);

            window.appStore.saveInterview({
                type: 'exit',
                candidateEmail: email,
                candidateName: name,
                date: new Date().toISOString(),
                duration: durationSecs,
                roleId: null,
                isSelfAssessment: true,
                issuedBy: issuedBy || '',
                issuedByName: issuedByName || '',
                answers: {},
                exitData: exitData
            });

            renderThankYou(name);
        });
    };

    const renderField = (q) => {
        const label = `<label class="form-label">${q.text}</label>`;
        if (q.type === 'text') {
            return `<div class="form-group">${label}<textarea id="exq-${q.id}" class="form-textarea" style="min-height:80px;"></textarea></div>`;
        }
        if (q.type === 'select') {
            const opts = (q.options || '').split(',').map(o => o.trim());
            return `<div class="form-group">${label}
                <select id="exq-${q.id}" class="form-input">
                    <option value="">${t('exit.select_placeholder')}</option>
                    ${opts.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>`;
        }
        if (q.type === 'radio') {
            const opts = (q.options || '').split(',').map(o => o.trim());
            return `<div class="form-group">${label}
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${opts.map(o => `
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="exq-${q.id}" value="${o}"> ${o}
                        </label>
                    `).join('')}
                </div>
            </div>`;
        }
        return '';
    };

    const renderThankYou = (name) => {
        container.innerHTML = `
            <div class="card" style="max-width: 560px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
                <div style="width: 4rem; height: 4rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i data-lucide="heart" style="width: 2rem; height: 2rem;"></i>
                </div>
                <h2 style="font-size: 2rem; font-weight: 600;" class="mb-2">${t('exit.thank_you')}${name ? `, ${name}!` : '!'}</h2>
                <p style="color: var(--text-secondary); font-size: 1.125rem;">${t('exit.success_msg')}</p>
            </div>
        `;
        lucide.createIcons();
    };

    renderForm();
}
