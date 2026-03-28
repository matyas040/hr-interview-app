// ─── Gemini AI Service ────────────────────────────────────────────────────────
import { getLang } from './translations.js';

const GEMINI_MODEL = 'models/gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function getApiKey() {
    return localStorage.getItem('hr_gemini_api_key') || 'AIzaSyDMad8x3apyVMSOJUjYphyRfoe0MuBycUk';
}

export function setApiKey(key) {
    localStorage.setItem('hr_gemini_api_key', key.trim());
}

/**
 * Builds the prompt for Gemini — fully in Hungarian.
 */
function buildPrompt(interview, role) {
    const lang = getLang();
    const qas = role.questions.map((q, i) => {
        const a = interview.answers[q.id] || {};
        let answerText = '';
        const type = q.answerType || 'detailed';

        if (type === 'yes-no') {
            const map = lang === 'hu' ? { yes: 'Igen', no: 'Nem', na: 'N/A' } : { yes: 'Yes', no: 'No', na: 'N/A' };
            answerText = map[a.value] || (lang === 'hu' ? 'Nincs válasz' : 'No answer');
        } else if (type === 'yes-no-reason') {
            const map = lang === 'hu' ? { yes: 'Igen', no: 'Nem', na: 'N/A' } : { yes: 'Yes', no: 'No', na: 'N/A' };
            const val = map[a.value] || (lang === 'hu' ? 'Nincs választva' : 'Not selected');
            answerText = `${val}${a.note ? ` (${lang === 'hu' ? 'Indoklás' : 'Reason'}: ${a.note})` : ''}`;
        } else if (type === 'date') {
            answerText = a.text || (lang === 'hu' ? 'Nincs megadva' : 'Not specified');
        } else if (type === 'number') {
            answerText = a.text || '0';
        } else {
            // short, detailed, or legacy
            answerText = a.text || a.note || (lang === 'hu' ? '(nem válaszolt)' : '(no answer)');
        }
        
        const typeLabels = {
            'date': lang === 'hu' ? '[DÁTUM]' : '[DATE]',
            'number': lang === 'hu' ? '[SZÁM]' : '[NUMBER]',
            'short': lang === 'hu' ? '[RÖVID VÁLASZ]' : '[SHORT ANSWER]',
            'detailed': lang === 'hu' ? '[RÉSZLETES KIFEJTÉS]' : '[DETAILED EXPLANATION]',
            'yes-no': lang === 'hu' ? '[IGEN/NEM]' : '[YES/NO]',
            'yes-no-reason': lang === 'hu' ? '[IGEN/NEM + INDOKLÁS]' : '[YES/NO + REASON]'
        };
        const typeLabel = typeLabels[type] || '';
        
        const qLabel = lang === 'hu' ? 'Kérdés' : 'Question';
        const aLabel = lang === 'hu' ? 'Válasz' : 'Answer';

        return `${i + 1}. ${qLabel}: ${q.text} ${typeLabel}\n   ${aLabel}: ${answerText}`;
    }).join('\n\n');

    let context = '';
    if (interview.isTextMode) {
        context = lang === 'hu' 
            ? `Ez egy hibrid interjú (írógépes/felügyelt). Értékeld a szakmaiságot és a válaszok mélységét.`
            : `This is a hybrid interview (supervised typing). Evaluate professionalism and depth of answers.`;
    } else if (interview.isSelfAssessment) {
        context = lang === 'hu' 
            ? `Ez egy önállóan kitöltött kérdőív a jelölt által.` 
            : `This is a self-assessment questionnaire filled out by the candidate.`;
    } else {
        context = lang === 'hu' 
            ? `Ez egy HR által vezetett interjú, ahol különböző típusú válaszok lettek rögzítve.` 
            : `This is an HR-led interview where various types of answers were recorded.`;
    }

    const perAnswerTemplate = role.questions.map(q => `{
      "questionId": "${q.id}",
      "score": <0-100>,
      "grade": "${lang === 'hu' ? '<Kiváló|Jó|Megfelelő|Gyenge|Nem válaszolt>' : '<Excellent|Good|Fair|Poor|No answer>'}",
      "positives": <[] or ["string"]>,
      "negatives": <[] or ["string"]>,
      "summary": "<${lang === 'hu' ? '1 tömör mondat' : '1 concise sentence'}>"
    }`).join(',\n    ');

    const jdContext = role.jdText
        ? `\n\n--- MUNKAKÖRI LEÍRÁS (az értékelés alapja) ---\n${role.jdText.slice(0, 4000)}\n--- VÉGE ---`
        : (role.jdPdfBase64 ? '\n\n[A munkaköri leírás PDF-ben csatolva van — vedd figyelembe az elvárásoknál!]' : '');

    const systemInstructions = lang === 'hu' 
        ? `Te egy profi HR elemző vagy. Feladatod egy interjú kiértékelése a megadott munkakörhöz. VÁLASZOLJ MAGYARUL.
KONTEXTUS: ${context}
MUNKAKÖR: ${role.title}${jdContext}
JELÖLT: ${interview.candidateName}

--- KÉRDÉSEK ÉS VÁLASZOK ---
${qas}
--- VÉGE ---

Értékeld a jelöltet az alábbi JSON struktúrában. CSAK valid JSON-t adj vissza.
KÖTELEZŐ SZABÁLYOK:
1. SPECIFIKUSSÁG: Csak az adott válaszokat vizsgáld.
2. NYELV: Az értékelés szövege magyar legyen.
3. FORMÁTUM: Vedd figyelembe a válasz típusát (pl. egy szám vagy dátum relevanciáját a munkakörhöz).

{
  "overallScore": <0-100>,
  "overallLabel": "<Kiváló|Jó|Megfelelő|Gyenge|Nem ajánlott>",
  "summary": "<összefoglaló>",
  "recommendation": "<Erősen ajánlott|Ajánlott|Megfontolásra ajánlott|Nem ajánlott>",
  "perAnswer": [ ${perAnswerTemplate} ]
}`
        : `You are a professional HR analyst. Evaluate the interview for the given role. ANSWER IN ENGLISH.
CONTEXT: ${context}
ROLE: ${role.title}${jdContext}
CANDIDATE: ${interview.candidateName}

--- QUESTIONS AND ANSWERS ---
${qas}
--- END ---

Evaluate the candidate in the following JSON structure. Return ONLY valid JSON.
MANDATORY RULES:
1. SPECIFICITY: Only evaluate the provided answers.
2. LANGUAGE: Evaluation text MUST be in English.
3. FORMAT: Consider the type of the answer (e.g., relevance of a number or date to the role).

{
  "overallScore": <0-100>,
  "overallLabel": "<Excellent|Good|Fair|Poor|Not recommended>",
  "summary": "<summary>",
  "recommendation": "<Strongly recommended|Recommended|Consider|Not recommended>",
  "perAnswer": [ ${perAnswerTemplate} ]
}`;

    return systemInstructions;
}

