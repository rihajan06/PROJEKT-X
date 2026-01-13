import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0b0aoLNcdDeMtD35OwQFrjVOUMsPO668",
  authDomain: "planovac-9cb71.firebaseapp.com",
  projectId: "planovac-9cb71",
  storageBucket: "planovac-9cb71.firebasestorage.app",
  messagingSenderId: "561773036564",
  appId: "1:561773036564:web:25a0b667c7a49b31db9301",
  measurementId: "G-N8R4GXWWD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    let activities = [];
    let users = [];
    let loggedInUser = null;

    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const activitiesListDiv = document.getElementById('activities-list');

    // POSLOUCHÁNÍ DATABÁZE
    onSnapshot(collection(db, "users"), (snapshot) => {
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (users.length === 0) {
            setDoc(doc(db, "users", "admin"), { username: 'admin', password: 'admin123', isAdmin: true, status: 'approved' });
        }
        if (loggedInUser?.isAdmin) renderRequests();
    });

    onSnapshot(collection(db, "activities"), (snapshot) => {
        activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderActivities();
    });

    // PŘEPÍNÁNÍ MEZI LOGINEM A REGISTRACÍ
    const toggleAuth = () => {
        document.getElementById('login-fields').classList.toggle('hidden');
        document.getElementById('register-fields').classList.toggle('hidden');
        document.getElementById('auth-title').textContent = document.getElementById('login-fields').classList.contains('hidden') ? 'New Request' : 'System Access';
    };

    document.getElementById('to-reg').onclick = toggleAuth;
    document.getElementById('to-login').onclick = toggleAuth;

    // REGISTRACE
    document.getElementById('reg-btn').onclick = async () => {
        const u = document.getElementById('reg-username').value;
        const p = document.getElementById('reg-password').value;
        if (!u || !p) return alert("Vyplň všechna pole!");
        if (users.find(user => user.username === u)) return alert("Uživatel už existuje!");

        await addDoc(collection(db, "users"), {
            username: u,
            password: p,
            isAdmin: false,
            status: 'pending'
        });
        alert("Žádost odeslána! Počkej na schválení adminem.");
        toggleAuth();
    };

    // PŘIHLÁŠENÍ
    document.getElementById('login-btn').onclick = () => {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const user = users.find(user => user.username === u && user.password === p);

        if (!user) return document.getElementById('auth-error').textContent = "Neplatné údaje!";
        if (user.status === 'pending') return document.getElementById('auth-error').textContent = "Účet čeká na schválení!";

        loggedInUser = user;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `USER: ${user.username}`;
        
        if (user.isAdmin) document.getElementById('admin-requests').classList.remove('hidden');
    };

    // ADMIN: SCHVALOVÁNÍ
    window.approveUser = async (id) => {
        await updateDoc(doc(db, "users", id), { status: 'approved' });
    };

    function renderRequests() {
        const list = document.getElementById('requests-list');
        const pending = users.filter(u => u.status === 'pending');
        list.innerHTML = pending.length ? pending.map(u => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#1a1a1a; padding:10px; border-radius:10px; border:1px solid var(--neon-purple);">
                <span>${u.username}</span>
                <button onclick="approveUser('${u.id}')" style="width:auto; padding:5px 10px; font-size:0.7rem;">APPROVE</button>
            </div>
        `).join('') : '<p style="color:gray; font-size:0.8rem;">No pending requests.</p>';
    }

    // AKTIVITY
    window.handleVote = async (id) => {
        const act = activities.find(a => a.id === id);
        let v = act.voters || [];
        const i = v.indexOf(loggedInUser.username);
        if (i > -1) v.splice(i, 1); else v.push(loggedInUser.username);
        await updateDoc(doc(db, "activities", id), { voters: v });
    };

    function renderActivities() {
        activitiesListDiv.innerHTML = activities
            .sort((a,b) => (b.voters?.length || 0) - (a.voters?.length || 0))
            .map(a => `
                <div class="activity-card">
                    <h3>${a.name}</h3>
                    <p>${a.description || ''}</p>
                    <div class="activity-info">📍 ${a.location || 'N/A'}</div>
                    <div class="activity-info">📅 ${a.date}</div>
                    <div class="activity-info">💰 ${a.cost || 0} €</div>
                    <button class="vote-btn ${(a.voters || []).includes(loggedInUser?.username) ? 'active' : ''}" onclick="handleVote('${a.id}')">
                        VOTE (${(a.voters || []).length})
                    </button>
                </div>
            `).join('');
    }

    document.getElementById('activity-form').onsubmit = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "activities"), {
            name: document.getElementById('activity-name').value,
            description: document.getElementById('activity-description').value,
            date: document.getElementById('activity-date').value,
            location: document.getElementById('activity-location').value,
            cost: document.getElementById('activity-cost').value,
            voters: []
        });
        e.target.reset();
    };

    document.getElementById('logout-button').onclick = () => window.location.reload();
});
