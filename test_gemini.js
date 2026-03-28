
const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-2.5-flash'];
const apiKey = 'AIzaSyDa30rkAtF5R6UPC83FXzG1TEPz6EScyW0';

async function test() {
    for (const m of models) {
        console.log(`Testing ${m}...`);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`✅ ${m} works!`);
                return;
            } else {
                console.log(`❌ ${m} failed: ${data.error?.message || res.statusText}`);
            }
        } catch (e) {
            console.log(`❌ ${m} error: ${e.message}`);
        }
    }
}

test();