/**
 * Main async function: sends prompt to Gemini, returns structured result.
 * Throws on network / API error with a user-friendly message.
 */
export async function analyzeInterview(interview, role) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const prompt = buildPrompt(interview, role);

    // Build parts array — add PDF job description as inlineData if available
    const parts = [{ text: prompt }];
    if (role.jdPdfBase64) {
        parts.push({
            inlineData: {
                mimeType: 'application/pdf',
                data: role.jdPdfBase64
            }
        });
    }

    const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.3
            }
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${res.status}`;
        if (res.status === 400 && msg.toLowerCase().includes('api key')) throw new Error('INVALID_KEY');
        if (res.status === 400 && msg.toLowerCase().includes('invalid argument'))
            throw new Error(msg);
        if (res.status === 403 || (res.status === 400 && msg.toLowerCase().includes('key'))) throw new Error('INVALID_KEY');
        if (res.status === 429) throw new Error('QUOTA_EXCEEDED');
        throw new Error(msg);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Üres válasz érkezett az AI-tól.');

    // Strip possible markdown fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
}

/**
 * Test ping — sends a tiny prompt to verify the API key works.
 * Returns true if OK, throws with message if not.
 */
export async function testApiKey(apiKey) {
    const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: getLang() === 'hu' ? 'Mondj egy rövid üdvözlő mondatot magyarul.' : 'Say a short welcome sentence in English.' }] }]
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    return true;
}

/**
 * Generates a turnover analysis report from exit interview data.
 * exitInterviews: array of interview objects with type === 'exit'
 * Returns: { summary, mainReasons: [], improvements: [], positives: [] }
 */
export async function generateTurnoverReport(exitInterviews) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const reasonLabels = {
        better_offer: 'Jobb ajánlat máshol',
        career_growth: 'Karrier / fejlődési lehetőség',
        management: 'Vezetői / kollegiális problémák',
        salary: 'Bérezés',
        worklife: 'Munka–magánélet egyensúly',
        relocation: 'Költözés / személyes okok',
        other: 'Egyéb'
    };

    const exitSummaries = exitInterviews.map((i, idx) => {
        const ed = i.exitData || {};
        return `${idx + 1}. Kilépő: ${i.candidateName || '(ismeretlen)'}
   Kilépési ok: ${reasonLabels[ed.reason] || ed.reason || '(nem adta meg)'}
   Ajánlja-e a céget: ${ed.recommend === 'yes' ? 'Igen' : ed.recommend === 'maybe' ? 'Talán' : ed.recommend === 'no' ? 'Nem' : '(nem adta meg)'}
   Mi tetszett: ${ed.liked || '(nem adta meg)'}
   Javaslatok: ${ed.improve || '(nem adta meg)'}
   Egyéb: ${ed.other || '–'}`;
    }).join('\n\n');

    const lang = getLang();
    const prompt = lang === 'hu'
        ? `Te egy tapasztalt HR elemző vagy. Az alábbiakban ${exitInterviews.length} kilépő kolléga kérdőíve látható.
