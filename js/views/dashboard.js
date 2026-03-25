export function renderDashboard(container) {
    const roles = window.appStore.getRoles();
    const interviews = window.appStore.getInterviews();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 style="font-size: 1.5rem; font-weight: 600;">Munkakörök és Interjúk</h2>
                <p style="color: var(--text-secondary);" class="mt-1">Válaszd ki a munkakört az interjú indításához, vagy szerkeszd a meglévőket.</p>
            </div>
            <button class="btn btn-secondary" onclick="window.navigateTo('roleManager')">
                <i data-lucide="settings"></i> Munkakörök kezelése
            </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;" class="mb-6">
            ${roles.length === 0 ? '<p style="color: var(--text-secondary);">Nincsenek még munkakörök. Kérlek hozz létre egyet.</p>' : ''}
            ${roles.map(role => `
                <div class="card flex flex-col justify-between">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 500;" class="mb-2">${role.title}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">
                            <i data-lucide="list-checks" style="width: 1rem; height: 1rem; display: inline-block; vertical-align: middle;"></i> 
                            ${role.questions.length} kérdés beállítva
                        </p>
                    </div>
                    <div class="mt-6">
                        <button class="btn btn-primary" style="width: 100%;" onclick="window.navigateTo('interviewSetup', { roleId: '${role.id}' })" ${role.questions.length === 0 ? 'disabled' : ''}>
                            <i data-lucide="play-circle"></i> Interjú indítása
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <h3 style="font-size: 1.25rem; font-weight: 600;" class="mb-4 mt-6">Korábbi interjúk</h3>
        <div class="card">
            ${interviews.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">Még nem történt interjú.</p>' : ''}
            ${interviews.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${interviews.slice().reverse().map(inv => {
                        const isExit = inv.type === 'exit';
                        const role = !isExit ? window.appStore.getRoleById(inv.roleId) : null;
                        const roleTitle = isExit ? 'Kilépő kérdőív' : (role ? role.title : 'Ismeretlen munkakör');
                        const dateStr = new Date(inv.date).toLocaleString('hu-HU');
                        const durationMins = Math.floor(inv.duration / 60);
                        const typeIcon  = isExit ? 'log-out' : (inv.isSelfAssessment ? 'laptop' : 'users');
                        const typeColor = isExit ? 'var(--danger)' : (inv.isSelfAssessment ? 'var(--warning)' : 'var(--accent)');

                        // Hire status badge for non-exit
                        const hireStatus = inv.hireStatus || 'pending';
                        const hsMap = { hired: { color: 'var(--success)', label: 'Felvéve' }, rejected: { color: 'var(--danger)', label: 'Visszautasítva' }, pending: { color: 'var(--text-secondary)', label: '—' }};
                        const hs = hsMap[hireStatus];

                        return `
                            <div tabindex="0" onclick="window.navigateTo('evaluation', { interviewId: '${inv.id}' })" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-primary)'" onmouseout="this.style.backgroundColor='transparent'">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
                                        <i data-lucide="${typeIcon}" style="width: 1.25rem; height: 1.25rem; color: ${typeColor};"></i>
                                    </div>
                                    <div>
                                        <h4 style="font-weight: 500;">${inv.candidateName}</h4>
                                        <p style="color: var(--text-secondary); font-size: 0.875rem;">${roleTitle}</p>
                                    </div>
                                </div>
                                <div class="text-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                                    <p style="font-size: 0.875rem;">${dateStr}</p>
                                    ${!isExit ? `<span style="font-size: 0.75rem; color: ${hs.color}; font-weight: 500;">${hs.label}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;

    lucide.createIcons();
}


