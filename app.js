// --- ZDE MĚJ SVÉ FIREBASE IMPORTY A KONFIGURACI ---
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x/firebase-app.js";
// import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.x/firebase-firestore.js";

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// ELEMENTY Z HTML
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authError = document.getElementById('auth-error');
const loginFields = document.getElementById('login-fields');
const registerFields = document.getElementById('register-fields');

// PROMĚNNÉ PRO DATA
let users = [];
let activities = [];
let loggedInUser = null;

// NAČÍTÁNÍ UŽIVATELŮ V REÁLNÉM ČASE
onSnapshot(collection(db, "users"), (snapshot) => {
    users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Uživatelé načteni:", users);
});

// PŘEPÍNÁNÍ REGISTRACE/LOGINU
window.toggleAuth = () => {
    loginFields.classList.toggle('hidden');
    registerFields.classList.toggle('hidden');
    document.getElementById('auth-title').textContent = 
        loginFields.classList.contains('hidden') ? "Nová registrace" : "Vstup do systému";
};

document.getElementById('to-reg').onclick = toggleAuth;
document.getElementById('to-login').onclick = toggleAuth;

// REGISTRACE
document.getElementById('reg-btn').onclick = async () => {
    const u = document.getElementById('reg-username').value;
    const p = document.getElementById('reg-password').value;
    
    if (!u || !p) return alert("Vyplň vše!");
    if (users.find(user => user.username === u)) return alert("Uživatel už existuje!");

    await addDoc(collection(db, "users"), {
        username: u, password: p, isAdmin: false, status: 'pending'
    });
    alert("Žádost odeslána! Admin tě musí schválit.");
    toggleAuth();
};

// LOGIN
document.getElementById('login-btn').onclick = () => {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    const user = users.find(user => user.username === u && user.password === p);

    if (!user) {
        authError.textContent = "Špatné jméno nebo heslo!";
        return;
    }
    if (user.status === 'pending') {
        authError.textContent = "Účet čeká na schválení adminem.";
        return;
    }

    // ÚSPĚCH
    loggedInUser = user;
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    document.getElementById('welcome-message').textContent = `Uživatel: ${user.username}`;
    
    if (user.isAdmin) document.getElementById('admin-requests').classList.remove('hidden');
};

// LOGOUT
document.getElementById('logout-btn').onclick = () => {
    location.reload(); // Nejjednodušší restart apky
};
