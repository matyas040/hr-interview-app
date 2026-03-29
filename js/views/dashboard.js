import { t, getLang } from '../services/translations.js?v=37';

export function renderDashboard(container) {
    const roles = window.appStore.getRoles();
    const interviews = window.appStore.getInterviews();

    const currentUser = window.appAuth.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    container.innerHTML = `
        <div id="ai-observer-container"></div>

        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">${t('dashboard.title')}</h2>
                <p style="color: var(--text-secondary);" class="mt-1">${t('dashboard.subtitle')}</p>
            </div>
            ${isAdmin ? `
                <button class="btn btn-secondary" onclick="window.navigateTo('roleManager')">
                    <i data-lucide="settings"></i> ${t('dashboard.manage_roles')}
                </button>
            ` : ''}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;" class="mb-6">
            ${roles.length === 0 ? `<p style="color: var(--text-secondary);">${t('dashboard.no_roles')}</p>` : ''}
            ${roles.map(role => `
                <div class="card flex flex-col justify-between">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 500;" class="mb-2">${role.title}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">
                            <i data-lucide="list-checks" style="width: 1rem; height: 1rem; display: inline-block; vertical-align: middle;"></i> 
                            ${role.questions.length} ${getLang() === 'hu' ? 'kérdés beállítva' : 'questions configured'}
                        </p>
                    </div>
                    <div class="mt-6">
                        <button class="btn btn-primary" style="width: 100%;" onclick="window.navigateTo('interviewSetup', { roleId: '${role.id}' })" ${role.questions.length === 0 ? 'disabled' : ''}>
                            <i data-lucide="play-circle"></i> ${t('dashboard.start_interview')}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <h3 style="font-size: 1.25rem; font-weight: 600;" class="mb-4 mt-6">${t('dashboard.past_interviews')}</h3>
        <div class="card">
            ${interviews.length === 0 ? `<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">${t('dashboard.no_interviews')}</p>` : ''}
            ${interviews.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${interviews.slice().reverse().map(inv => {
                        const isExit = inv.type === 'exit';
                        const role = !isExit ? window.appStore.getRoleById(inv.roleId) : null;
                        const roleTitle = isExit ? t('dashboard.exit_interview') : (role ? role.title : t('dashboard.unknown_role'));
                        const dateStr = new Date(inv.date).toLocaleString(getLang() === 'hu' ? 'hu-HU' : 'en-US');
                        const durationMins = Math.floor(inv.duration / 60);
                        const typeIcon  = isExit ? 'log-out' : (inv.isTextMode ? 'file-edit' : (inv.isSelfAssessment ? 'laptop' : 'users'));
                        const typeColor = isExit ? 'var(--danger)' : (inv.isTextMode ? 'var(--accent)' : (inv.isSelfAssessment ? 'var(--warning)' : 'var(--accent)'));

                        // Hire status badge for non-exit
                        const hireStatus = inv.hireStatus || 'pending';
                        const hsMap = { 
                            hired: { color: 'var(--success)', label: t('dashboard.status.hired') }, 
                            rejected: { color: 'var(--danger)', label: t('dashboard.status.rejected') }, 
                            pending: { color: 'var(--text-secondary)', label: t('dashboard.status.pending') }
                        };
                        const hs = hsMap[hireStatus];

                        return `
                            <div tabindex="0" onclick="window.navigateTo('evaluation', { interviewId: '${inv.id}' })" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-primary)'" onmouseout="this.style.backgroundColor='transparent'">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
                                        <i data-lucide="${typeIcon}" style="width: 1.25rem; height: 1.25rem; color: ${typeColor};"></i>
                                    </div>
                                    <div>
                                        <h4 style="font-weight: 500;">${inv.candidateName}</h4>
                                        <p style="color: var(--text-secondary); font-size: 0.875rem;">
                                            ${roleTitle} ${inv.issuedByName ? `<span style="opacity: 0.6; margin-left: 0.5rem;">· <i data-lucide="user" style="width: 0.75rem; vertical-align: middle;"></i> ${inv.issuedByName}</span>` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div class="text-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                                        <p style="font-size: 0.875rem;">${dateStr}</p>
                                        ${!isExit ? `<span style="font-size: 0.75rem; color: ${hs.color}; font-weight: 600;">${hs.label}</span>` : ''}
                                    </div>
                                    ${isAdmin ? `
                                        <button class="btn btn-danger" style="padding: 0.4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 2.2rem; height: 2.2rem;" title="${t('dashboard.delete_tooltip')}" onclick="event.stopPropagation(); if(confirm('${t('dashboard.delete_confirm')}')) { window.appStore.deleteInterview('${inv.id}'); window.navigateTo('dashboard'); }">
                                            <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;

    lucide.createIcons();
    loadAiObserver(roles, interviews);
}

async function loadAiObserver(roles, interviews) {
    const observerContainer = document.getElementById('ai-observer-container');
    if (!observerContainer) return;

    // Show loading skeleton
    observerContainer.innerHTML = `
        <div class="ai-observer-panel" style="opacity: 0.7;">
            <div class="flex items-center gap-3">
                <i data-lucide="brain-circuit" class="pulse-icon" style="color: var(--accent);"></i>
                <span style="font-weight: 600; color: var(--accent);">${getLang()==='hu'?'AI Megfigyelő: Elemzés...':'AI Observer: Analyzing...'}</span>
            </div>
        </div>
    `;
    lucide.createIcons();

    try {
        const { getSystemInsights } = await import('../services/aiObserver.js?v=61');
        const insights = await getSystemInsights(interviews, roles, inspectionsPlaceholder()); // Placeholder for exit interviews
        
        if (!insights || insights.length === 0) {
            observerContainer.innerHTML = '';
            return;
        }

        observerContainer.innerHTML = `
            <div class="ai-observer-panel">
                <div class="flex items-center gap-2 mb-4">
                    <i data-lucide="brain-circuit" style="color: var(--accent); width: 1.25rem;"></i>
                    <h3 style="font-size: 0.875rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em;">AI Észrevételek</h3>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${insights.map(item => `
                        <div class="ai-alert-item ai-alert-${item.type}">
                            <i data-lucide="${item.type === 'warning' ? 'alert-triangle' : (item.type === 'success' ? 'check-circle' : 'info')}" style="width: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; color: ${item.type === 'warning' ? 'var(--danger)' : (item.type === 'success' ? 'var(--success)' : 'var(--accent)')};"></i>
                            <p style="font-size: 0.9rem; line-height: 1.4; color: var(--text-primary);">${item.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        console.error("Failed to load AI Observer insights:", err);
        observerContainer.innerHTML = '';
    }
}

function inspectionsPlaceholder() {
    // Helper to get exit interviews since they are in the same interviews collection but with type 'exit'
    return window.appStore.getInterviews().filter(i => i.type === 'exit');
}


