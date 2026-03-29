import { t, getLang } from '../services/translations.js?v=37';

export function renderInterviewSetup(container, params = {}) {
    const roleId = params.roleId;
    const role = window.appStore.getRoleById(roleId);

    if (!role) {
        container.innerHTML = `<p>${t('error.no_role')}</p><button class="btn btn-secondary mt-4" onclick="window.navigateTo('dashboard')">${t('common.back')}</button>`;
        return;
    }

    container.innerHTML = `
        <div class="mb-6">
            <button class="btn btn-secondary mb-4" onclick="window.navigateTo('dashboard')">
                <i data-lucide="arrow-left"></i> ${t('role.back')}
            </button>
            <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--accent);">${t('setup.title')}</h2>
            <p style="color: var(--text-secondary);" class="mt-1">${getLang() === 'hu' ? 'Munkakör' : 'Role'}: <strong style="color: var(--text-primary); text-decoration: underline; text-decoration-color: var(--accent);">${role.title}</strong></p>
        </div>

        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div class="form-group">
                <label class="form-label">${t('setup.candidate_name')}</label>
                <input type="text" id="candidate-name" class="form-input" placeholder="pl. Kovács János" autocomplete="off" autofocus>
            </div>
            
            <div class="form-group">
                <label class="form-label">${t('setup.interview_date')}</label>
                <input type="datetime-local" id="interview-date" class="form-input" value="${new Date().toISOString().slice(0, 16)}">
            </div>
            
            <div class="form-group mb-0">
                <label class="form-label">${t('setup.mode_label')}</label>
                <select id="interview-mode" class="form-input">
                    <option value="hr">${t('setup.mode_hr')}</option>
                    <option value="candidate">${t('setup.mode_candidate')}</option>
                </select>
            </div>

            <div class="form-group mb-0">
                <label class="form-label">${getLang() === 'hu' ? 'Önéletrajz (CV) csatolása' : 'Attach CV'}</label>
                <div id="cv-upload-container" class="mt-2">
                    <input type="file" id="cv-file-input" style="display: none;" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                    <button class="btn btn-secondary w-full" id="btn-trigger-cv" style="width: 100%; border-style: dashed; border-width: 2px;">
                        <i data-lucide="upload"></i> ${getLang() === 'hu' ? 'Fájl választása' : 'Select File'}
                    </button>
                    <div id="cv-preview" class="mt-3" style="display: none; font-size: 0.85rem; padding: 0.75rem; background: var(--accent-soft); border-radius: 8px; border: 1px solid var(--accent);">
                        <div class="flex justify-between items-center">
                            <span id="cv-filename" style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
                            <button id="btn-remove-cv" style="color: var(--danger);"><i data-lucide="x" style="width: 14px;"></i></button>
                        </div>
                        <div id="cv-ai-status" class="mt-1" style="color: var(--text-secondary); font-style: italic;">
                            ${getLang() === 'hu' ? 'AI elemzés készítése...' : 'Generating AI analysis...'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-between items-center">
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    <i data-lucide="list-checks" style="width: 1rem; height: 1rem; vertical-align: middle;"></i> 
                    ${role.questions.length} ${t('setup.questions_count')}
                </p>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" id="btn-generate-link">
                        <i data-lucide="link"></i> ${t('setup.copy_link')}
                    </button>
                    <button class="btn btn-primary" id="btn-start-interview">
                        <i data-lucide="play"></i> ${t('setup.start_manual')}
                    </button>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    let uploadedCv = { base64: null, mimeType: null, fileName: null, analysis: null };

    const fileInput = document.getElementById('cv-file-input');
    const triggerBtn = document.getElementById('btn-trigger-cv');
    const previewDiv = document.getElementById('cv-preview');
    const filenameSpan = document.getElementById('cv-filename');
    const aiStatus = document.getElementById('cv-ai-status');

    triggerBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadedCv.fileName = file.name;
        uploadedCv.mimeType = file.type;
        filenameSpan.innerText = file.name;
        previewDiv.style.display = 'block';
        triggerBtn.style.display = 'none';
        aiStatus.innerText = getLang() === 'hu' ? '⏳ AI elemzés folyamatban...' : '⏳ AI analysis in progress...';

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target.result;
            uploadedCv.base64 = base64;

            try {
                const { analyzeCv } = await import('../services/aiService.js');
                const analysis = await analyzeCv(base64, file.type, role.title);
                uploadedCv.analysis = analysis;
                aiStatus.innerText = `✨ AI: ${analysis.substring(0, 150)}...`;
                aiStatus.style.color = 'var(--text-primary)';
            } catch (err) {
                console.error("CV Analysis failed:", err);
                aiStatus.innerText = getLang() === 'hu' ? '❌ AI elemzés sikertelen (túl nagy fájl vagy hiányzó kulcs).' : '❌ AI analysis failed (file too large or missing key).';
                aiStatus.style.color = 'var(--danger)';
            }
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('btn-remove-cv').addEventListener('click', () => {
        uploadedCv = { base64: null, mimeType: null, fileName: null, analysis: null };
        previewDiv.style.display = 'none';
        triggerBtn.style.display = 'block';
        fileInput.value = '';
    });

    document.getElementById('btn-start-interview').addEventListener('click', () => {
        const candidateName = document.getElementById('candidate-name').value.trim();
        const date = document.getElementById('interview-date').value;
        const mode = document.getElementById('interview-mode').value;

        if (!candidateName) {
            alert(t('setup.error_name'));
            document.getElementById('candidate-name').focus();
            return;
        }

        window.navigateTo('activeInterview', {
            roleId,
            candidateName,
            date,
            isTextMode: mode === 'candidate',
            cvData: uploadedCv.base64 ? {
                fileName: uploadedCv.fileName,
                mimeType: uploadedCv.mimeType,
                base64: uploadedCv.base64,
                analysis: uploadedCv.analysis
            } : null
        });
    });

    document.getElementById('btn-generate-link').addEventListener('click', () => {
        const candidateName = document.getElementById('candidate-name').value.trim();

        if (!candidateName) {
            alert(t('setup.error_name'));
            document.getElementById('candidate-name').focus();
            return;
        }

        const currentUser = window.appAuth.getUser();
        const issuedById   = currentUser ? currentUser.id       : '';
        const issuedByName = currentUser ? currentUser.displayName : '';

        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?candidate=1&role=${encodeURIComponent(roleId)}&name=${encodeURIComponent(candidateName)}&issuedBy=${encodeURIComponent(issuedById)}&issuedByName=${encodeURIComponent(issuedByName)}`;
        
        navigator.clipboard.writeText(url).then(() => {
            alert(`${t('setup.link_copied')}\n\nURL: ${url}`);
        }).catch(err => {
            prompt("URL:", url);
        });
    });
}
