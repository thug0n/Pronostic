// Configuration de l'API
const API_KEY = "7f30e468c2c69a7d569d265ac03a0e3e"; // Remplacez par votre clé API-Football
const API_URL = "https://v3.football.api-sports.io";

// Variables globales
let currentUser = localStorage.getItem("footballUser") || "Invité";
let pronostics = JSON.parse(localStorage.getItem("footballPronostics")) || {};
let leaderboard = JSON.parse(localStorage.getItem("footballLeaderboard")) || {};

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Mettre à jour le nom d'utilisateur
  document.getElementById("username").textContent = currentUser;

  // Charger les matchs du jour
  loadMatches();

  // Charger le classement
  updateLeaderboard();

  // Gestion des événements
  document.getElementById("loginBtn").addEventListener("click", () => {
    document.getElementById("loginModal").classList.remove("hidden");
  });

  document.getElementById("saveUserBtn").addEventListener("click", () => {
    const newUser = document.getElementById("userNameInput").value.trim();
    if (newUser) {
      currentUser = newUser;
      localStorage.setItem("footballUser", currentUser);
      document.getElementById("username").textContent = currentUser;
      document.getElementById("loginModal").classList.add("hidden");
    }
  });

  // Filtre par ligue
  document.getElementById("leagueSelect").addEventListener("change", (e) => {
    const leagueId = e.target.value;
    loadMatches(leagueId);
  });
});

// Charger les matchs (avec filtre optionnel par ligue)
function loadMatches(leagueId = "all") {
  const today = new Date().toISOString().split("T")[0];
  let url = `${API_URL}/fixtures?date=${today}`;

  if (leagueId !== "all") {
    url += `&league=${leagueId}&season=2024`;
  }

  fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": API_KEY,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.response) {
        displayMatches(data.response);
      } else {
        console.error("Aucune donnée reçue", data);
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des matchs:", error);
      document.getElementById("matchesContainer").innerHTML =
        `<div class="col-span-3 text-center py-8">
          <p class="text-red-500">⚠️ Impossible de charger les matchs. Vérifiez votre connexion ou votre clé API.</p>
        </div>`;
    });
}

// Afficher les matchs dans le DOM
function displayMatches(matches) {
  const container = document.getElementById("matchesContainer");
  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = `<div class="col-span-3 text-center py-8">
      <p class="text-gray-500">Aucun match aujourd'hui pour cette ligue.</p>
    </div>`;
    return;
  }

  matches.forEach((match) => {
    const matchId = match.fixture.id;
    const homeTeam = match.teams.home.name;
    const awayTeam = match.teams.away.name;
    const homeLogo = match.teams.home.logo;
    const awayLogo = match.teams.away.logo;
    const league = match.league.name;
    const matchTime = new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Vérifier si l'utilisateur a déjà voté
    const userVote = pronostics[currentUser]?.[matchId];

    const matchCard = document.createElement("div");
    matchCard.className = "match-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow";
    matchCard.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <span class="text-sm text-gray-500">${league}</span>
        <span class="text-sm font-medium">${matchTime}</span>
      </div>
      <div class="flex justify-center items-center mb-4">
        <div class="text-center">
          <img src="${homeLogo}" alt="${homeTeam}" class="h-12 mx-auto mb-2">
          <p class="font-semibold">${homeTeam}</p>
        </div>
        <span class="mx-4 text-xl font-bold">${match.goals.home || "?"} - ${match.goals.away || "?"}</span>
        <div class="text-center">
          <img src="${awayLogo}" alt="${awayTeam}" class="h-12 mx-auto mb-2">
          <p class="font-semibold">${awayTeam}</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          class="pronostic-btn bg-green-500 text-white py-2 rounded-lg ${userVote === 'home' ? 'ring-2 ring-green-300' : ''}"
          onclick="vote('${matchId}', 'home', '${homeTeam}')"
        >
          Victoire ${homeTeam}
        </button>
        <button
          class="pronostic-btn bg-gray-500 text-white py-2 rounded-lg ${userVote === 'draw' ? 'ring-2 ring-gray-300' : ''}"
          onclick="vote('${matchId}', 'draw', 'Match nul')"
        >
          Match nul
        </button>
        <button
          class="pronostic-btn bg-red-500 text-white py-2 rounded-lg ${userVote === 'away' ? 'ring-2 ring-red-300' : ''}"
          onclick="vote('${matchId}', 'away', '${awayTeam}')"
        >
          Victoire ${awayTeam}
        </button>
      </div>
    `;
    container.appendChild(matchCard);
  });
}

// Enregistrer un pronostic
function vote(matchId, prediction, teamName) {
  if (!pronostics[currentUser]) {
    pronostics[currentUser] = {};
  }
  pronostics[currentUser][matchId] = prediction;
  localStorage.setItem("footballPronostics", JSON.stringify(pronostics));

  // Mettre à jour l'affichage
  const buttons = document.querySelectorAll(`[onclick="vote('${matchId}', '${prediction}', '${teamName}')"]`);
  buttons.forEach(btn => {
    btn.classList.add("ring-2", "ring-offset-2");
    if (prediction === 'home') btn.classList.add("ring-green-300");
    else if (prediction === 'draw') btn.classList.add("ring-gray-300");
    else btn.classList.add("ring-red-300");
  });

  // Mettre à jour le classement
  updateLeaderboard();
}

// Mettre à jour le classement
function updateLeaderboard() {
  const leaderboardElement = document.getElementById("leaderboard");

  // Simuler des points (à remplacer par une logique réelle)
  const users = Object.keys(pronostics);
  if (users.length === 0) {
    leaderboardElement.innerHTML = "<p class='text-gray-500'>Aucun pronostic enregistré.</p>";
    return;
  }

  // Calculer les points (exemple simplifié)
  const scores = {};
  users.forEach(user => {
    scores[user] = Object.keys(pronostics[user]).length * 10; // 10 points par pronostic
  });

  // Trier par score
  const sortedUsers = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // Générer le tableau
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Rang</th>
          <th>Utilisateur</th>
          <th>Points</th>
          <th>Pronostics</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedUsers.forEach(([user, score], index) => {
    tableHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${user}</td>
        <td>${score}</td>
        <td>${Object.keys(pronostics[user]).length}</td>
      </tr>
    `;
  });

  tableHTML += "</tbody></table>";
  leaderboardElement.innerHTML = tableHTML;
}
