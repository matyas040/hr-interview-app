/**
 * Exit Interview — simple single-page form for departing employees.
 * URL params: ?exit=1&name=...&issuedBy=...&issuedByName=...
 */
export function renderExitInterview(container, params = {}) {
    const { employeeName, issuedBy, issuedByName } = params;

    let isFinished = false;
    let startTime  = Date.now();

    const renderForm = () => {
        container.innerHTML = `
            <div style="max-width: 640px; margin: 0 auto; padding-top: 2rem;">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="width: 4rem; height: 4rem; background: rgba(245,158,11,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid var(--warning);">
                        <i data-lucide="log-out" style="width: 2rem; height: 2rem; color: var(--warning);"></i>
                    </div>
                    <h2 style="font-size: 1.75rem; font-weight: 600;">Kilépő kérdőív</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${employeeName ? `Köszönjük, <strong style="color: var(--text-primary);">${employeeName}</strong>!` : ''} Kérjük töltsd ki az alábbi kérdőívet — segítségeddel jobbá tehetjük a csapatunkat.</p>
                </div>

                <div class="card" style="padding: 2rem;">

                    <div class="form-group">
                        <label class="form-label">Teljes neved *</label>
                        <input type="text" id="exit-name" class="form-input" placeholder="pl. Kovács János" value="${employeeName || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Osztály / munkakör</label>
                        <input type="text" id="exit-dept" class="form-input" placeholder="pl. Fejlesztés">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Az elsődleges ok, amiért elhagyod a céget *</label>
                        <select id="exit-reason" class="form-input">
                            <option value="">— Válassz —</option>
                            <option value="better_offer">Jobb ajánlatot kaptam máshol</option>
                            <option value="career_growth">Karrier / fejlődési lehetőség</option>
                            <option value="management">Kollégiális / vezetői problémák</option>
                            <option value="salary">Bérezés</option>
                            <option value="worklife">Munka–magánélet egyensúly</option>
                            <option value="relocation">Költözés / személyes okok</option>
                            <option value="other">Egyéb</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mi tetszett leginkább a munkádban? *</label>
                        <textarea id="exit-liked" class="form-textarea" placeholder="..." style="min-height: 100px;"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mi változhatna jobbra a vállalatnál?</label>
                        <textarea id="exit-improve" class="form-textarea" placeholder="..." style="min-height: 100px;"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Ajánlanád-e ismerőseidnek a céget munkahelyként?</label>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="yes"> Igen</label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="maybe"> Talán</label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="radio" name="exit-rec" value="no"> Nem</label>
                        </div>
                    </div>

                    <div class="form-group mb-0">
                        <label class="form-label">Van-e más gondolat vagy visszajelzés, amit szeretnél megosztani?</label>
                        <textarea id="exit-other" class="form-textarea" placeholder="Szabadon írhatsz bármit..." style="min-height: 80px;"></textarea>
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button class="btn btn-primary" id="btn-exit-submit" style="padding: 0.75rem 2rem; font-size: 1rem;">
                            <i data-lucide="send"></i> Kérdőív beküldése
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('btn-exit-submit')?.addEventListener('click', () => {
            const name   = document.getElementById('exit-name').value.trim();
            const dept   = document.getElementById('exit-dept').value.trim();
            const reason = document.getElementById('exit-reason').value;
            const liked  = document.getElementById('exit-liked').value.trim();
            const improve  = document.getElementById('exit-improve').value.trim();
            const recVal = document.querySelector('input[name="exit-rec"]:checked');
            const recommend = recVal ? recVal.value : '';
            const other  = document.getElementById('exit-other').value.trim();

            if (!name) { alert('Kérlek add meg a nevед!'); return; }
            if (!reason) { alert('Kérlek válaszd ki az elsődleges kilépési okot!'); return; }
            if (!liked)  { alert('Kérlek töltsd ki, mi tetszett leginkább!'); return; }

            const durationSecs = Math.floor((Date.now() - startTime) / 1000);

            window.appStore.saveInterview({
                type:          'exit',
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
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    };

    const renderThankYou = (name) => {
        container.innerHTML = `
            <div class="card" style="max-width: 560px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
                <div style="width: 4rem; height: 4rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i data-lucide="heart" style="width: 2rem; height: 2rem;"></i>
                </div>
                <h2 style="font-size: 2rem; font-weight: 600;" class="mb-2">Köszönjük, ${name}!</h2>
                <p style="color: var(--text-secondary); font-size: 1.125rem;">Visszajelzésed sikeresen rögzítettük. Sok sikert a jövőre!</p>
            </div>
        `;
        lucide.createIcons();
    };

    renderForm();
}
