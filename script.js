document.addEventListener('DOMContentLoaded', () => {
    // --- APPLICATION STATE ---
    let activities = [];
    let participants = [];
    let users = [];
    let loggedInUser = null;
    let nextActivityId = 1;

    // --- DOM ELEMENT REFERENCES ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const adminPanel = document.getElementById('admin-panel');
    const ideaSection = document.getElementById('idea-section');
    const participantsSection = document.getElementById('participants-section');

    // Login Form
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');

    // App Header
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');

    // Admin Panel
    const createUserForm = document.getElementById('create-user-form');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const userListUl = document.getElementById('user-list');

    // Core App Forms & Lists
    const activityForm = document.getElementById('activity-form');
    const participantForm = document.getElementById('participant-form');
    const activityNameInput = document.getElementById('activity-name');
    const activityDescriptionInput = document.getElementById('activity-description');
    const activityDateInput = document.getElementById('activity-date');
    const activityLocationInput = document.getElementById('activity-location');
    const activityCostInput = document.getElementById('activity-cost');
    const participantNameInput = document.getElementById('participant-name');
    const participantRoleInput = document.getElementById('participant-role');
    const activitiesListDiv = document.getElementById('activities-list');
    const participantsListUl = document.getElementById('participants-list');
    const winnerActivityDiv = document.getElementById('winner-activity');
    const exportButton = document.getElementById('export-plan');

    // --- INITIALIZATION & DATA PERSISTENCE ---
    function initializeApp() {
        loadState();
        checkLoginState();
    }

    function loadState() {
        const storedUsers = localStorage.getItem('weekendPlannerUsers');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            users = [{ username: 'admin', password: 'admin123', isAdmin: true }];
            saveUsers();
        }

        const storedActivities = localStorage.getItem('weekendPlannerActivities');
        if (storedActivities) {
            const parsedActivities = JSON.parse(storedActivities);
            activities = parsedActivities.map(activity => ({
                ...activity,
                voters: activity.voters || [],
                comments: activity.comments || []
            }));
            if (activities.length > 0) {
                nextActivityId = Math.max(0, ...activities.map(a => a.id)) + 1;
            }
        }

        const storedParticipants = localStorage.getItem('weekendPlannerParticipants');
        if (storedParticipants) {
            participants = JSON.parse(storedParticipants);
        }
    }

    function saveUsers() {
        localStorage.setItem('weekendPlannerUsers', JSON.stringify(users));
    }

    function saveActivities() {
        localStorage.setItem('weekendPlannerActivities', JSON.stringify(activities));
    }

    function saveParticipants() {
        localStorage.setItem('weekendPlannerParticipants', JSON.stringify(participants));
    }

    function checkLoginState() {
        const userJson = sessionStorage.getItem('loggedInUser');
        if (userJson) {
            loggedInUser = JSON.parse(userJson);
            showApp();
        } else {
            showLogin();
        }
    }

    // --- UI CONTROL ---
    function showLogin() {
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        loginError.textContent = '';
    }

    function showApp() {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        welcomeMessage.textContent = `Vítej, ${loggedInUser.username}!`;

        if (loggedInUser.isAdmin) {
            adminPanel.classList.remove('hidden');
            ideaSection.classList.remove('hidden');
            participantsSection.classList.remove('hidden');
            renderUsers();
        } else {
            adminPanel.classList.add('hidden');
            ideaSection.classList.add('hidden');
            participantsSection.classList.add('hidden');
        }
        renderActivities();
        renderParticipants();
        renderWinner();
    }

    // --- AUTHENTICATION ---
    function handleLogin(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            loggedInUser = user;
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            showApp();
            loginForm.reset();
        } else {
            loginError.textContent = 'Nesprávné jméno nebo heslo.';
        }
    }

    function handleLogout() {
        loggedInUser = null;
        sessionStorage.removeItem('loggedInUser');
        window.location.reload();
    }

    // --- ADMIN FUNCTIONALITY ---
    function handleCreateUser(event) {
        event.preventDefault();
        const newUsername = newUsernameInput.value;
        const newPassword = newPasswordInput.value;

        if (users.some(u => u.username === newUsername)) {
            alert('Uživatel s tímto jménem již existuje.');
            return;
        }

        users.push({ username: newUsername, password: newPassword, isAdmin: false });
        saveUsers();
        alert(`Uživatel ${newUsername} byl úspěšně vytvořen.`);
        createUserForm.reset();
        renderUsers();
    }

    function renderUsers() {
        userListUl.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.username} ${user.isAdmin ? '(Admin)' : ''}`;
            userListUl.appendChild(li);
        });
    }

    // --- CORE APP LOGIC ---
    function handleAddActivity(event) {
        event.preventDefault();
        const newActivity = {
            id: nextActivityId++,
            name: activityNameInput.value,
            description: activityDescriptionInput.value,
            date: activityDateInput.value,
            location: activityLocationInput.value,
            cost: activityCostInput.value,
            voters: [],
            comments: []
        };
        activities.push(newActivity);
        saveActivities();
        renderActivities();
        activityForm.reset();
    }

    function handleAddParticipant(event) {
        event.preventDefault();
        participants.push({ name: participantNameInput.value, role: participantRoleInput.value });
        saveParticipants();
        renderParticipants();
        participantForm.reset();
    }

    function handleActivityListClick(event) {
        if (event.target.classList.contains('vote-btn')) {
            handleVote(event.target);
        }
        if (event.target.classList.contains('delete-btn')) {
            handleDeleteActivity(event.target);
        }
    }

    function handleVote(button) {
        const activityId = parseInt(button.dataset.id, 10);
        const activity = activities.find(a => a.id === activityId);
        if (activity) {
            const userVoteIndex = activity.voters.indexOf(loggedInUser.username);
            if (userVoteIndex > -1) {
                activity.voters.splice(userVoteIndex, 1);
            } else {
                activity.voters.push(loggedInUser.username);
            }
            saveActivities();
            renderActivities();
            renderWinner();
        }
    }

    function handleDeleteActivity(button) {
        const activityId = parseInt(button.dataset.id, 10);
        if (confirm('Opravdu si přejete smazat tuto aktivitu?')) {
            activities = activities.filter(a => a.id !== activityId);
            saveActivities();
            renderActivities();
            renderWinner();
        }
    }

    function handleAddComment(event) {
        event.preventDefault();
        if (!event.target.classList.contains('comment-form')) return;

        const activityId = parseInt(event.target.dataset.id, 10);
        const commentInput = event.target.querySelector('.comment-input');
        const commentText = commentInput.value.trim();

        if (commentText) {
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
                activity.comments.push({ user: loggedInUser.username, text: commentText });
                saveActivities();
                renderActivities();
            }
        }
    }

    function renderActivities() {
        activitiesListDiv.innerHTML = '';
        if (activities.length === 0) {
            activitiesListDiv.innerHTML = '<p>Zatím nebyly přidány žádné aktivity.</p>';
            return;
        }
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.classList.add('activity');

            const userHasVoted = activity.voters.includes(loggedInUser.username);
            const voteButtonText = userHasVoted ? 'Odebrat hlas' : 'Hlasovat';
            const voteButtonClass = userHasVoted ? 'vote-btn remove-vote' : 'vote-btn';
            const deleteButtonHtml = loggedInUser.isAdmin ? `<button class="delete-btn" data-id="${activity.id}">Smazat</button>` : '';

            let commentsHtml = activity.comments.map(c => `<div class="comment"><strong>${c.user}:</strong> ${c.text}</div>`).join('');

            activityElement.innerHTML = `
                <h3>${activity.name}</h3>
                <p><strong>Popis:</strong> ${activity.description || 'N/A'}</p>
                <p><strong>Datum:</strong> ${activity.date}</p>
                <p><strong>Místo:</strong> ${activity.location || 'N/A'}</p>
                <p><strong>Náklady:</strong> ${activity.cost || 0} €</p>
                <div class="activity-footer">
                    <span class="votes">Hlasy: ${activity.voters.length}</span>
                    <div>
                        <button class="${voteButtonClass}" data-id="${activity.id}">${voteButtonText}</button>
                        ${deleteButtonHtml}
                    </div>
                </div>
                <div class="comments-section">
                    <h4>Komentáře</h4>
                    <div class="comments-list">${commentsHtml || '<p>Zatím žádné komentáře.</p>'}</div>
                    <form class="comment-form" data-id="${activity.id}">
                        <input type="text" class="comment-input" placeholder="Napsat komentář..." required>
                        <button type="submit">Odeslat</button>
                    </form>
                </div>
            `;
            activitiesListDiv.appendChild(activityElement);
        });
    }

    function renderParticipants() {
        participantsListUl.innerHTML = '';
        participants.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} - ${p.role}`;
            participantsListUl.appendChild(li);
        });
    }

    function renderWinner() {
        const winner = getWinner();
        if (!winner) {
            winnerActivityDiv.innerHTML = '<p>Zatím žádná vítězná aktivita.</p>';
            return;
        }
        winnerActivityDiv.innerHTML = `
            <h4>Vítězná aktivita:</h4>
            <div class="activity">
                <h3>${winner.name}</h3>
                <p><strong>Celkem hlasů:</strong> ${winner.voters.length}</p>
            </div>
        `;
    }

    function getWinner() {
        if (activities.length === 0) return null;
        const sortedActivities = [...activities].sort((a, b) => b.voters.length - a.voters.length);
        return sortedActivities[0].voters.length > 0 ? sortedActivities[0] : null;
    }

    function generateTxtPlan() {
        const winner = getWinner();
        if (!winner) {
            alert("Nelze exportovat plán, žádná aktivita nemá hlasy.");
            return;
        }
        let participantsText = participants.map(p => `- ${p.name} (${p.role})`).join('\n') || "Žádní účastníci nebyli zadáni.";
        const planContent = `
VÍKENDOVÝ PLÁN
====================
VÍTĚZNÁ AKTIVITA
--------------------
Název: ${winner.name}
Popis: ${winner.description || 'N/A'}
Datum: ${winner.date}
Místo: ${winner.location || 'N/A'}
Náklady: ${winner.cost || 0} €
ÚČASTNÍCI
--------------------
${participantsText}
        `.trim();
        const blob = new Blob([planContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weekend_plan.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    createUserForm.addEventListener('submit', handleCreateUser);
    activityForm.addEventListener('submit', handleAddActivity);
    participantForm.addEventListener('submit', handleAddParticipant);
    activitiesListDiv.addEventListener('click', handleActivityListClick); // Consolidated listener
    activitiesListDiv.addEventListener('submit', handleAddComment);
    exportButton.addEventListener('click', generateTxtPlan);

    // --- START THE APP ---
    initializeApp();
});