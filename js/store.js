import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjlmIojGSgUUpds-cejwnlPkb0tZTynOc",
  authDomain: "hr-management-e24c7.firebaseapp.com",
  projectId: "hr-management-e24c7",
  storageBucket: "hr-management-e24c7.firebasestorage.app",
  messagingSenderId: "459645872929",
  appId: "1:459645872929:web:b0b7b76c730c248d2a2c60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "hr-app2");
const auth = getAuth(app);
console.log("🔥 Firebase: Csatlakozás a 'hr-app2' adatbázishoz és Auth rendszerhez...");

/**
 * Store class manages Firestore interactions with optimistic local state.
 * Syncs entire collections on initial load, then writes through to Firestore.
 */
export class Store {
    constructor() {
        this.roles = [];
        this.interviews = [];
        this.users = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log("🏪 Store: Firestore szinkronizáció indítása...");
        
        // Helper to add timeout to promises
        const timeout = (ms) => new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firebase időtúllépés: Ellenőrizd a Firestore Database 'Rules' fülét!")), ms)
        );

        try {
            console.log("🏪 Store: Kollekciók lekérése folyamatban...");
            // Load initial data from Firestore with a 10s timeout
            const [rolesSnap, interviewsSnap, usersSnap] = await Promise.race([
                Promise.all([
                    getDocs(collection(db, 'roles')),
                    getDocs(collection(db, 'interviews')),
                    getDocs(collection(db, 'users'))
                ]),
                timeout(10000)
            ]);

            console.log("🏪 Store: Adatok megérkeztek. Feldolgozás...");
            this.roles = rolesSnap.docs.map(d => d.data());
            this.interviews = interviewsSnap.docs.map(d => d.data());
            this.users = usersSnap.docs.map(d => d.data());

            // Seed default admin if no users exist
            if (this.users.length === 0) {
                console.log("🏪 Store: Alapértelmezett admin létrehozása...");
                const admin = { id: 'u_admin', username: 'admin', password: 'admin1234', role: 'admin', displayName: 'Rendszergazda' };
                this.users.push(admin);
                await setDoc(doc(db, 'users', admin.id), admin);
            }

            // Populate dummy role data if empty
            if (this.roles.length === 0) {
                console.log("🏪 Store: Alapértelmezett munkakör létrehozása...");
                const dummyRole = {
                    id: 'r_1',
                    title: 'Szoftverfejlesztő (Software Engineer)',
                    questions: [
                        { id: 'q_1', text: 'Rendelkezik-e tapasztalattal React és modern JS terén?', answerType: 'detailed' },
                        { id: 'q_2', text: 'Ismeri-e a verziókövető rendszereket (git)?', answerType: 'short' },
                        { id: 'q_3', text: 'Képes-e önállóan problémamegoldásra és csapatban dolgozni?', answerType: 'detailed' }
                    ]
                };
                this.roles.push(dummyRole);
                await setDoc(doc(db, 'roles', dummyRole.id), dummyRole);
            }

            this.initialized = true;
            console.log("🏪 Store: SIKERES Firestore inicializáció.");
        } catch (err) {
            console.error("🏪 Store: HIBA az inicializáció során:", err);
            throw err;
        }
    }

    // -- Roles --
    getRoles() {
        return this.roles;
    }

    getRoleById(id) {
        return this.roles.find(r => r.id === id);
    }

    addRole(title) {
        const newRole = {
            id: 'r_' + Date.now().toString(36),
            title,
            questions: []
        };
        this.roles.push(newRole);
        setDoc(doc(db, 'roles', newRole.id), newRole); // Fire and forget
        return newRole;
    }

    updateRole(id, title) {
        const role = this.getRoleById(id);
        if (role) {
            role.title = title;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    deleteRole(id) {
        this.roles = this.roles.filter(r => r.id !== id);
        deleteDoc(doc(db, 'roles', id));
    }

    // -- Questions --
    addQuestion(roleId, text, answerType = 'detailed') {
        const role = this.getRoleById(roleId);
        if (role) {
            role.questions.push({
                id: 'q_' + Date.now().toString(36),
                text,
                answerType
            });
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    updateQuestion(roleId, questionId, text) {
        const role = this.getRoleById(roleId);
        if (role) {
            const q = role.questions.find(q => q.id === questionId);
            if (q) q.text = text;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    updateQuestionType(roleId, questionId, answerType) {
        const role = this.getRoleById(roleId);
        if (role) {
            const q = role.questions.find(q => q.id === questionId);
            if (q) q.answerType = answerType;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    deleteQuestion(roleId, questionId) {
        const role = this.getRoleById(roleId);
        if (role) {
            role.questions = role.questions.filter(q => q.id !== questionId);
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    setRoleQuestions(roleId, questions) {
        const role = this.getRoleById(roleId);
        if (role) {
            role.questions = questions.map(q => ({
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                ...q
            }));
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    updateRolePdf(roleId, pdfBase64, pdfName) {
        const role = this.getRoleById(roleId);
        if (role) {
            role.pdfBase64 = pdfBase64;
            role.pdfName   = pdfName;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    clearRolePdf(roleId) {
        const role = this.getRoleById(roleId);
        if (role) {
            delete role.pdfBase64;
            delete role.pdfName;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    updateRoleJobDesc(roleId, data) {
        const role = this.getRoleById(roleId);
        if (role) {
            Object.assign(role, data);
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    clearRoleJobDesc(roleId) {
        const role = this.getRoleById(roleId);
        if (role) {
            delete role.jdText;
            delete role.jdPdfBase64;
            delete role.jdFileName;
            setDoc(doc(db, 'roles', role.id), role);
        }
    }

    // -- Interviews --
    getInterviews() {
        return this.interviews;
    }

    saveInterview(interviewData) {
        const newInterview = {
            id: 'i_' + Date.now().toString(36),
            ...interviewData
        };
        this.interviews.push(newInterview);
        setDoc(doc(db, 'interviews', newInterview.id), newInterview);
        return newInterview;
    }

    updateInterview(id, patch) {
        const interview = this.interviews.find(i => i.id === id);
        if (interview) {
            Object.assign(interview, patch);
            setDoc(doc(db, 'interviews', interview.id), interview);
        }
    }

    deleteInterview(id) {
        // Remove locally
        this.interviews = this.interviews.filter(i => i.id !== id);
        // Remove from Firestore
        deleteDoc(doc(db, 'interviews', id)).catch(err => {
            console.error("Error deleting interview:", err);
        });
    }

    saveAiResult(interviewId, aiResult) {
        const interview = this.interviews.find(i => i.id === interviewId);
        if (interview) {
            interview.aiResult = aiResult;
            interview.aiResultDate = new Date().toISOString();
            setDoc(doc(db, 'interviews', interview.id), interview);
        }
    }

    // _saveInterviews used by some old views
    _saveInterviews() {
        // Fallback for views that manually mutate this.interviews and call _saveInterviews()
        // We just re-upload ALL interviews that exist to Firestore
        this.interviews.forEach(i => {
           setDoc(doc(db, 'interviews', i.id), i); 
        });
    }

    // -- Users --
    getUsers() {
        return this.users;
    }

    getUserById(id) {
        return this.users.find(u => u.id === id);
    }

    authenticate(username, password) {
        return this.users.find(u => u.username === username && u.password === password) || null;
    }

    addUser({ displayName, username, password, role }) {
        const newUser = {
            id: 'u_' + Date.now().toString(36),
            displayName,
            username,
            password,
            role
        };
        this.users.push(newUser);
        setDoc(doc(db, 'users', newUser.id), newUser);
        return newUser;
    }

    updateUser(id, { displayName, username, role, password }) {
        const u = this.getUserById(id);
        if (u) {
            u.displayName = displayName;
            u.username    = username;
            u.role        = role;
            if (password) u.password = password;
            setDoc(doc(db, 'users', u.id), u);
        }
    }

    deleteUser(id) {
        this.users = this.users.filter(u => u.id !== id);
        deleteDoc(doc(db, 'users', id));
    }

    // -- Auth Bridge --
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async logout() {
        return signOut(auth);
    }

    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    }

    getAuth() {
        return auth;
    }
}
