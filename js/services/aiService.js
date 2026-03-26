// ─── Gemini AI Service ────────────────────────────────────────────────────────
import { getLang } from './translations.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1/models';

export function getApiKey() {
    return localStorage.getItem('hr_gemini_api_key') || 'AIzaSyAxHUNFt0ewF7rn4nRAr5J7tzjQHZGG-aA';
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
        if (interview.isSelfAssessment) {
            answerText = a.text || (lang === 'hu' ? '(nem válaszolt)' : '(no answer)');
        } else {
            const map = lang === 'hu' 
                ? { yes: 'Igen', no: 'Nem', na: 'Nem releváns' }
                : { yes: 'Yes', no: 'No', na: 'Not relevant' };
            answerText = map[a.value] || (lang === 'hu' ? 'Nincs megadva' : 'Not specified');
        }
        const typeLabel = q.answerType === 'short' 
            ? (lang === 'hu' ? '[RÖVID VÁLASZ ELVÁRT]' : '[SHORT ANSWER EXPECTED]')
            : (lang === 'hu' ? '[RÉSZLETES VÁLASZ ELVÁRT]' : '[DETAILED ANSWER EXPECTED]');
        
        const qLabel = lang === 'hu' ? 'Kérdés' : 'Question';
        const aLabel = lang === 'hu' ? 'Válasz' : 'Answer';
        const nLabel = lang === 'hu' ? 'Megjegyzés' : 'Note';

        return `${i + 1}. ${qLabel} (ID: ${q.id}) ${typeLabel}: ${q.text}\n   ${aLabel}: ${answerText}${a.note ? `\n   ${nLabel}: ` + a.note : ''}`;
    }).join('\n\n');

    const context = interview.isSelfAssessment
        ? (lang === 'hu' ? `Ez egy önálló kitöltős kérdőív. A jelölt saját maga töltötte ki írásban.` : `This is a self-assessment questionnaire. The candidate filled it out in writing.`)
        : (lang === 'hu' ? `Ez egy HR-es által lebonyolított interjú. Igen/Nem/Nem releváns válaszok vannak rögzítve.` : `This is an interview conducted by HR. Yes/No/Not relevant answers are recorded.`);

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
        : (role.jdPdfBase64 ? '\n\n[A munkaköri leírás PDF-ben csatolva van az üzenet mellé — vedd figyelembe az értékelésnél!]' : '');

    const systemInstructions = lang === 'hu' 
        ? `Te egy tapasztalt HR elemző vagy. Feladatod egy interjú értékelése. VÁLASZOLJ MAGYARUL.
KONTEXTUS: ${context}
MUNKAKÖR: ${role.title}${jdContext}
JELÖLT: ${interview.candidateName}

--- KÉRDÉSEK ÉS VÁLASZOK ---
${qas}
--- VÉGE ---

Értékeld a jelöltet az alábbi JSON struktúrában. CSAK valid JSON-t adj vissza.
KÖTELEZŐ SZABÁLYOK:
1. SPECIFIKUSSÁG: Csak erre a válaszra vonatkozzon.
2. ARÁNYOSSÁG: Vedd figyelembe az elvárt válasz típusát.
3. NYELV: Az értékelés szövege magyar legyen.
4. ${interview.isSelfAssessment ? 'Értékeld a konkrétságot és szakmai relevanciát — általános kijelentések alacsony pontot érjenek.' : 'Igen/Nem esetén a megjegyzés a lényeg. Megjegyzés nélküli igen/nem választ röviden és tárgyszerűen értékelj.'}

{
  "overallScore": <0-100>,
  "overallLabel": "<Kiváló|Jó|Megfelelő|Gyenge|Nem ajánlott>",
  "summary": "<összefoglaló>",
  "recommendation": "<Erősen ajánlott|Ajánlott|Megfontolásra ajánlott|Nem ajánlott>",
  "perAnswer": [ ${perAnswerTemplate} ]
}`
        : `You are an experienced HR analyst. Your task is to evaluate an interview. ANSWER IN ENGLISH.
CONTEXT: ${context}
ROLE: ${role.title}${jdContext}
CANDIDATE: ${interview.candidateName}

--- QUESTIONS AND ANSWERS ---
${qas}
--- END ---

Evaluate the candidate in the following JSON structure. Return ONLY valid JSON.
MANDATORY RULES:
1. SPECIFICITY: Only relate to this specific answer.
2. PROPORTIONALITY: Consider the expected answer type.
3. LANGUAGE: Evaluation text MUST be in English.
4. ${interview.isSelfAssessment ? 'Evaluate for concreteness and professional relevance — general statements should receive low scores.' : 'For Yes/No answers, the note is key. Evaluate Yes/No answers without notes briefly and factually.'}

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
