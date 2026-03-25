export function renderInterviewSetup(container, params = {}) {
    const roleId = params.roleId;
    const role = window.appStore.getRoleById(roleId);

    if (!role) {
        container.innerHTML = `<p>Hiba: Nincs ilyen munkakör.</p><button class="btn btn-secondary mt-4" onclick="window.navigateTo('dashboard')">Vissza</button>`;
        return;
    }

    container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                <i data-lucide="arrow-left"></i> Vissza az irányítópultra
            </button>
            <h2 style="font-size: 1.5rem; font-weight: 600;">Interjú előkészítése</h2>
            <p style="color: var(--text-secondary);" class="mt-1">Munkakör: <strong style="color: var(--text-primary);">${role.title}</strong></p>
        </div>

        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div class="form-group">
                <label class="form-label">Jelölt neve</label>
                <input type="text" id="candidate-name" class="form-input" placeholder="pl. Kovács János" autocomplete="off" autofocus>
            </div>
            
            <div class="form-group">
                <label class="form-label">Interjú dátuma</label>
                <input type="datetime-local" id="interview-date" class="form-input" value="${new Date().toISOString().slice(0, 16)}">
            </div>

            <div class="mt-6 flex justify-between items-center">
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    <i data-lucide="list-checks" style="width: 1rem; height: 1rem; vertical-align: middle;"></i> 
                    ${role.questions.length} kérdés lesz feltéve
                </p>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" id="btn-generate-link">
                        <i data-lucide="link"></i> Link generálása
                    </button>
                    <button class="btn btn-primary" id="btn-start-interview">
                        <i data-lucide="play"></i> Interjú megkezdése
                    </button>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    document.getElementById('btn-start-interview').addEventListener('click', () => {
        const candidateName = document.getElementById('candidate-name').value.trim();
        const date = document.getElementById('interview-date').value;

        if (!candidateName) {
            alert('Kérlek add meg a jelölt nevét!');
            document.getElementById('candidate-name').focus();
            return;
        }

        window.navigateTo('activeInterview', {
            roleId,
            candidateName,
            date
        });
    });

    document.getElementById('btn-generate-link').addEventListener('click', () => {
        const candidateName = document.getElementById('candidate-name').value.trim();

        if (!candidateName) {
            alert('A link generálásához is szükséges egy azonosító név!');
            document.getElementById('candidate-name').focus();
            return;
        }

        const currentUser = window.appAuth.getCurrentUser();
        const issuedById   = currentUser ? currentUser.id       : '';
        const issuedByName = currentUser ? currentUser.displayName : '';

        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?candidate=1&role=${encodeURIComponent(roleId)}&name=${encodeURIComponent(candidateName)}&issuedBy=${encodeURIComponent(issuedById)}&issuedByName=${encodeURIComponent(issuedByName)}`;
        
        navigator.clipboard.writeText(url).then(() => {
            alert(`A link a vágólapra másolva!\nElküldheted a jelöltnek: ${candidateName}\n\nURL: ${url}`);
        }).catch(err => {
            prompt("Másold ki a linket alul:", url);
        });
    });
}
