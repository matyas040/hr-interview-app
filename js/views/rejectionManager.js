import { t, getLang } from '../services/translations.js?v=32';
import { generateRejectionEmail } from '../services/aiService.js?v=32';

/**
 * Rejection Manager - Phase 8
 * Lists rejected candidates without sent emails.
 * Generates AI rejection drafts.
 */
export function renderRejectionManager(container) {
    const interviews = window.appStore.getInterviews();
    const pendingInterviews = interviews.filter(i => i.hireStatus === 'rejected' && (!i.emailSent || i.emailSent === 'pending'));

    container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                <i data-lucide="arrow-left"></i> ${t('role.back')}
            </button>
            <h2 style="font-size: 1.5rem; font-weight: 600;">${t('rejection.title')}</h2>
            <p style="color: var(--text-secondary);" class="mt-1">${t('rejection.subtitle')}</p>
        </div>

        <div class="card">
            ${pendingInterviews.length === 0 ? `
                <div style="text-align: center; padding: 2rem;">
                    <i data-lucide="check-circle" style="width: 3rem; height: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">${t('rejection.no_pending')}</p>
                </div>
            ` : `
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${pendingInterviews.map(inv => {
                        const role = window.appStore.getRoleById(inv.roleId);
                        const roleTitle = role ? role.title : t('dashboard.unknown_role');
                        return `
                            <div class="rejection-item card" style="background: var(--bg-primary); border-style: dashed;" id="item-${inv.id}">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                    <div>
                                        <h4 style="font-weight: 600; font-size: 1.125rem;">${inv.candidateName}</h4>
                                        <p style="color: var(--text-secondary); font-size: 0.875rem;">${roleTitle} • ${inv.candidateEmail}</p>
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn btn-primary btn-ai-gen" data-id="${inv.id}" style="padding: 0.5rem 1rem; font-size: 0.75rem;">
                                            <i data-lucide="brain-circuit"></i> ${t('rejection.ai_draft')}
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.appStore.updateInterviewEmailStatus('${inv.id}', 'manual'); document.getElementById('item-${inv.id}').remove();" style="padding: 0.5rem 1rem; font-size: 0.75rem;">
                                            ${t('rejection.mark_sent')}
                                        </button>
                                    </div>
                                </div>
                                <div id="draft-area-${inv.id}" style="display: none; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label">${t('rejection.ai_draft')}</label>
                                        <input type="text" id="subject-${inv.id}" class="form-input mb-2" style="font-weight: 600;">
                                        <textarea id="body-${inv.id}" class="form-textarea" style="min-height: 200px; font-size: 0.875rem; line-height: 1.6;"></textarea>
                                    </div>
                                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                                        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('body-${inv.id}').value); alert(t('rejection.copy') + '!')">
                                            <i data-lucide="copy"></i> ${t('rejection.copy')}
                                        </button>
                                        <button class="btn btn-primary" id="btn-send-${inv.id}">
                                            <i data-lucide="external-link"></i> ${t('rejection.open_mail')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;

    lucide.createIcons();

    // Event Listeners
    container.querySelectorAll('.btn-ai-gen').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const interview = interviews.find(i => i.id === id);
            const draftArea = document.getElementById(`draft-area-${id}`);
            
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader" class="spin"></i> ${t('rejection.ai_thinking')}`;
            lucide.createIcons();

            try {
                // Determine evaluation results
                const role = window.appStore.getRoleById(interview.roleId);
                // In a real app we'd fetch evaluation from Firestore.
                // For now we assume evaluation info is in the interview or we use summary.
                const evaluation = interview.aiEvaluation || { summary: 'Sajnos nem választottunk be a következő körbe.', recommendation: 'Nem ajánlott' };
                
                const draft = await generateRejectionEmail(interview, evaluation);
                
                document.getElementById(`subject-${id}`).value = draft.subject;
                document.getElementById(`body-${id}`).value = draft.body;
                draftArea.style.display = 'block';

                document.getElementById(`btn-send-${id}`).onclick = () => {
                    const subject = encodeURIComponent(draft.subject);
                    const body = encodeURIComponent(document.getElementById(`body-${id}`).value);
                    window.open(`mailto:${interview.candidateEmail}?subject=${subject}&body=${body}`);
                    window.appStore.updateInterviewEmailStatus(id, true);
                    document.getElementById(`item-${id}`).style.opacity = '0.5';
                    document.getElementById(`item-${id}`).style.pointerEvents = 'none';
                };

            } catch (err) {
                alert("AI Error: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="brain-circuit"></i> AI Tervezet`;
                lucide.createIcons();
            }
        });
    });
}
