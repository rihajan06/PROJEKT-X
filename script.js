import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tvůj funkční config z konzole
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

    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const activitiesListDiv = document.getElementById('activities-list');

    // POSLOUCHÁNÍ DATABÁZE
    onSnapshot(collection(db, "users"), (snapshot) => {
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (users.length === 0) {
            setDoc(doc(db, "users", "admin"), { username: 'admin', password: 'admin123', isAdmin: true });
        }
    });

    onSnapshot(collection(db, "activities"), (snapshot) => {
        activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderActivities();
    });

    // PŘIHLÁŠENÍ
    window.handleLogin = (event) => {
        event.preventDefault();
        const user = users.find(u => u.username === document.getElementById('username').value && u.password === document.getElementById('password').value);
        if (user) {
            loggedInUser = user;
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            welcomeMessage.textContent = `Vítej, ${loggedInUser.username}!`;
        } else {
            document.getElementById('login-error').textContent = 'Chyba přihlášení.';
        }
    };

    // PŘIDÁNÍ AKTIVITY
    window.handleAddActivity = async (e) => {
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

    // HLASOVÁNÍ (Tato funkce chyběla u tlačítka)
    window.handleVote = async (activityId) => {
        const activity = activities.find(a => a.id === activityId);
        let voters = activity.voters || [];
        const userIndex = voters.indexOf(loggedInUser.username);

        if (userIndex > -1) {
            voters.splice(userIndex, 1); // Zrušit hlas
        } else {
            voters.push(loggedInUser.username); // Přidat hlas
        }

        await updateDoc(doc(db, "activities", activityId), { voters: voters });
    };

    // MAZÁNÍ (Pouze pro admina)
    window.handleDelete = async (activityId) => {
        if (confirm('Opravdu chceš tento návrh smazat?')) {
            await deleteDoc(doc(db, "activities", activityId));
        }
    };

    function renderActivities() {
        if (activities.length === 0) {
            activitiesListDiv.innerHTML = '<p>Zatím žádné návrhy.</p>';
            return;
        }
        activitiesListDiv.innerHTML = activities
            .sort((a, b) => (b.voters?.length || 0) - (a.voters?.length || 0))
            .map(a => `
            <div class="activity-card" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
                <h3>${a.name}</h3>
                <p>${a.description || ''}</p>
                <p><strong>Kdy:</strong> ${a.date} | <strong>Kde:</strong> ${a.location || 'N/A'}</p>
                <p><strong>Cena:</strong> ${a.cost || 0} €</p>
                
                <button onclick="handleVote('${a.id}')">
                    ${(a.voters || []).includes(loggedInUser?.username) ? '❤️ Hlasováno' : '🤍 Hlasovat'} 
                    (${(a.voters || []).length})
                </button>

                ${loggedInUser?.isAdmin ? `<button onclick="handleDelete('${a.id}')" style="background: red; color: white; margin-left: 10px;">Smazat</button>` : ''}
            </div>
        `).join('');
    }

    document.getElementById('login-form').addEventListener('submit', window.handleLogin);
    document.getElementById('activity-form').addEventListener('submit', window.handleAddActivity);
    document.getElementById('logout-button').addEventListener('click', () => window.location.reload());
});
