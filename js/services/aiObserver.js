import { analyzeInterview, getApiKey, analyzeCv } from './aiService.js';
import { getLang } from './translations.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'models/gemini-2.0-flash'; // Using 2.0 Flash for observer

/**
 * AI Observer Service
 * This service "watches" the system data and generates proactive insights,
 * alerts, and summaries for the HR Dashboard.
 */
export async function getSystemInsights(interviews, roles, exitInterviews) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const lang = getLang();
    
    // Prepare a condensed summary of the system state
    const rolesSummary = roles.map(r => `- ${r.title} (${r.questions.length} kérdés)`).join('\n');
    const recentInterviews = interviews.slice(-5).map(i => {
        const role = roles.find(r => r.id === i.roleId);
        return `- ${i.candidateName} (${role ? role.title : 'Ismeretlen'}): ${i.aiResult ? (i.aiResult.overallLabel || 'Nincs értékelve') : 'Nincs értékelve'}`;
    }).join('\n');
    
    const exitSummary = exitInterviews.slice(-3).map(i => {
        const ed = i.exitData || {};
        return `- ${i.candidateName || 'Ismeretlen'} távozott. Ok: ${ed.reason || 'nincs megadva'}. Ajánlja: ${ed.recommend || 'nincs megadva'}`;
    }).join('\n');

    const prompt = lang === 'hu' 
        ? `Te egy proaktív HR AI Megfigyelő vagy. Feladatod a rendszer adatainak elemzése és fontos "Észrevételek" vagy "Riasztások" generálása.
A rendszer jelenlegi állapota:

MUNKAKÖRÖK:
${rolesSummary}

LEGUTÓBBI INTERJÚK:
${recentInterviews}

LEGUTÓBBI KILÉPŐK:
${exitSummary}

FELADAT: Generálj 1-3 rövid, lényegre törő és proaktív észrevételt. 
Példák: 
- "Feltűnően sokan távoznak Karrier fejlődés hiánya miatt a Szoftverfejlesztő csapatból."
- "Kovács János interjúja kiemelkedő lett, érdemes lenne mielőbb felvenni vele a kapcsolatot."
- "A 'Sofőr' munkakörhöz kevés a kérdés, javasolt bővíteni az AI-val."

VÁLASZOLJ MAGYARUL. Adj vissza egy JSON tömböt az alábbi formátumban:
[
  { "type": "info|warning|success", "text": "Észrevétel szövege", "id": "egyedi_id" }
]`
        : `You are a proactive HR AI Observer. Analyze the system data and generate important "Insights" or "Alerts".
System state:

ROLES:
${rolesSummary}

RECENT INTERVIEWS:
${recentInterviews}

RECENT EXITS:
${exitSummary}

TASK: Generate 1-3 short, concise, and proactive insights.
Examples:
- "Noticeable turnover in the software team due to lack of career growth."
- "John Doe's interview was exceptional; consider contacting him immediately."
- "The 'Driver' role has too few questions; consider expanding with AI."

ANSWER IN ENGLISH. Return ONLY a JSON array in the following format:
[
  { "type": "info|warning|success", "text": "Insight text", "id": "unique_id" }
]`;

    try {
        const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        if (!res.ok) throw new Error(`AI Observer Error: ${res.status}`);
        
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("AI Observer failed:", err);
        return null;
    }
}
