import { t, getLang } from '../services/translations.js?v=37';
import { generateTurnoverReport } from '../services/aiService.js';

/**
 * HR Statistics — admin-only view.
 * Shows per-HR stats with drill-down per colleague + AI turnover report.
 */
export function renderHrStats(container) {
    const currentUser = window.appAuth.getUser();
    if (!currentUser || currentUser.role !== 'admin') {
        container.innerHTML = `<div class="card" style="max-width:500px; margin: 4rem auto; text-align: center; padding: 2rem;">
            <i data-lucide="shield-off" style="width: 3rem; height: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
            <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">${t('stats.access_denied')}</h2>
            <p style="color: var(--text-secondary);">${t('stats.admin_only')}</p>
            <button class="btn btn-secondary mt-4" onclick="window.navigateTo('dashboard')">${t('role.back')}</button>
        </div>`;
        lucide.createIcons();
        return;
    }

    const reasonLabels = getLang() === 'hu' ? {
        better_offer: 'Jobb ajánlat',
        career_growth: 'Karrier/fejlődés',
        management: 'Vezetői problémák',
        salary: 'Bérezés',
        worklife: 'Munka-magánélet',
        relocation: 'Költözés',
        other: 'Egyéb'
    } : {
        better_offer: 'Better offer',
        career_growth: 'Career growth',
        management: 'Management issues',
        salary: 'Salary',
        worklife: 'Work-life balance',
        relocation: 'Relocation',
        other: 'Other'
    };

    const renderOverview = () => {
        const users      = window.appStore.getUsers();
        const interviews = window.appStore.getInterviews();

        const stats = users.map(u => {
            const myInterviews  = interviews.filter(i => i.issuedBy === u.id);
            const hiringList    = myInterviews.filter(i => i.type !== 'exit');
            const exitList      = myInterviews.filter(i => i.type === 'exit');
            const hired         = hiringList.filter(i => i.hireStatus === 'hired').length;
            const rejected      = hiringList.filter(i => i.hireStatus === 'rejected').length;
            const pending       = hiringList.filter(i => !i.hireStatus || i.hireStatus === 'pending').length;
            const total         = hiringList.length;
            const rate          = total > 0 ? Math.round((hired / total) * 100) : 0;
            return { user: u, total, hiringTotal: total, exitTotal: exitList.length, hired, rejected, pending, rate };
        });

        const overallInterviews = interviews.filter(i => i.type !== 'exit').length;
        const overallHired      = interviews.filter(i => i.hireStatus === 'hired').length;
        const overallExits      = interviews.filter(i => i.type === 'exit').length;
        const exitInterviews    = interviews.filter(i => i.type === 'exit');

        const exitReasonCounts = {};
        exitInterviews.filter(i => i.exitData?.reason).forEach(i => {
            const r = i.exitData.reason;
            exitReasonCounts[r] = (exitReasonCounts[r] || 0) + 1;
        });

        container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                <i data-lucide="arrow-left"></i> ${t('role.back')}
            </button>
            <div class="flex justify-between items-start" style="flex-wrap:wrap;gap:1rem;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 600;">${t('stats.title')}</h2>
                    <p style="color: var(--text-secondary);" class="mt-1">${t('stats.subtitle')}</p>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap:wrap;">
                    <div class="card" style="padding: 0.75rem 1.25rem; text-align: center; min-width: 80px;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--accent);">${overallInterviews}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${t('stats.total_interviews')}</div>
                    </div>
                    <div class="card" style="padding: 0.75rem 1.25rem; text-align: center; min-width: 80px;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--success);">${overallHired}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${t('stats.hired')}</div>
                    </div>
                    <div class="card" style="padding: 0.75rem 1.25rem; text-align: center; min-width: 80px;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--warning);">${overallExits}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${t('stats.exits')}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Per-HR stats table -->
        <div class="card mb-6">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="users" style="color: var(--accent); width: 1.125rem;"></i> ${t('stats.colleagues_perf')}
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">${t('stats.colleague')}</th>
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: center;">${getLang() === 'hu' ? 'Interjúk' : 'Interviews'}</th>
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: center;">${t('stats.hired')}</th>
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: center;">${t('stats.rejected')}</th>
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: center;">${t('stats.exits')}</th>
                            <th style="padding: 0.75rem 1rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: center;">${t('stats.hiring_rate')}</th>
                            <th style="padding: 0.75rem 1rem;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map((s, idx) => `
                            <tr style="border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.15s;" class="hr-row" data-uid="${s.user.id}"
                                onmouseover="this.style.background='var(--bg-primary)'" onmouseout="this.style.background=''">
                                <td style="padding: 1rem; vertical-align: middle;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 2.25rem; height: 2.25rem; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; color: white; flex-shrink: 0;">${s.user.displayName.charAt(0)}</div>
                                        <div>
                                            <div style="font-weight: 500;">${s.user.displayName}</div>
                                            <div style="color: var(--text-secondary); font-size: 0.75rem;">${s.user.role === 'admin' ? t('role.admin') : t('role.hr')} · @${s.user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 1rem; text-align: center; vertical-align: middle;"><span style="font-size: 1.125rem; font-weight: 600;">${s.hiringTotal}</span></td>
                                <td style="padding: 1rem; text-align: center; vertical-align: middle;"><span style="font-size: 1.125rem; font-weight: 600; color: var(--success);">${s.hired}</span></td>
                                <td style="padding: 1rem; text-align: center; vertical-align: middle;"><span style="font-size: 1.125rem; font-weight: 600; color: var(--danger);">${s.rejected}</span></td>
                                <td style="padding: 1rem; text-align: center; vertical-align: middle;"><span style="font-size: 1.125rem; font-weight: 600; color: var(--warning);">${s.exitTotal}</span></td>
                                <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                                        <div style="width: 80px; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; width: ${s.rate}%; background: ${s.rate >= 60 ? 'var(--success)' : s.rate >= 30 ? 'var(--warning)' : 'var(--danger)'}; transition: width 0.5s;"></div>
                                        </div>
                                        <span style="font-weight: 600; min-width: 2.5rem;">${s.rate}%</span>
                                    </div>
                                </td>
                                <td style="padding: 1rem; text-align: right; vertical-align: middle;">
                                    <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">${t('stats.details')} →</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Exit Reason Breakdown -->
        ${overallExits > 0 ? `
        <div class="card mb-6">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="log-out" style="color: var(--warning); width: 1.125rem;"></i> ${t('stats.exit_reasons')}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
                ${Object.entries(exitReasonCounts).sort((a,b) => b[1]-a[1]).map(([key, count]) => {
                    const pct = Math.round((count / overallExits) * 100);
                    return `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="min-width: 10rem; font-size: 0.875rem;">${reasonLabels[key] || key}</div>
                            <div style="flex: 1; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${pct}%; background: var(--warning); transition: width 0.5s;"></div>
                            </div>
                            <div style="min-width: 3rem; font-size: 0.875rem; font-weight: 600; text-align: right;">${count} (${pct}%)</div>
                        </div>`;
                }).join('')}
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">${t('stats.rec_rate')}</h4>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.875rem; flex-wrap: wrap;">
                        ${(() => {
                            const recs = exitInterviews.filter(i => i.exitData?.recommend).map(i => i.exitData.recommend);
                            const yes   = recs.filter(r => r === 'yes').length;
                            const maybe = recs.filter(r => r === 'maybe').length;
                            const no    = recs.filter(r => r === 'no').length;
                            return `
                                <span style="color: var(--success);"><strong>${yes}</strong> ${getLang() === 'hu' ? 'Igen' : 'Yes'}</span>
                                <span style="color: var(--warning);"><strong>${maybe}</strong> ${getLang() === 'hu' ? 'Talán' : 'Maybe'}</span>
                                <span style="color: var(--danger);"><strong>${no}</strong> ${getLang() === 'hu' ? 'Nem' : 'No'}</span>`;
                        })()}
                    </div>
                </div>
                <button id="btn-ai-turnover" class="btn btn-primary" style="gap: 0.5rem;">
                    <i data-lucide="brain-circuit"></i> ${t('stats.ai_turnover')}
                </button>
            </div>
        </div>

        <!-- AI Report placeholder -->
        <div id="ai-turnover-section"></div>

        ` : `<div class="card" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <i data-lucide="inbox" style="width: 2rem; height: 2rem; margin-bottom: 0.75rem; opacity: 0.4;"></i>
            <p>${t('stats.no_exits')}</p>
        </div>`}
        `;

        lucide.createIcons();

        // Row click → drill-down
        container.querySelectorAll('.hr-row').forEach(row => {
            row.addEventListener('click', () => renderColleagueDetail(row.dataset.uid));
        });

        // AI Turnover report
        document.getElementById('btn-ai-turnover')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-ai-turnover');
            const section = document.getElementById('ai-turnover-section');
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader"></i> ${t('stats.analyzing')}`;
            lucide.createIcons();
            section.innerHTML = `<div class="card" style="padding:2rem;display:flex;align-items:center;gap:1rem;">
                <div style="width:1.5rem;height:1.5rem;border:3px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;"></div>
                <span>${t('stats.ai_thinking')}</span>
            </div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
            try {
                const exits = window.appStore.getInterviews().filter(i => i.type === 'exit');
                const report = await generateTurnoverReport(exits);
                section.innerHTML = renderTurnoverReportCard(report);
                lucide.createIcons();
            } catch(e) {
                section.innerHTML = `<div class="card" style="padding:1.5rem;border:1px solid var(--danger);color:var(--danger);">⚠ ${t('stats.ai_error')}: ${e.message}</div>`;
            }
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="brain-circuit"></i> ${t('stats.ai_turnover')}`;
            lucide.createIcons();
        });
    };

    const renderTurnoverReportCard = (report) => `
        <div class="card mb-6" style="padding:2rem;">
            <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1.25rem;display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="brain-circuit" style="width:1.125rem;color:var(--accent);"></i> ${t('stats.ai_turnover')}
                <span style="margin-left:auto;font-size:0.72rem;background:var(--bg-primary);color:var(--text-secondary);padding:0.2rem 0.6rem;border-radius:1rem;border:1px solid var(--border-color);font-weight:400;">Gemini AI</span>
            </h3>
            <p style="font-size:0.9375rem;line-height:1.75;color:var(--text-primary);margin-bottom:1.5rem;">${report.summary}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
                <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:1rem;">
                    <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--danger);margin-bottom:0.75rem;">⚠ ${getLang() === 'hu' ? 'Fő kilépési okok' : 'Main exit reasons'}</div>
                    ${report.mainReasons?.map(r => `<div style="font-size:0.875rem;padding:0.3rem 0;border-bottom:1px solid rgba(239,68,68,0.1);display:flex;gap:0.5rem;"><span style="color:var(--danger);flex-shrink:0;">✗</span><span>${r}</span></div>`).join('') || ''}
                </div>
                <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-md);padding:1rem;">
                    <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--success);margin-bottom:0.75rem;">✓ ${getLang() === 'hu' ? 'Pozitívumok' : 'Positives'}</div>
                    ${report.positives?.map(p => `<div style="font-size:0.875rem;padding:0.3rem 0;border-bottom:1px solid rgba(16,185,129,0.1);display:flex;gap:0.5rem;"><span style="color:var(--success);flex-shrink:0;">✓</span><span>${p}</span></div>`).join('') || ''}
                </div>
            </div>
            <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:var(--radius-md);padding:1rem;">
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:0.75rem;">💡 ${getLang() === 'hu' ? 'Fejlesztési javaslatok' : 'Improvement suggestions'}</div>
                ${report.improvements?.map((imp, i) => `<div style="font-size:0.875rem;padding:0.4rem 0;border-bottom:1px solid rgba(59,130,246,0.1);display:flex;gap:0.75rem;"><span style="color:var(--accent);font-weight:700;flex-shrink:0;">${i+1}.</span><span>${imp}</span></div>`).join('') || ''}
            </div>
        </div>`;

    const renderColleagueDetail = (userId) => {
        const users      = window.appStore.getUsers();
        const interviews = window.appStore.getInterviews();
        const user       = users.find(u => u.id === userId);
        if (!user) return;

        const myInterviews = interviews.filter(i => i.issuedBy === userId);
        const hiredList    = myInterviews.filter(i => i.type !== 'exit' && i.hireStatus === 'hired');
        const exitList     = myInterviews.filter(i => i.type === 'exit');

        // Match hired people who also have an exit interview
        const hiredNames   = new Set(hiredList.map(i => i.candidateName?.toLowerCase()));
        const departedFromHired = exitList.filter(i => hiredNames.has(i.candidateName?.toLowerCase()));

        const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU') : '–';

        container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" id="btn-back-stats">
                <i data-lucide="arrow-left"></i> ${t('stats.back')}
            </button>
            <div style="display:flex;align-items:center;gap:1rem;">
                <div style="width:3rem;height:3rem;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:700;color:white;flex-shrink:0;">${user.displayName.charAt(0)}</div>
                <div>
                    <h2 style="font-size:1.5rem;font-weight:600;">${user.displayName}</h2>
                    <p style="color:var(--text-secondary);font-size:0.875rem;">${user.role === 'admin' ? t('role.admin') : t('role.hr')} · @${user.username}</p>
                </div>
                <div style="margin-left:auto;display:flex;gap:1rem;flex-wrap:wrap;">
                    <div class="card" style="padding:0.6rem 1rem;text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${hiredList.length}</div>
                        <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${t('stats.hired')}</div>
                    </div>
                    <div class="card" style="padding:0.6rem 1rem;text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--warning);">${exitList.length}</div>
                        <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${t('stats.exited')}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hired employees -->
        <div class="card mb-6">
            <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1.25rem;display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="user-check" style="width:1.125rem;color:var(--success);"></i> ${t('stats.hired_by')} (${hiredList.length})
            </h3>
            ${hiredList.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:0;">
                ${hiredList.map((iv, idx) => {
                    const hasExited = exitList.some(e => e.candidateName?.toLowerCase() === iv.candidateName?.toLowerCase());
                    return `<div style="display:flex;align-items:center;gap:1rem;padding:0.875rem 0;border-bottom:${idx < hiredList.length-1 ? '1px solid var(--border-color)' : 'none'};">
                        <div style="width:2rem;height:2rem;background:${hasExited ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:${hasExited ? 'var(--warning)' : 'var(--success)'};flex-shrink:0;">${iv.candidateName?.charAt(0) || '?'}</div>
                        <div style="flex:1;">
                            <div style="font-weight:500;">${iv.candidateName}</div>
                            <div style="font-size:0.75rem;color:var(--text-secondary);">${getLang() === 'hu' ? 'Interjú' : 'Interview'}: ${formatDate(iv.date)}${iv.hireDate ? (getLang() === 'hu' ? ' · Belépett: ' : ' · Started: ') + formatDate(iv.hireDate) : ''}</div>
                        </div>
                        <span style="font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:1rem;background:${hasExited ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'};color:${hasExited ? 'var(--warning)' : 'var(--success)'};">
                            ${hasExited ? '⚠ ' + t('stats.exited') : '✓ ' + t('stats.active')}
                        </span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="window.navigateTo('evaluation',{interviewId:'${iv.id}'})" style="font-size:0.75rem;padding:0.3rem 0.75rem;">
                                <i data-lucide="eye" style="width:0.8rem;"></i> ${t('stats.evaluation')}
                            </button>
                            <button class="btn btn-danger" style="padding: 0.3rem 0.5rem; display: flex; align-items: center; justify-content: center;" title="${t('dashboard.delete_tooltip')}" onclick="event.stopPropagation(); if(confirm('${t('dashboard.delete_confirm')}')) { window.appStore.deleteInterview('${iv.id}'); window.navigateTo('dashboard'); }">
                                <i data-lucide="trash-2" style="width: 0.8rem; height: 0.8rem;"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : `<p style="color:var(--text-secondary);">${getLang() === 'hu' ? 'Még nem vett fel senkit.' : 'Nobody hired yet.'}</p>`}
        </div>

        <!-- Departed employees -->
        <div class="card mb-6">
            <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1.25rem;display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="log-out" style="width:1.125rem;color:var(--warning);"></i> ${t('stats.exited_by')} (${exitList.length})
            </h3>
            ${exitList.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:0;">
                ${exitList.map((iv, idx) => {
                    const ed = iv.exitData || {};
                    return `<div style="display:flex;align-items:center;gap:1rem;padding:0.875rem 0;border-bottom:${idx < exitList.length-1 ? '1px solid var(--border-color)' : 'none'};">
                        <div style="width:2rem;height:2rem;background:rgba(239,68,68,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--danger);flex-shrink:0;">${iv.candidateName?.charAt(0) || '?'}</div>
                        <div style="flex:1;">
                            <div style="font-weight:500;">${iv.candidateName}</div>
                            <div style="font-size:0.75rem;color:var(--text-secondary);">${t('stats.exited')}: ${formatDate(iv.date)} · ${getLang() === 'hu' ? 'Ok' : 'Reason'}: ${reasonLabels[ed.reason] || ed.reason || (getLang() === 'hu' ? '(nem adta meg)' : '(not specified)')}</div>
                        </div>
                        <span style="font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:1rem;background:rgba(239,68,68,0.1);color:var(--danger);">${t('stats.exited')}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="window.navigateTo('evaluation',{interviewId:'${iv.id}'})" style="font-size:0.75rem;padding:0.3rem 0.75rem;">
                                <i data-lucide="eye" style="width:0.8rem;"></i> ${t('stats.questionnaire')}
                            </button>
                            <button class="btn btn-danger" style="padding: 0.3rem 0.5rem; display: flex; align-items: center; justify-content: center;" title="${t('dashboard.delete_tooltip')}" onclick="event.stopPropagation(); if(confirm('${t('dashboard.delete_confirm')}')) { window.appStore.deleteInterview('${iv.id}'); window.navigateTo('dashboard'); }">
                                <i data-lucide="trash-2" style="width: 0.8rem; height: 0.8rem;"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            ${exitList.length >= 1 ? `
            <div style="border-top:1px solid var(--border-color);padding-top:1rem;margin-top:0.5rem;text-align:right;">
                <button id="btn-ai-colleague-report" class="btn btn-primary" style="font-size:0.85rem;">
                    <i data-lucide="brain-circuit"></i> ${t('stats.why_exited')}
                </button>
            </div>
            <div id="ai-colleague-section" style="margin-top:1rem;"></div>` : ''}

            ` : `<p style="color:var(--text-secondary);">${getLang() === 'hu' ? 'Még nem ment el senki a keze alól.' : 'Nobody left under them yet.'}</p>`}
        </div>
        `;

        lucide.createIcons();

        document.getElementById('btn-back-stats')?.addEventListener('click', () => renderOverview());

        document.getElementById('btn-ai-colleague-report')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-ai-colleague-report');
            const section = document.getElementById('ai-colleague-section');
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader"></i> ${t('stats.analyzing')}`;
            lucide.createIcons();
            section.innerHTML = `<div style="padding:1.5rem;background:var(--bg-primary);border-radius:var(--radius-md);display:flex;align-items:center;gap:1rem;">
                <div style="width:1.25rem;height:1.25rem;border:3px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;"></div>
                <span>${t('stats.ai_thinking_colleague')}</span>
            </div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
            try {
                const exits = window.appStore.getInterviews().filter(i => i.type === 'exit' && i.issuedBy === userId);
                const report = await generateTurnoverReport(exits);
                section.innerHTML = renderTurnoverReportCard(report);
                lucide.createIcons();
            } catch(e) {
                section.innerHTML = `<div style="padding:1rem;border:1px solid var(--danger);border-radius:var(--radius-md);color:var(--danger);">⚠ ${t('stats.ai_error')}: ${e.message}</div>`;
            }
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="brain-circuit"></i> ${t('stats.why_exited')}`;
            lucide.createIcons();
        });
    };

    renderOverview();
}
