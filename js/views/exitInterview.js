/**
 * Exit Interview — simple single-page form for departing employees.
 * URL params: ?exit=1&name=...&issuedBy=...&issuedByName=...
 */
import { t, getLang } from '../services/translations.js?v=20';

export function renderExitInterview(container, params = {}) {
    const { employeeName, issuedBy, issuedByName } = params;

    let isFinished = false;
    let startTime  = Date.now();

    // Check if already completed
    const existingInterviews = window.appStore.getInterviews();
    const alreadyCompleted = existingInterviews.some(i => 
        i.type === 'exit' && 
        i.candidateName.toLowerCase() === (employeeName || '').toLowerCase() &&
        i.issuedBy === issuedBy
    );

    if (alreadyCompleted) {
        container.innerHTML = `
            <div class="card" style="max-width: 560px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
                <div style="width: 4rem; height: 4rem; background: rgba(59, 130, 246, 0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i data-lucide="check-circle" style="width: 2rem; height: 2rem;"></i>
                </div>
                <h2 style="font-size: 1.75rem; font-weight: 600;" class="mb-2">${t('exit.already_done')}</h2>
                <p style="color: var(--text-secondary);">${t('exit.already_done_msg')}</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const renderForm = () => {
        container.innerHTML = `
            <div style="max-width: 640px; margin: 0 auto; padding-top: 2rem;">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="width: 4rem; height: 4rem; background: rgba(245,158,11,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid var(--warning);">
                        <i data-lucide="log-out" style="width: 2rem; height: 2rem; color: var(--warning);"></i>
                    </div>
                    <h2 style="font-size: 1.75rem; font-weight: 600;">${t('exit.title')}</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${employeeName ? (getLang() === 'hu' ? `Köszönjük, <strong style="color: var(--text-primary);">${employeeName}</strong>!` : `Thank you, <strong style="color: var(--text-primary);">${employeeName}</strong>!`) : ''} ${t('exit.subtitle')}</p>
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

                    <div class="form-group">
                        <label class="form-label">${t('exit.dept_label')}</label>
                        <input type="text" id="exit-dept" class="form-input" placeholder="pl. Fejlesztés">
                    </div>

                    <div class="form-group">
                        <label class="form-label">${t('exit.reason_label')}</label>
                        <select id="exit-reason" class="form-input">
                            <option value="">${t('exit.select_placeholder')}</option>
                            <option value="better_offer">${getLang() === 'hu' ? 'Jobb ajánlatot kaptam máshol' : 'Better offer elsewhere'}</option>
                            <option value="career_growth">${getLang() === 'hu' ? 'Karrier / fejlődési lehetőség' : 'Career growth'}</option>
                            <option value="management">${getLang() === 'hu' ? 'Kollégiális / vezetői problémák' : 'Management issues'}</option>
                            <option value="salary">${getLang() === 'hu' ? 'Bérezés' : 'Salary'}</option>
                            <option value="worklife">${getLang() === 'hu' ? 'Munka–magánélet egyensúly' : 'Work-life balance'}</option>
                            <option value="relocation">${getLang() === 'hu' ? 'Költözés / személyes okok' : 'Relocation'}</option>
                            <option value="other">${getLang() === 'hu' ? 'Egyéb' : 'Other'}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">${t('exit.liked_label')}</label>
                        <textarea id="exit-liked" class="form-textarea" placeholder="..." style="min-height: 100px;"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">${t('exit.improve_label')}</label>
                        <textarea id="exit-improve" class="form-textarea" placeholder="..." style="min-height: 100px;"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">${t('exit.recommend_label')}</label>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="yes"> ${getLang() === 'hu' ? 'Igen' : 'Yes'}</label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="maybe"> ${getLang() === 'hu' ? 'Talán' : 'Maybe'}</label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="no"> ${getLang() === 'hu' ? 'Nem' : 'No'}</label>
                        </div>
                    </div>

                    <div class="form-group mb-0">
                        <label class="form-label">${t('exit.other_label')}</label>
                        <textarea id="exit-other" class="form-textarea" placeholder="..." style="min-height: 80px;"></textarea>
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
            const email  = document.getElementById('exit-email').value.trim();
            const name   = document.getElementById('exit-name').value.trim();
            const dept   = document.getElementById('exit-dept').value.trim();
            const reason = document.getElementById('exit-reason').value;
            const liked  = document.getElementById('exit-liked').value.trim();
            const improve  = document.getElementById('exit-improve').value.trim();
            const recVal = document.querySelector('input[name="exit-rec"]:checked');
            const recommend = recVal ? recVal.value : '';
            const other  = document.getElementById('exit-other').value.trim();

            if (!email || !email.includes('@')) { alert(getLang() === 'hu' ? 'Kérlek adj meg egy érvényes email címet!' : 'Please enter a valid email!'); return; }
            if (!name) { alert(getLang() === 'hu' ? 'Kérlek add meg a neved!' : 'Please enter your name!'); return; }
            if (!reason) { alert(getLang() === 'hu' ? 'Kérlek válaszd ki az elsődleges kilépési okot!' : 'Please select a reason!'); return; }
            if (!liked)  { alert(getLang() === 'hu' ? 'Kérlek töltsd ki, mi tetszett leginkább!' : 'Please fill out what you liked!'); return; }

            // Check if already completed
            const existingInterviews = window.appStore.getInterviews();
            const alreadyCompleted = existingInterviews.some(i => 
                i.type === 'exit' && 
                (i.candidateEmail || '').toLowerCase() === email.toLowerCase()
            );

            if (alreadyCompleted) {
                alert('Ezzel az email címmel már kitöltötted a kilépő kérdőívet!');
                return;
            }

            const durationSecs = Math.floor((Date.now() - startTime) / 1000);

            window.appStore.saveInterview({
                type:          'exit',
                candidateEmail: email,
                candidateName: name,
                date:          new Date().toISOString(),
                duration:      durationSecs,
                roleId:        null,
                isSelfAssessment: true,
                issuedBy:      issuedBy || '',
                issuedByName:  issuedByName || '',
                answers:       {},
                exitData: { dept, reason, liked, improve, recommend, other }
            });

            renderThankYou(name);
            
        });
    };

    const renderThankYou = (name) => {
        const subject = encodeURIComponent(`Új kilépő interjú: ${name}`);
        const body = encodeURIComponent(`Kedves HR!\n\n${name} sikeresen kitöltötte a kilépő interjút.\nAz eredmények már elérhetőek a HR Interjú Kezelő rendszerben.\n\nÜdvözlettel,\nA Rendszer`);
        container.innerHTML = `
            <div class="card" style="max-width: 560px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
                <div style="width: 4rem; height: 4rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i data-lucide="heart" style="width: 2rem; height: 2rem;"></i>
                </div>
                <h2 style="font-size: 2rem; font-weight: 600;" class="mb-2">${t('exit.thank_you')}${name ? `, ${name}!` : '!'}</h2>
                <p style="color: var(--text-secondary); font-size: 1.125rem;">${t('exit.success_msg')}</p>
                <div class="mt-6">
                    <a href="mailto:?subject=${subject}&body=${body}" class="btn btn-secondary" style="font-size: 0.9rem;">
                        <i data-lucide="mail"></i> ${t('exit.notify_hr')}
                    </a>
                </div>
            </div>
        `;
        lucide.createIcons();
    };

    renderForm();
}
