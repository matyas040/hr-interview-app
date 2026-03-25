// ─── Gemini AI Service ────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1/models';

export function getApiKey() {
    return localStorage.getItem('hr_gemini_api_key') || '';
}

export function setApiKey(key) {
    localStorage.setItem('hr_gemini_api_key', key.trim());
}

/**
 * Builds the prompt for Gemini — fully in Hungarian.
 */
function buildPrompt(interview, role) {
    const isSelf = interview.isSelfAssessment;
    const qas = role.questions.map((q, i) => {
        const a = interview.answers[q.id] || {};
        const answerText = isSelf
            ? (a.text || '(nem válaszolt)')
            : ({ yes: 'Igen', no: 'Nem', na: 'Nem releváns' }[a.value] || 'Nincs megadva');
        const typeLabel = q.answerType === 'short' ? '[RÖVID VÁLASZ ELVÁRT]' : '[RÉSZLETES VÁLASZ ELVÁRT]';
        return `${i + 1}. Kérdés (ID: ${q.id}) ${typeLabel}: ${q.text}\n   Válasz: ${answerText}${a.note ? '\n   Megjegyzés: ' + a.note : ''}`;
    }).join('\n\n');

    const context = isSelf
        ? `Ez egy önálló kitöltős kérdőív. A jelölt saját maga töltötte ki írásban.`
        : `Ez egy HR-es által lebonyolított interjú. Igen/Nem/Nem releváns válaszok vannak rögzítve.`;

    const perAnswerTemplate = role.questions.map(q => `{
      "questionId": "${q.id}",
      "score": <0-100 egész szám>,
      "grade": "<Kiváló|Jó|Megfelelő|Gyenge|Nem válaszolt>",
      "positives": <[] vagy ["konkrét, CSAK erre a válaszra vonatkozó pozitívum"]>,
      "negatives": <[] vagy ["konkrét, CSAK erre a válaszra vonatkozó hiányosság"]>,
      "summary": "<1 tömör mondat, ami CSAK erről a konkrét kérdésről és válaszról szól>"
    }`).join(',\n    ');

    const jdContext = role.jdText
        ? `\n\n--- MUNKAKÖRI LEÍRÁS (az értékelés alapja) ---\n${role.jdText.slice(0, 4000)}\n--- VÉGE ---`
        : (role.jdPdfBase64 ? '\n\n[A munkaköri leírás PDF-ben csatolva van az üzenet mellé — vedd figyelembe az értékelésnél!]' : '');

    return `Te egy tapasztalt HR elemző vagy. Feladatod egy interjú értékelése.

KONTEXTUS: ${context}
MUNKAKÖR: ${role.title}${jdContext}
JELÖLT: ${interview.candidateName}

--- KÉRDÉSEK ÉS VÁLASZOK ---
${qas}
--- VÉGE ---

Értékeld a jelöltet az alábbi JSON struktúrában. CSAK valid JSON-t adj vissza, semmilyen más szöveget.

KÖTELEZŐ ÉRTÉKELÉSI SZABÁLYOK — ezeket betartani kritikus:
1. SPECIFIKUSSÁG: Minden "perAnswer" elem KIZÁRÓLAG az adott kérdés + válasz párra vonatkozzon. Ha a mondat bármelyik másik kérdésnél is igaz lenne, akkor nem elég specifikus — írd újra.
2. ARÁNYOSSÁG: Minden kérdésnél jelölve van a várt válasz típusa. Ha [RÖVID VÁLASZ ELVÁRT], egy tömör 1-2 mondatos válasz is teljes pontot érhet — ne vonj le pontot a rövidség miatt. Ha [RÉSZLETES VÁLASZ ELVÁRT], elvárható a kifejtés; a felületes válasz kevesebb pontot érjen.
3. ÜRES LISTÁK: Ha nincs valódi pozitívum ami a válaszból következik → "positives": []. Ha nincs valódi negatívum → "negatives": []. Ne gyárts tölteléket.
4. ${isSelf ? 'Értékeld a konkrétságot és szakmai relevanciát — általános kijelentések alacsony pontot érjenek.' : 'Igen/Nem esetén a megjegyzés a lényeg. Megjegyzés nélküli igen/nem választ röviden és tárgyszerűen értékelj.'}

TILOS:
- Általános HR-zsargon konkrét alap nélkül (pl. "kommunikáció", "csapatmunka" — csak ha a válasz konkrétan szól erről)
- Ugyanazt a mondatot más szavakkal ismételni
- Pozitívumot/negatívumot kitalálni ott, ahol a válasz nem ad rá alapot

{
  "overallScore": <0-100 egész szám>,
  "overallLabel": "<Kiváló|Jó|Megfelelő|Gyenge|Nem ajánlott>",
  "summary": "<2-3 mondat, ami KIZÁRÓLAG a konkrét válaszok tartalmára épül, személyre szabottan>",
  "recommendation": "<Erősen ajánlott|Ajánlott|Megfontolásra ajánlott|Nem ajánlott>",
  "perAnswer": [
    ${perAnswerTemplate}
  ]
}`;
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
            contents: [{ parts: [{ text: 'Mondj egy rövid üdvözlő mondatot magyarul.' }] }]
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

    const prompt = `Te egy tapasztalt HR elemző vagy. Az alábbiakban ${exitInterviews.length} kilépő kolléga kilépési kérdőívének összefoglalója látható.

${exitSummaries}

Elemzési feladat: Azonosítsd a fő kilépési okokat, a visszatérő mintákat és a konkrét fejlesztési javaslatokat. Adj vissza CSAK valid JSON-t az alábbi struktúrában:

{
  "summary": "<3-4 mondatos összefoglaló: mi a legfőbb tendencia és mik a legkritikusabb területek>",
  "mainReasons": [
    "<1. leggyakoribb / legsúlyosabb ok konkrétan>",
    "<2. ok>",
    "<3. ok — max 5 elem>"
  ],
  "improvements": [
    "<1. konkrét, megvalósítható fejlesztési javaslat>",
    "<2. javaslat>",
    "<3. javaslat — max 6 elem>"
  ],
  "positives": [
    "<amit a kollégák pozitívként emeltek ki — max 4 elem>"
  ]
}

Szabályok:
- Kizárólag a megadott adatokra alapozz, ne általánosíts
- Magyar nyelvű válasz
- Ha valamelyik lista üres lenne (nincs elég adat), írj be egy megfelelő megjegyzést pl. "Nem volt elegendő adat az elemzéshez"`;

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
