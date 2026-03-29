---
description: HR Interjú Kezelő projekt gyors indítása és áttekintése
---

# HR Interjú Kezelő - Gyors visszatérés

## Projekt helye
// turbo
1. A projekt itt található: `/Users/matyasfekete/.gemini/antigravity/scratch/hr-interview-app`

## Élő oldal
2. Az alkalmazás GitHub Pages-en fut: https://matyas040.github.io/hr-interview-app/

## Technikai adatok

### Stack
- **Frontend**: Vanilla HTML + JavaScript (ES Modules)
- **CSS**: Vanilla CSS, design tokenek a `css/styles.css` fájlban
- **Backend**: Firebase Firestore (`hr-app2` adatbázis)
- **AI**: Google Gemini API (`gemini-2.5-flash` modell, `v1beta` végpont)
- **Hosting**: GitHub Pages (auto-deploy `main` ágról)

### Fájlszerkezet
```
hr-interview-app/
├── index.html              # Belépési pont (v=62 cache)
├── css/styles.css          # Dizájn tokenek (Midnight Orange)
├── js/
│   ├── app.js              # Fő alkalmazás + routing
│   ├── store.js            # Firestore adatkezelő
│   └── services/
│       ├── aiService.js    # Gemini AI elemzés (gemini-2.5-flash)
│       ├── aiObserver.js   # AI Observer (nem használt a dashboardon)
│       └── translations.js # HU/EN fordítások
│   └── views/
│       ├── dashboard.js    # Főoldal (munkakörök + interjúk)
│       ├── adminPanel.js   # Felhasználók, kilépő kérdések, API kulcs
│       ├── evaluation.js   # Interjú értékelés (AI elemzéssel)
│       ├── hrStats.js      # HR Statisztikák + fluktuáció elemzés
│       ├── roleManager.js  # Munkakör kezelés
│       └── ...             # Többi nézet
```

### Bejelentkezési adatok
- **Admin**: felhasználó: `admin`, jelszó: `admin123`
- Az adatok a Firebase `hr-app2` projektben tárolódnak

### AI Konfiguráció
- **Modell**: `models/gemini-2.5-flash`
- **Végpont**: `https://generativelanguage.googleapis.com/v1beta`
- **API kulcs**: A `localStorage`-ban (`hr_gemini_api_key`), az Admin panelen állítható
- **Fontos**: Ha a modell elavul, az elérhető modelleket így lehet lekérdezni:
  ```bash
  curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=API_KULCS" | python3 -c "import sys,json; [print(m['name']) for m in json.load(sys.stdin).get('models',[]) if 'generateContent' in m.get('supportedGenerationMethods',[])]"
  ```

### Dizájn
- **Téma**: Midnight Orange (fekete háttér + narancssárga akcentus)
- **Sötét mód háttér**: `#000000`
- **Akcentszín**: `#f97316` (Orange 500)
- **Glassmorphism**: Igen (backdrop-filter blur)

## Gyakori műveletek

### Deploy változtatás
// turbo
3. Változtatás pusholása:
```bash
cd /Users/matyasfekete/.gemini/antigravity/scratch/hr-interview-app && git add . && git commit -m "leírás" && git push origin main
```

### Cache-busting
4. Minden új push után növeld a verziószámot az `index.html` és `js/app.js` fájlokban (`?v=XX`).

### API kulcs tesztelése
// turbo
5. API tesztelés curl-lel:
```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=API_KULCS" -H "Content-Type: application/json" -d '{"contents":[{"parts":[{"text":"Teszt"}]}]}'
```

// turbo-all
