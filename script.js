import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Konfigurace z tvého projektu planovac
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

    // POSLOUCHÁNÍ DATABÁZE (Real-time)
    onSnapshot(collection(db, "users"), (snapshot) => {
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Pokud je DB prázdná, vytvoříme prvního admina
        if (users.length === 0) {
            setDoc(doc(db, "users", "admin"), { 
                username: 'admin', 
                password: 'admin123', 
                isAdmin: true 
            });
        }
    });

    onSnapshot(collection(db, "activities"), (snapshot) => {
        activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderActivities();
    });

    // PŘIHLÁŠENÍ
    window.handleLogin = (event) => {
        event.preventDefault();
        const user = users.find(u => 
            u.username === document.getElementById('username').value && 
            u.password === document.getElementById('password').value
        );

        if (user) {
            loggedInUser = user;
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            welcomeMessage.textContent = `Ahoj, ${loggedInUser.username}!`;
        } else {
            document.getElementById('login-error').textContent = 'Špatné jméno nebo heslo.';
        }
    };

    // PŘIDÁNÍ AKTIVITY
    window.handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "activities"), {
                name: document.getElementById('activity-name').value,
                description: document.getElementById('activity-description').value,
                date: document.getElementById('activity-date').value,
                location: document.getElementById('activity-location').value,
                cost: document.getElementById('activity-cost').value,
                voters: [],
                createdAt: new Date()
            });
            e.target.reset();
        } catch (error) {
            console.error("Chyba při ukládání:", error);
            alert("Nepodařilo se uložit aktivitu. Zkontroluj Rules ve Firebase!");
        }
    };

    // HLASOVÁNÍ
    window.handleVote = async (activityId) => {
        const activity = activities.find(a => a.id === activityId);
        let voters = activity.voters || [];
        const index = voters.indexOf(loggedInUser.username);
        
        if (index > -1) {
            voters.splice(index, 1); // Odebrat hlas
        } else {
            voters.push(loggedInUser.username); // Přidat hlas
        }

        await updateDoc(doc(db, "activities", activityId), { voters: voters });
    };

    function renderActivities() {
        if (activities.length === 0) {
            activitiesListDiv.innerHTML = '<p>Zatím žádné návrhy. Buď první!</p>';
            return;
        }

        activitiesListDiv.innerHTML = activities
            .sort((a, b) => b.voters.length - a.voters.length) // Seřadit podle hlasů
            .map(a => `
                <div class="activity-card">
                    <h3>${a.name}</h3>
                    <p>${a.description || 'Bez popisu'}</p>
                    <p><strong>Kdy:</strong> ${a.date} | <strong>Kde:</strong> ${a.location || 'N/A'}</p>
                    <p><strong>Cena:</strong> ${a.cost || 0} €</p>
                    <button onclick="handleVote('${a.id}')">
                        ${(a.voters || []).includes(loggedInUser?.username) ? '❤️ Hlasováno' : '🤍 Hlasovat'} 
                        (${(a.voters || []).length})
                    </button>
                </div>
            `).join('');
    }

    // EVENT LISTENERS
    document.getElementById('login-form').addEventListener('submit', window.handleLogin);
    document.getElementById('activity-form').addEventListener('submit', window.handleAddActivity);
    document.getElementById('logout-button').addEventListener('click', () => window.location.reload());
});
