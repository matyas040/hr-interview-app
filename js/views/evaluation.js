import { t, getLang } from '../services/translations.js?v=20';
import { analyzeInterview, getApiKey } from '../services/aiService.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
}

function scoreLabel(score) {
    if (score >= 85) return t('eval.score.excellent');
    if (score >= 70) return t('eval.score.good');
    if (score >= 55) return t('eval.score.fair');
    if (score >= 35) return t('eval.score.poor');
    return t('eval.score.not_rec');
}

function svgCircle(score, color) {
    const r = 48, c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return `
        <svg width="120" height="120" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="10"/>
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="10"
                stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
                style="transition: stroke-dashoffset 1s ease;"/>
        </svg>`;
}

// ─── AI Score Card ────────────────────────────────────────────────────────────

function renderAiLoadingCard() {
    return `
        <div class="card mb-6" style="padding: 2rem;" id="ai-score-card">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="brain-circuit" style="width: 1.125rem; color: var(--accent);"></i> ${t('eval.ai_analysis')}
            </h3>
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-md);">
                <div style="width: 1.5rem; height: 1.5rem; border: 3px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
                <div>
                    <div style="font-weight: 500;">${t('eval.ai_analyzing')}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${t('eval.ai_wait')}</div>
                </div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>`;
}

function renderAiResultCard(result, dateStr = null, interviewId = null) {
    const color = scoreColor(result.overallScore);
    const recColors = {
        [t('eval.rec.strong')]:   { bg: 'rgba(16,185,129,0.1)', c: 'var(--success)' },
        [t('eval.rec.recommended')]: { bg: 'rgba(59,130,246,0.1)', c: '#3b82f6' },
        [t('eval.rec.consider')]:    { bg: 'rgba(245,158,11,0.1)', c: 'var(--warning)' },
        [t('eval.rec.not_rec')]:      { bg: 'rgba(239,68,68,0.1)',  c: 'var(--danger)' }
    };
    const rec = recColors[result.recommendation] || recColors['Megfontolásra ajánlott'];

    return `
        <div class="card mb-6" style="padding: 2rem;" id="ai-score-card">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="brain-circuit" style="width: 1.125rem; color: var(--accent);"></i> ${t('eval.ai_analysis')}
                <span style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                    ${dateStr ? `<span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 400;">${t('eval.ai_last_eval')}: ${dateStr}</span>` : ''}
                    <span style="font-size: 0.72rem; background: var(--bg-primary); color: var(--text-secondary); padding: 0.2rem 0.6rem; border-radius: 1rem; border: 1px solid var(--border-color); font-weight: 400;">Gemini AI</span>
                    <button id="btn-reevaluate-ai" class="btn btn-secondary" style="font-size: 0.72rem; padding: 0.2rem 0.65rem; border-radius: 1rem; display: flex; align-items: center; gap: 0.3rem;">
                        <i data-lucide="refresh-cw" style="width: 0.75rem;"></i> ${t('eval.ai_new')}
                    </button>
                </span>
            </h3>

            <div style="display: grid; grid-template-columns: auto 1fr; gap: 2rem; align-items: start; margin-bottom: 1.5rem;">
                <!-- Circle -->
                <div style="text-align: center; min-width: 130px;">
                    ${svgCircle(result.overallScore, color)}
                    <div style="margin-top: 0.25rem; font-size: 2rem; font-weight: 800; color: ${color}; line-height: 1;">${result.overallScore}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em;">/100 ${getLang()==='hu'?'pont':'points'}</div>
                    <div style="margin-top: 0.5rem; display: inline-block; background: ${color}20; color: ${color}; font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.75rem; border-radius: 1rem; border: 1px solid ${color}40;">
                        ${result.overallLabel || scoreLabel(result.overallScore)}
                    </div>
                </div>
                <!-- Summary -->
                <div>
                    <div style="background: ${rec.bg}; border-left: 3px solid ${rec.c}; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                        <strong style="color: ${rec.c}; white-space: nowrap;">${getLang()==='hu'?'Ajánlás':'Recommendation'}:</strong>
                        <span style="color: ${rec.c}; font-weight: 600;">${result.recommendation}</span>
                    </div>
                    <p style="font-size: 0.9375rem; line-height: 1.7; color: var(--text-primary);">${result.summary}</p>
                </div>
            </div>

            ${result.perAnswer && result.perAnswer.length > 0 ? `
            <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
                <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); margin-bottom: 0.75rem;">${t('eval.ai_per_q')}</div>
                <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                    ${result.perAnswer.map((pa, i) => {
                        const pc = scoreColor(pa.score);
                        return `
                        <div style="display: flex; align-items: baseline; gap: 0.75rem; font-size: 0.78rem; padding: 0.45rem 0.75rem; border-left: 3px solid ${pc}; background: ${pc}08; border-radius: 2px;">
                            <span style="font-weight: 700; color: ${pc}; min-width: 2.5rem;">${pa.score}${getLang()==='hu'?'p':'pt'}</span>
                            <span style="flex: 1; color: var(--text-secondary);" title="${pa.summary || ''}">${i+1}. ${pa.summary || ''}</span>
                            <span style="font-weight: 600; color: ${pc}; white-space: nowrap;">${pa.grade}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
        </div>`;
}

function renderAiErrorCard(errorMsg, interviewId) {
    const noKey = errorMsg === 'NO_API_KEY';
    return `
        <div class="card mb-6" style="padding: 2rem;" id="ai-score-card">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="brain-circuit" style="width: 1.125rem; color: var(--accent);"></i> ${t('eval.ai_analysis')}
            </h3>
            <div style="padding: 1rem 1.25rem; background: ${noKey ? 'rgba(59,130,246,0.06)' : 'rgba(239,68,68,0.06)'}; border: 1px solid ${noKey ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}; border-radius: var(--radius-md); display: flex; gap: 1rem; align-items: flex-start;">
                <i data-lucide="${noKey ? 'key' : 'alert-circle'}" style="width: 1.25rem; color: ${noKey ? 'var(--accent)' : 'var(--danger)'}; flex-shrink: 0; margin-top: 0.1rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${noKey ? t('eval.ai_no_key') : t('eval.ai_error')}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${noKey
                            ? t('eval.ai_no_key_msg')
                            : `${getLang()==='hu'?'Hiba':'Error'}: ${errorMsg}`}
                    </div>
                </div>
                ${noKey
                    ? `<button class="btn btn-secondary" onclick="window.navigateTo('adminPanel')" style="font-size: 0.8rem; white-space: nowrap; flex-shrink: 0;"><i data-lucide="settings"></i> ${t('admin.title')}</button>`
                    : `<button class="btn btn-secondary" id="btn-retry-ai" data-id="${interviewId}" style="font-size: 0.8rem; white-space: nowrap; flex-shrink: 0;"><i data-lucide="refresh-cw"></i> ${t('stats.retry')||'Retry'}</button>`}
            </div>
        </div>`;
}

// ─── Q&A Section ─────────────────────────────────────────────────────────────

function renderAnswerFeedback(q, ansData, aiPerAnswer, isSelf) {
    if (isSelf) {
        const pa = aiPerAnswer?.find(p => p.questionId === q.id);
        const ansColor = pa ? scoreColor(pa.score) : 'var(--border-color)';

        return `
            <div style="margin-top: 0.75rem;">
                ${ansData.text
                    ? `<div style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent); white-space: pre-wrap; font-size: 0.9375rem; line-height: 1.6; margin-bottom: 0.75rem;">${ansData.text}</div>`
                    : `<p style="color: var(--text-secondary); font-style: italic; margin-bottom: 0.75rem;">${t('eval.ans_none')}</p>`}
                ${pa ? `
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
                    <span style="background: ${ansColor}18; color: ${ansColor}; border: 1px solid ${ansColor}40; border-radius: 1rem; padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;">${pa.score}/100 — ${pa.grade}</span>
                    ${pa.summary ? `<span style="font-size: 0.72rem; color: var(--text-secondary); font-style: italic;">${pa.summary}</span>` : ''}
                </div>
                ${pa.positives?.length > 0 ? `<div style="margin-bottom: 0.3rem;">${pa.positives.map(p => `<div style="font-size: 0.78rem; color: #15803d; display: flex; gap: 0.35rem; margin-bottom: 0.15rem;"><span>✓</span><span>${p}</span></div>`).join('')}</div>` : ''}
                ${pa.negatives?.length > 0 ? `<div>${pa.negatives.map(n => `<div style="font-size: 0.78rem; color: #b91c1c; display: flex; gap: 0.35rem; margin-bottom: 0.15rem;"><span>✗</span><span>${n}</span></div>`).join('')}</div>` : ''}
                ` : ''}
            </div>`;
    }

    // HR-led
    let badge = '';
    if      (ansData.value === 'yes') badge = `<span style="background:rgba(16,185,129,0.1);color:var(--success);padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.75rem;font-weight:600;">${getLang()==='hu'?'Igen':'Yes'}</span>`;
    else if (ansData.value === 'no')  badge = `<span style="background:rgba(239,68,68,0.1);color:var(--danger);padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.75rem;font-weight:600;">${getLang()==='hu'?'Nem':'No'}</span>`;
    else if (ansData.value === 'na')  badge = `<span style="background:rgba(245,158,11,0.1);color:var(--warning);padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.75rem;font-weight:600;">N/A</span>`;
    else badge = `<span style="background:var(--border-color);color:var(--text-secondary);padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.75rem;font-weight:600;">${getLang()==='hu'?'Nincs megadva':'Not specified'}</span>`;

    const noteHtml = ansData.note
        ? `<div style="background:var(--bg-primary);padding:1rem;border-radius:var(--radius-md);margin-top:0.75rem;font-size:0.875rem;"><span style="color:var(--text-secondary);font-weight:500;display:block;margin-bottom:0.25rem;">${t('eval.hr_note')}:</span>${ansData.note}</div>`
        : '';

    return badge + noteHtml;
}

// ─── Exit Interview Display ───────────────────────────────────────────────────

function renderExitDisplay(container, interview) {
    const ed = interview.exitData || {};
    const reasonLabels = {
        better_offer: getLang() === 'hu' ? 'Jobb ajánlat máshol' : 'Better offer elsewhere',
        career_growth: getLang() === 'hu' ? 'Karrier / fejlődési lehetőség' : 'Career growth',
        management: getLang() === 'hu' ? 'Kollégiális / vezetői problémák' : 'Management issues',
        salary: getLang() === 'hu' ? 'Bérezés' : 'Salary',
        worklife: getLang() === 'hu' ? 'Munka–magánélet egyensúly' : 'Work-life balance',
        relocation: getLang() === 'hu' ? 'Költözés / személyes okok' : 'Relocation',
        other: getLang() === 'hu' ? 'Egyéb' : 'Other'
    };
    const recMap = { 
        yes:   `✅ ${getLang() === 'hu' ? 'Igen' : 'Yes'}`, 
        maybe: `🤔 ${getLang() === 'hu' ? 'Talán' : 'Maybe'}`, 
        no:    `❌ ${getLang() === 'hu' ? 'Nem' : 'No'}` 
    };
    const dateStr = new Date(interview.date).toLocaleString(getLang() === 'hu' ? 'hu-HU' : 'en-US');

    container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                <i data-lucide="arrow-left"></i> ${t('role.back')}
            </button>
            <div class="flex justify-between items-start">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 600;">${t('exit.title')}: ${interview.candidateName}</h2>
                    <div class="flex gap-4 mt-2" style="font-size: 0.875rem; color: var(--text-secondary); flex-wrap: wrap;">
                        <span><i data-lucide="calendar" style="width: 1rem;"></i> ${dateStr}</span>
                        ${interview.issuedByName ? `<span><i data-lucide="send" style="width: 1rem;"></i> ${getLang()==='hu'?'Küldte':'Sent by'}: <strong>${interview.issuedByName}</strong></span>` : ''}
                    </div>
                </div>
                <div style="background:rgba(245,158,11,0.1);border:1px solid var(--warning);color:var(--warning);border-radius:var(--radius-round);padding:0.4rem 1rem;font-size:0.875rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;">
                    <i data-lucide="log-out" style="width:1rem;"></i> ${getLang()==='hu'?'Kilépő':'Exit'}
                </div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
            <div class="card">
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);margin-bottom:0.75rem;">${getLang()==='hu'?'Alapadatok':'Basic Info'}</div>
                ${ed.dept   ? `<div class="mb-2"><span style="color:var(--text-secondary);font-size:0.8rem;">${t('exit.dept_label').replace(' *','').replace(':','')}:</span><div style="font-weight:500;">${ed.dept}</div></div>` : ''}
                ${ed.reason ? `<div class="mb-2"><span style="color:var(--text-secondary);font-size:0.8rem;">${getLang()==='hu'?'Kilépés oka':'Exit reason'}:</span><div style="font-weight:500;">${reasonLabels[ed.reason]||ed.reason}</div></div>` : ''}
                ${ed.recommend ? `<div><span style="color:var(--text-secondary);font-size:0.8rem;">${getLang()==='hu'?'Ajánlás':'Recommendation'}:</span><div style="font-weight:500;">${recMap[ed.recommend]||ed.recommend}</div></div>` : ''}
            </div>
            <div class="card">
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);margin-bottom:0.75rem;">${t('exit.liked_label').replace(' *','')}</div>
                <p style="font-size:0.9375rem;line-height:1.6;">${ed.liked||`<em style="color:var(--text-secondary)">${t('eval.ans_none')}</em>`}</p>
            </div>
        </div>
        ${ed.improve ? `<div class="card mb-6"><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);margin-bottom:0.75rem;">${t('exit.improve_label')}</div><p style="font-size:0.9375rem;line-height:1.6;">${ed.improve}</p></div>` : ''}
        ${ed.other   ? `<div class="card mb-6"><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);margin-bottom:0.75rem;">${t('exit.other_label')}</div><p style="font-size:0.9375rem;line-height:1.6;">${ed.other}</p></div>` : ''}

        <div class="card">
            <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;">HR Belső Megjegyzés</h3>
            <textarea id="hr-final-eval" class="form-textarea" placeholder="Megjegyzések a kilépési interjúhoz...">${interview.hrEvaluation||''}</textarea>
            <div class="mt-4 flex justify-end">
                <button class="btn btn-primary" id="btn-save-eval"><i data-lucide="save"></i> Mentés</button>
            </div>
        </div>`;

    lucide.createIcons();
    document.getElementById('btn-save-eval')?.addEventListener('click', () => {
        interview.hrEvaluation = document.getElementById('hr-final-eval').value;
        window.appStore._saveInterviews();
        const btn = document.getElementById('btn-save-eval');
        btn.innerHTML = `<i data-lucide="check"></i> ${getLang()==='hu'?'Mentve!':'Saved!'}`; btn.classList.replace('btn-primary','btn-success'); lucide.createIcons();
        setTimeout(() => { btn.innerHTML = `<i data-lucide="save"></i> ${t('role.save')}`; btn.classList.replace('btn-success','btn-primary'); lucide.createIcons(); }, 2000);
    });
}

// ─── Main Evaluation ──────────────────────────────────────────────────────────

export async function renderEvaluation(container, params = {}) {
    const interviewId = params.interviewId;
    const interviews  = window.appStore.getInterviews();
    const interview   = interviews.find(i => i.id === interviewId);

    if (!interview) {
        container.innerHTML = `<p>Hiba: Interjú nem található.</p><button class="btn btn-secondary" onclick="window.navigateTo('dashboard')">Vissza</button>`;
        return;
    }
    if (interview.type === 'exit') { renderExitDisplay(container, interview); return; }

    const role        = window.appStore.getRoleById(interview.roleId);
    const dateStr     = new Date(interview.date).toLocaleString('hu-HU');
    const durationMins = Math.floor(interview.duration / 60);
    const durationSecs = interview.duration % 60;
    const pd          = interview.personalData || {};
    const hireStatus  = interview.hireStatus || 'pending';
    const hireLabels  = {
        hired:    { label: 'Felvéve',         color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', icon: 'user-check' },
        rejected: { label: 'Visszautasítva',  color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',  icon: 'user-x' },
        pending:  { label: 'Döntés függőben', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', icon: 'clock' }
    };
    const hs = hireLabels[hireStatus];

    // Determine HR-led score (objective yes/no counts, no AI needed)
    let hrScoreHtml = '';
    if (!interview.isSelfAssessment && role) {
        let earned = 0, max = 0, strengths = [], weaknesses = [], neutral = [];
        role.questions.forEach(q => {
            const a = interview.answers[q.id] || {};
            max += 2;
            if (a.value === 'yes')     { earned += 2; strengths.push(q.text); }
            else if (a.value === 'na') { earned += 1; neutral.push(q.text); }
            else if (a.value === 'no') { weaknesses.push(q.text); }
        });
        const sc = max > 0 ? Math.round((earned / max) * 100) : 0;
        const co = scoreColor(sc);
        hrScoreHtml = `
            <div class="card mb-6" style="padding: 2rem;">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="bar-chart-2" style="width: 1.125rem; color: var(--accent);"></i> Interjú Eredménye
                </h3>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 2rem; align-items: start;">
                    <div style="text-align:center; min-width:130px;">
                        ${svgCircle(sc, co)}
                        <div style="margin-top:0.25rem;font-size:2rem;font-weight:800;color:${co};line-height:1;">${sc}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.08em;">/100 pont</div>
                        <div style="margin-top:0.5rem;display:inline-block;background:${co}20;color:${co};font-weight:700;font-size:0.8rem;padding:0.25rem 0.75rem;border-radius:1rem;border:1px solid ${co}40;">${scoreLabel(sc)}</div>
                    </div>
                    <div>
                        ${strengths.length > 0 ? `<div style="margin-bottom:1rem;"><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--success);margin-bottom:0.5rem;">✓ Erősségek (${strengths.length})</div>${strengths.map(q=>`<div style="font-size:0.8rem;padding:0.35rem 0.5rem;background:rgba(16,185,129,0.06);border-left:2px solid var(--success);border-radius:2px;margin-bottom:0.25rem;">${q}</div>`).join('')}</div>` : ''}
                        ${weaknesses.length > 0 ? `<div style="margin-bottom:1rem;"><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--danger);margin-bottom:0.5rem;">✗ Fejlesztendő (${weaknesses.length})</div>${weaknesses.map(q=>`<div style="font-size:0.8rem;padding:0.35rem 0.5rem;background:rgba(239,68,68,0.06);border-left:2px solid var(--danger);border-radius:2px;margin-bottom:0.25rem;">${q}</div>`).join('')}</div>` : ''}
                        ${neutral.length > 0 ? `<div><div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);margin-bottom:0.5rem;">~ N/A (${neutral.length})</div>${neutral.map(q=>`<div style="font-size:0.8rem;padding:0.35rem 0.5rem;background:var(--bg-primary);border-left:2px solid var(--border-color);border-radius:2px;margin-bottom:0.25rem;">${q}</div>`).join('')}</div>` : ''}
                    </div>
                </div>
            </div>`;
    }

    // Build main shell (AI card injected async below)
    container.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <button class="btn btn-secondary" onclick="window.navigateTo('dashboard')">
                    <i data-lucide="arrow-left"></i> Vissza az irányítópultra
                </button>
                <button class="btn btn-primary" id="btn-export-pdf" style="font-size: 0.875rem;">
                    <i data-lucide="download"></i> Letöltés PDF-ben
                </button>
            </div>
            <div class="flex justify-between items-start" id="pdf-header">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 600;">Kiértékelés: ${interview.candidateName}</h2>
                    <p style="color: var(--text-secondary);" class="mt-1">Munkakör: <strong style="color: var(--text-primary);">${role ? role.title : 'Törölt munkakör'}</strong></p>
                </div>
                <div style="display:inline-flex;align-items:center;gap:0.5rem;background:var(--bg-secondary);padding:0.5rem 1rem;border-radius:var(--radius-round);border:1px solid var(--border-color);font-size:0.875rem;">
                    <i data-lucide="${interview.isSelfAssessment ? 'laptop' : 'users'}" style="width:1rem;color:var(--accent);"></i>
                    ${interview.isSelfAssessment ? 'Önálló kitöltés' : 'HR által bevezetett'}
                </div>
            </div>
            <div class="flex gap-4 mt-4" style="color:var(--text-secondary);font-size:0.875rem;flex-wrap:wrap;">
                <span><i data-lucide="calendar" style="width:1rem;"></i> ${dateStr}</span>
                <span><i data-lucide="clock" style="width:1rem;"></i> ${durationMins}p ${durationSecs}mp</span>
                ${interview.issuedByName ? `<span><i data-lucide="send" style="width:1rem;"></i> Link: <strong style="color:var(--text-primary);">${interview.issuedByName}</strong></span>` : ''}
            </div>
        </div>

        <div id="pdf-content">
            ${hrScoreHtml}

        <!-- AI score card placeholder (filled async) -->
        ${interview.isSelfAssessment ? renderAiLoadingCard() : ''}

        <!-- Personal + Hire -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
            <div class="card">
                <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
                    <i data-lucide="user" style="width:1.125rem;color:var(--accent);"></i> Személyes adatok
                </h3>
                ${pd.birthDate || pd.address ? `
                    ${pd.birthDate ? `<div class="mb-2"><div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Születési idő</div><div>${new Date(pd.birthDate).toLocaleDateString('hu-HU')}</div></div>` : ''}
                    ${pd.address   ? `<div><div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Lakcím</div><div>${pd.address}</div></div>` : ''}
                ` : `<p style="color:var(--text-secondary);font-size:0.875rem;">HR által rögzített interjú.</p>`}
            </div>
            <div class="card">
                <h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
                    <i data-lucide="badge-check" style="width:1.125rem;color:var(--accent);"></i> Felvétel döntése
                </h3>
                <div style="background:${hs.bg};border:1px solid ${hs.color};border-radius:var(--radius-md);padding:0.75rem 1rem;display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                    <i data-lucide="${hs.icon}" style="width:1.25rem;color:${hs.color};flex-shrink:0;"></i>
                    <strong style="color:${hs.color};">${hs.label}</strong>
                </div>
                <div style="display:flex;gap:0.5rem;margin-bottom:${hireStatus==='hired'?'1rem':'0'};">
                    <button class="btn hire-btn ${hireStatus==='hired'?'btn-success':'btn-secondary'}" data-val="hired" style="flex:1;font-size:0.8rem;padding:0.5rem;"><i data-lucide="user-check"></i> Felvéve</button>
                    <button class="btn hire-btn ${hireStatus==='pending'?'btn-warning':'btn-secondary'}" data-val="pending" style="flex:1;font-size:0.8rem;padding:0.5rem;"><i data-lucide="clock"></i> Függőben</button>
                    <button class="btn hire-btn ${hireStatus==='rejected'?'btn-danger':'btn-secondary'}" data-val="rejected" style="flex:1;font-size:0.8rem;padding:0.5rem;"><i data-lucide="user-x"></i> Visszautasítva</button>
                </div>
                ${hireStatus === 'hired' ? `
                <div style="border-top:1px solid var(--border-color);padding-top:0.75rem;">
                    <div style="margin-bottom:0.75rem;">
                        <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.4rem;">Belépési dátum</div>
                        <div style="display:flex;gap:0.5rem;align-items:center;">
                            <input type="date" id="hire-date-input" class="form-input" style="flex:1;" value="${interview.hireDate || ''}" max="${new Date().toISOString().slice(0,10)}">
                            <button class="btn btn-secondary" id="btn-save-hire-date" style="white-space:nowrap;font-size:0.8rem;padding:0.5rem 0.9rem;">
                                <i data-lucide="save" style="width:0.875rem;"></i> Mentés
                            </button>
                        </div>
                        ${interview.hireDate ? `<div style="font-size:0.75rem;color:var(--success);margin-top:0.3rem;">✓ Belépett: ${new Date(interview.hireDate).toLocaleDateString('hu-HU')}</div>` : '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.3rem;">Belépési dátum nincs rögzítve</div>'}
                    </div>
                    <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.5rem;">Kilépéskor küldd el a kérdőívet:</p>
                    <button class="btn btn-secondary" id="btn-gen-exit" style="width:100%;font-size:0.8rem;">
                        <i data-lucide="log-out"></i> Kilépő kérdőív link
                    </button>
                </div>` : ''}
            </div>
        </div>

        <!-- Questions & Answers -->
        <div class="card mb-6" id="qa-section">
            <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:1.5rem;">Kérdések és Válaszok</h3>
            <div style="display:flex;flex-direction:column;gap:1.5rem;">
                ${role ? role.questions.map((q, index) => {
                    const ansData = interview.answers[q.id] || {};
                    return `
                        <div style="border-bottom:1px solid var(--border-color);padding-bottom:1.5rem;${index===role.questions.length-1?'border-bottom:none;padding-bottom:0;':''}" data-qid="${q.id}">
                            <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                                <div style="color:var(--text-secondary);font-weight:600;padding-top:0.125rem;min-width:1.25rem;">${index+1}.</div>
                                <div style="flex:1;">
                                    <h4 style="font-weight:500;font-size:1rem;margin-bottom:0.5rem;">${q.text}</h4>
                                    <div class="ans-feedback">${renderAnswerFeedback(q, ansData, null, interview.isSelfAssessment)}</div>
                                </div>
                            </div>
                        </div>`;
                }).join('') : '<p>A munkakör törölve lett.</p>'}
            </div>
        </div>

        <!-- HR Final -->
        <div class="card">
            <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:1rem;">HR Záró Értékelés</h3>
            <textarea id="hr-final-eval" class="form-textarea" placeholder="Írd le a végső konklúziót...">${interview.hrEvaluation||''}</textarea>
            <div class="mt-4 flex justify-end">
                <button class="btn btn-primary" id="btn-save-eval"><i data-lucide="save"></i> Értékelés mentése</button>
            </div>
        </div> <!-- end #pdf-content -->
    `;

    lucide.createIcons();

    // Hire buttons
    container.querySelectorAll('.hire-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const newStatus = e.currentTarget.dataset.val;
            window.appStore.updateInterview(interview.id, { hireStatus: newStatus });
            renderEvaluation(container, params);
        });
    });

    // Save hire date
    document.getElementById('btn-save-hire-date')?.addEventListener('click', () => {
        const dateVal = document.getElementById('hire-date-input')?.value;
        if (dateVal) {
            window.appStore.updateInterview(interview.id, { hireDate: dateVal });
            interview.hireDate = dateVal;
            const btn = document.getElementById('btn-save-hire-date');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check"></i> Mentve!'; btn.classList.replace('btn-secondary','btn-success'); lucide.createIcons();
            setTimeout(() => { btn.innerHTML = orig; btn.classList.replace('btn-success','btn-secondary'); lucide.createIcons(); }, 2000);
            const hint = btn.closest('div')?.querySelector('[style*="margin-top:0.3rem"]');
            if (hint) { hint.style.color = 'var(--success)'; hint.textContent = '✓ Belépett: ' + new Date(dateVal).toLocaleDateString('hu-HU'); }
        }
    });

    // Save HR eval
    document.getElementById('btn-save-eval')?.addEventListener('click', () => {
        interview.hrEvaluation = document.getElementById('hr-final-eval').value;
        window.appStore._saveInterviews();
        const btn = document.getElementById('btn-save-eval');
        btn.innerHTML = `<i data-lucide="check"></i> Mentve!`; btn.classList.replace('btn-primary','btn-success'); lucide.createIcons();
        setTimeout(() => { btn.innerHTML = `<i data-lucide="save"></i> Értékelés mentése`; btn.classList.replace('btn-success','btn-primary'); lucide.createIcons(); }, 2000);
    });

    // Exit interview link
    document.getElementById('btn-gen-exit')?.addEventListener('click', () => {
        const user = window.appAuth.getUser();
        const issuedBy     = user ? user.id          : '';
        const issuedByName = user ? user.displayName : '';
        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?exit=1&name=${encodeURIComponent(interview.candidateName)}&issuedBy=${encodeURIComponent(issuedBy)}&issuedByName=${encodeURIComponent(issuedByName)}`;
        navigator.clipboard.writeText(url).then(() => {
            alert(`Kilépő link vágólapra másolva!\n\nDolgozó: ${interview.candidateName}\nURL: ${url}`);
        }).catch(() => { prompt('Másold ki a linket:', url); });
    });

    // PDF Export
    document.getElementById('btn-export-pdf')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-export-pdf');
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> Generálás...';
        btn.disabled = true;

        const element = document.getElementById('pdf-content');
        const opt = {
            margin:       10,
            filename:     `HR_Ertekeles_${interview.candidateName.replace(/\\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await window.html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error("PDF Generate Error", e);
            alert("Hiba történt a PDF generálása során.");
        } finally {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    });

    // ── AI Analysis ───────────────────────────────────────────────────────────
    if (interview.isSelfAssessment && role) {
        const aiCard = document.getElementById('ai-score-card');

        const runAiAnalysis = async (forceRefresh = false) => {
            // Show cached result if available and not forcing refresh
            if (!forceRefresh && interview.aiResult) {
                const dateStr = interview.aiResultDate
                    ? new Date(interview.aiResultDate).toLocaleString('hu-HU')
                    : null;

                if (aiCard) {
                    aiCard.outerHTML = renderAiResultCard(interview.aiResult, dateStr, interviewId);
                }
                lucide.createIcons();

                // Update Q&A rows with cached per-answer feedback
                role.questions.forEach(q => {
                    const row = container.querySelector(`[data-qid="${q.id}"] .ans-feedback`);
                    if (row) {
                        const ansData = interview.answers[q.id] || {};
                        row.innerHTML = renderAnswerFeedback(q, ansData, interview.aiResult.perAnswer, true);
                    }
                });

                // Attach re-evaluate button
                document.getElementById('btn-reevaluate-ai')?.addEventListener('click', () => {
                    // Re-insert loading card, then run fresh analysis
                    const card = document.getElementById('ai-score-card');
                    if (card) card.outerHTML = renderAiLoadingCard();
                    runAiAnalysis(true);
                });
                return;
            }

            // Fresh analysis (loading state already shown)
            try {
                const result = await analyzeInterview(interview, role);

                // Persist to store
                window.appStore.saveAiResult(interview.id, result);
                interview.aiResult = result;
                interview.aiResultDate = new Date().toISOString();

                const card = document.getElementById('ai-score-card');
                if (card) card.outerHTML = renderAiResultCard(result, new Date().toLocaleString('hu-HU'), interviewId);
                lucide.createIcons();

                role.questions.forEach(q => {
                    const row = container.querySelector(`[data-qid="${q.id}"] .ans-feedback`);
                    if (row) {
                        const ansData = interview.answers[q.id] || {};
                        row.innerHTML = renderAnswerFeedback(q, ansData, result.perAnswer, true);
                    }
                });

                document.getElementById('btn-reevaluate-ai')?.addEventListener('click', () => {
                    const card = document.getElementById('ai-score-card');
                    if (card) card.outerHTML = renderAiLoadingCard();
                    runAiAnalysis(true);
                });

            } catch (err) {
                const card = document.getElementById('ai-score-card');
                if (card) {
                    card.outerHTML = renderAiErrorCard(err.message, interviewId);
                    lucide.createIcons();
                    document.getElementById('btn-retry-ai')?.addEventListener('click', () => {
                        const c = document.getElementById('ai-score-card');
                        if (c) c.outerHTML = renderAiLoadingCard();
                        runAiAnalysis(true);
                    });
                }
            }
        };

        // Kick off — if cached result exists it shows instantly, otherwise shows loading+fetches
        if (!interview.aiResult && aiCard) {
            // loading card already rendered in the HTML above, just fetch
        }
        runAiAnalysis(false);
    }
}
