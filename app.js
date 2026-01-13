// ... (Firebase importy a config zůstávají stejné jako minule) ...

    // Přeložené hlášky u registrace
    document.getElementById('reg-btn').onclick = async () => {
        const u = document.getElementById('reg-username').value;
        const p = document.getElementById('reg-password').value;
        if (!u || !p) return alert("Musíš vyplnit jméno i heslo!");
        if (users.find(user => user.username === u)) return alert("Tento uživatel už existuje!");

        await addDoc(collection(db, "users"), {
            username: u, password: p, isAdmin: false, status: 'pending'
        });
        alert("Žádost odeslána! Admin tě musí nejdříve schválit.");
        toggleAuth();
    };

    // Přeložené hlášky u přihlášení
    document.getElementById('login-btn').onclick = () => {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const user = users.find(user => user.username === u && user.password === p);

        if (!user) return document.getElementById('auth-error').textContent = "Špatné jméno nebo heslo!";
        if (user.status === 'pending') return document.getElementById('auth-error').textContent = "Tvůj účet ještě nebyl schválen adminem!";

        loggedInUser = user;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `Uživatel: ${user.username}`;
        
        if (user.isAdmin) document.getElementById('admin-requests').classList.remove('hidden');
    };

    // Přeložený výpis schvalování
    function renderRequests() {
        const list = document.getElementById('requests-list');
        const pending = users.filter(u => u.status === 'pending');
        list.innerHTML = pending.length ? pending.map(u => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#1a1a1a; padding:12px; border-radius:10px; border:1px solid #944dff;">
                <span>${u.username}</span>
                <button onclick="approveUser('${u.id}')" style="width:auto; padding:5px 15px; font-size:0.8rem;">SCHVÁLIT</button>
            </div>
        `).join('') : '<p style="color:gray; font-size:0.8rem;">Žádné nové žádosti o přístup.</p>';
    }

    // Přeložené hlasování
    function renderActivities() {
        activitiesListDiv.innerHTML = activities
            .sort((a,b) => (b.voters?.length || 0) - (a.voters?.length || 0))
            .map(a => {
                const isVoted = (a.voters || []).includes(loggedInUser?.username);
                return `
                <div class="activity-card">
                    <h3>${a.name}</h3>
                    <p style="color:#aaa">${a.description || ''}</p>
                    <div class="activity-info">📍 Místo: ${a.location || 'Neuvedeno'}</div>
                    <div class="activity-info">📅 Datum: ${a.date}</div>
                    <button class="vote-btn ${isVoted ? 'active' : ''}" onclick="handleVote('${a.id}')">
                        ${isVoted ? '❤️ HLASOVÁNO' : '🤍 HLASOVAT'} (${(a.voters || []).length})
                    </button>
                </div>
            `}).join('');
    }