${exitSummaries}
Elemzési feladat: Azonosítsd a mintákat. Adj vissza CSAK valid JSON-t. VÁLASZOLJ MAGYARUL.
{
  "summary": "<összefoglaló>",
  "mainReasons": ["ok1", "ok2"],
  "improvements": ["javaslat1"],
  "positives": ["pozitív1"]
}`
        : `You are an experienced HR analyst. Below are ${exitInterviews.length} exit interview summaries.
${exitSummaries}
Task: Identify patterns. Return ONLY valid JSON. ANSWER IN ENGLISH.
{
  "summary": "<summary>",
  "mainReasons": ["reason1", "reason2"],
  "improvements": ["improvement1"],
  "positives": ["positive1"]
}`;

    const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Üres válasz érkezett az AI-tól.');

    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
}

/**
 * Generates 20 interview questions based on a Job Description.
 * Returns: Array of { text, answerType }
 */
export async function generateInterviewQuestions(jdText, jdPdfBase64, role) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const lang = getLang();
    const prompt = lang === 'hu'
        ? `Te egy Senior Technikai Recruiter vagy. Feladatod 20 darab releváns interjúkérdés generálása az alábbi munkakörhöz: "${role?.title || 'Ismeretlen'}".
TÖREKEDJ A RELEVÁNS SZAKMAI TUDÁSRA: Ne csak a megadott leírást ismételd, hanem hozz be külső szakmai szempontokat is a munkakör neve alapján.
KÉRÉS: A kérdések legalább 60%-a legyen "rövid, eldöntendő vagy gyorsan megválaszolható" (short), a maradék pedig "kifejtős vagy szituációs" (detailed).
VÁLASZOLJ MAGYARUL. Adj vissza KIZÁRÓLAG egy JSON tömböt az alábbi formátumban:
[
  { "text": "Kérdés szövege", "answerType": "short|detailed" }
]`
        : `You are a Senior Technical Recruiter. Your task is to generate 20 relevant interview questions for the following role: "${role?.title || 'Unknown'}".
PRIORITIZE PROFESSIONAL KNOWLEDGE: Don't just parrot the provided description; bring in external professional context based on the job title.
REQUEST: At least 60% of questions should be "short, direct, or quick-answer" (short), while the rest should be "open-ended or situational" (detailed).
ANSWER IN ENGLISH. Return ONLY a JSON array in the following format:
[
  { "text": "Question text", "answerType": "short|detailed" }
]`;

    const parts = [{ text: prompt }];
    if (jdPdfBase64) {
        parts.push({
            inlineData: { mimeType: 'application/pdf', data: jdPdfBase64 }
        });
    }
    if (jdText) {
        parts[0].text += `\n\n--- MUNKAKÖRI LEÍRÁS ---\n${jdText}\n--- VÉGE ---`;
    }

    const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.7 }
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Üres válasz az AI-tól.');

    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
}
