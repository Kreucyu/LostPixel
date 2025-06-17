const API_URL = 'http://localhost:3000/api';

const gamesGrid = document.getElementById('gamesGrid');
const platformFilter = document.getElementById('platformFilter');
const yearFilter = document.getElementById('yearFilter');
const genreFilter = document.getElementById('genreFilter');
const addGameButton = document.getElementById('addGameButton');
const gameModal = document.getElementById('gameModal');
const closeModal = document.querySelector('.close');
const gameForm = document.getElementById('gameForm');
const modalTitle = document.getElementById('modalTitle');
const gameError = document.getElementById('gameError');
const searchBar = document.getElementById('searchBar');
const searchBarBtn = document.getElementById('searchBarBtn');
const filterBtn = document.getElementById('filterBtn');

let currentGameId = null;
let isAdmin = false;
let currentUser = null;
let wishlistIds = [];

addGameButton.addEventListener('click', () => openModal());
closeModal.addEventListener('click', closeModalWindow);
gameForm.addEventListener('submit', handleFormSubmit);

if (searchBarBtn) {
    searchBarBtn.addEventListener('click', handleSearch);
}
if (filterBtn) {
    filterBtn.addEventListener('click', handleSearch);
}
if (searchBar) {
    searchBar.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
}

loadGames();

async function loadGames() {
    try {
        const response = await fetch(`${API_URL}/games`);
        const games = await response.json();
        displayGames(games);
        updateFilters(games);
        
        // Fetch wishlist if user is logged in
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                const wishlistResponse = await fetch(`${API_URL}/users/wishlist`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const wishlistGames = await wishlistResponse.json();
                wishlistIds = Array.isArray(wishlistGames) ? wishlistGames.map(g => g._id) : [];
            } catch (err) {
                console.error('Erro ao carregar wishlist:', err);
                wishlistIds = [];
            }
        } else {
            wishlistIds = [];
        }
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
    }
}

function displayGames(games) {
    gamesGrid.innerHTML = '';
    games.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    const loggedIn = !!sessionStorage.getItem('token');
    let actions = '';
    if (isAdmin) {
        actions += `<button onclick="editGame('${game._id}')" title="Editar" class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`;
        actions += `<button onclick="deleteGame('${game._id}')" title="Excluir" class="delete-btn"><i class="fa-solid fa-trash"></i></button>`;
    }
    const isInWishlist = wishlistIds.includes(game._id);
    if (loggedIn) {
        actions += `<button onclick="toggleWishlist('${game._id}', this)" title="${isInWishlist ? 'Remover da wishlist' : 'Adicionar à wishlist'}" class="wishlist-btn${isInWishlist ? ' in-wishlist' : ''}"><i class="fa-solid fa-bookmark"></i></button>`;
    }
    card.innerHTML = `
        <img src="${game.imageUrl || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" 
             alt="${game.title}" 
             class="game-image"
             onclick="window.location.href = 'gameinfo.html?id=${game._id}'">
        <div class="game-info">
            <h3 class="game-title">${game.title}</h3>
            <div class="game-details">
                <!-- gêneros removidos -->
            </div>
            <div class="game-actions">
                ${actions}
            </div>
        </div>
    `;
    return card;
}

function updateFilters(games) {
    const platforms = new Set();
    const years = new Set();
    const genres = new Set();

    games.forEach(game => {
        // Separar múltiplas plataformas por vírgula
        (game.platform || '').split(',').map(p => p.trim()).filter(Boolean).forEach(p => platforms.add(p));
        years.add(game.releaseYear);
        // Separar múltiplos gêneros por vírgula
        (game.genre || '').split(',').map(g => g.trim()).filter(Boolean).forEach(g => genres.add(g));
    });

    updateFilterOptions(platformFilter, platforms);
    updateFilterOptions(yearFilter, years);
    updateFilterOptions(genreFilter, genres);
}

function updateFilterOptions(selectElement, values) {
    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value="">Todos</option>';
    Array.from(values).sort().forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });
    selectElement.value = currentValue;
}

function openModal(gameId = null) {
    currentGameId = gameId;
    modalTitle.textContent = gameId ? 'Editar Jogo' : 'Adicionar Novo Jogo';
    gameForm.reset();
    
    if (gameId) {
        loadGameData(gameId);
    }
    
    gameModal.style.display = 'block';
}

function closeModalWindow() {
    gameModal.style.display = 'none';
    currentGameId = null;
}

async function loadGameData(gameId) {
    try {
        const response = await fetch(`${API_URL}/games/${gameId}`);
        const game = await response.json();
        
        Object.keys(game).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = game[key];
            }
        });
    } catch (error) {
        console.error('Erro ao carregar dados do jogo:', error);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    gameError.textContent = '';
    const formData = new FormData(gameForm);
    const gameData = Object.fromEntries(formData.entries());
    try {
        const url = currentGameId 
            ? `${API_URL}/games/${currentGameId}`
            : `${API_URL}/games`;
        const method = currentGameId ? 'PUT' : 'POST';
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(gameData)
        });
        if (response.ok) {
            closeModalWindow();
            loadGames();
        } else {
            const data = await response.json();
            gameError.textContent = data.message || 'Falha ao salvar jogo';
            throw new Error(data.message || 'Falha ao salvar jogo');
        }
    } catch (error) {
        gameError.textContent = error.message || 'Erro ao salvar jogo';
        console.error('Erro ao salvar jogo:', error);
    }
}

async function deleteGame(gameId) {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) {
        return;
    }
    try {
        const token = sessionStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        const response = await fetch(`${API_URL}/games/${gameId}`, {
            method: 'DELETE',
            headers
        });
        if (response.ok) {
            loadGames();
        } else {
            const data = await response.json();
            alert(data.message || 'Falha ao excluir jogo');
        }
    } catch (error) {
        alert('Erro ao excluir jogo.');
    }
}

function editGame(gameId) {
    openModal(gameId);
}

window.onclick = function(event) {
    if (event.target === gameModal) {
        closeModalWindow();
    }
}

window.addToWishlist = async function(gameId) {
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para adicionar à wishlist.');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/users/wishlist/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ gameId })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Jogo adicionado à wishlist!');
        } else {
            alert(data.message || 'Erro ao adicionar à wishlist.');
        }
    } catch (err) {
        alert('Erro ao conectar ao servidor.');
    }
}

async function fetchUserInfo() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();
        isAdmin = !!data.isAdmin;
        currentUser = data;
        if (addGameButton) {
            addGameButton.style.display = isAdmin ? 'block' : 'none';
        }
    } catch (err) {
        console.error('Error fetching user info:', err);
    }
}

function renderUserMenu() {
    const userMenuContainer = document.getElementById('userMenuContainer');
    const loginBtn = document.querySelector('button[onclick*="login.html"]');
    if (!currentUser || !currentUser.name) {
        if (userMenuContainer) userMenuContainer.innerHTML = '';
        if (loginBtn) loginBtn.style.display = '';
        return;
    }
    if (loginBtn) loginBtn.style.display = 'none';
    userMenuContainer.innerHTML = `
        <button id="userMenuBtn" class="icoUser">${currentUser.name} ▼</button>
       <div id="userMenuDropdown" class="userMenuDropdown">
    <button id="wishlistDropdownBtn" class="icoUserWishlist">Wishlist</button>
    <button id="logoutBtn" class="icoUserLogout">Sair</button>
</div>

    `;
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    userMenuBtn.onclick = () => {
        userMenuDropdown.style.display = userMenuDropdown.style.display === 'block' ? 'none' : 'block';
    };
    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
    };
    document.getElementById('wishlistDropdownBtn').onclick = openWishlistModal;

    document.addEventListener('click', function(e) {
        const userMenuContainer = document.getElementById('userMenuContainer');
        const userMenuDropdown = document.getElementById('userMenuDropdown');
    
        if (!userMenuContainer.contains(e.target)) {
            userMenuDropdown.style.display = 'none';
        }
    });
    
}

window.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInfo();
    renderUserMenu();
    await loadGames();
});

const toggleBtn = document.getElementById('toggleFiltersBtn');
const filtersSection = document.getElementById('filtersSection');

toggleBtn.addEventListener('click', function() {
    const filtersSection = document.getElementById('filtersSection');
    const toggleBtn = this;
    
    filtersSection.classList.toggle('hidden');
    toggleBtn.classList.toggle('active');
});

function openWishlistModal() {
    let modal = document.getElementById('wishlistModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'wishlistModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <span class="close" id="closeWishlist">&times;</span>
                <h2 style="color:#6c3fd1;">Minha Wishlist</h2>
                <div id="wishlistGames"></div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeWishlist').onclick = () => modal.style.display = 'none';
    }
    loadWishlist();
    modal.style.display = 'block';
}

async function loadWishlist() {
    const token = sessionStorage.getItem('token');
    const wishlistDiv = document.getElementById('wishlistGames');
    wishlistDiv.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_URL}/users/wishlist`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const games = await res.json();
        if (Array.isArray(games) && games.length > 0) {
            wishlistDiv.innerHTML = '';
            games.forEach(game => {
                const card = document.createElement('div');
                card.className = 'game-card wishlist-card';
                card.innerHTML = `
                    <img src="${game.imageUrl || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" class="game-image">
                    <div class="game-info">
                        <h3 class="game-title">${game.title}</h3>
                        
                        <div class="game-actions">
                            <button onclick="removeFromWishlist('${game._id}')" class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
                wishlistDiv.appendChild(card);
            });
            wishlistIds = Array.isArray(games) ? games.map(g => g._id) : [];
        } else {
            wishlistDiv.innerHTML = 'Sua wishlist está vazia.';
        }
    } catch (err) {
        wishlistDiv.innerHTML = 'Erro ao carregar wishlist.';
    }
}

window.removeFromWishlist = async function(gameId) {
    const token = sessionStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/users/wishlist/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ gameId })
        });
        if (res.ok) {
            loadWishlist();
            loadGames();
        }
    } catch (err) {
        alert('Erro ao remover da wishlist.');
    }
}

async function handleSearch() {
    const searchTerm = searchBar ? searchBar.value.trim() : '';
    const platform = platformFilter ? platformFilter.value : '';
    const year = yearFilter ? yearFilter.value : '';
    const genre = genreFilter ? genreFilter.value : '';
    try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('title', searchTerm);
        if (platform) queryParams.append('platform', platform);
        if (year) queryParams.append('releaseYear', year);
        if (genre) queryParams.append('genre', genre);
        const url = queryParams.toString() ? `${API_URL}/games/search?${queryParams}` : `${API_URL}/games`;
        const response = await fetch(url);
        const games = await response.json();
        displayGames(games);
    } catch (error) {
        console.error('Erro ao buscar jogos:', error);
    }
}

function createUserDropdown() {
    const container = document.getElementById('userMenuContainer');
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <a href="wishlist.html" class="user-dropdown-item">
            <i class="fa-solid fa-heart"></i>
            Wishlist
        </a>
        <div class="user-dropdown-divider"></div>
        <a href="#" class="user-dropdown-item" id="logoutBtn">
            <i class="fa-solid fa-right-from-bracket"></i>
            Sair
        </a>
    `;
    container.appendChild(dropdown);

    const userButton = document.querySelector('button[onclick="window.location.href=\'login.html\'"]');
    userButton.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });
}

document.addEventListener('DOMContentLoaded', createUserDropdown);

const hamburgerBtn = document.getElementById('hamburgerBtn');
const navLinks = document.getElementById('navLinks');
if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', function() {
        navLinks.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
        if (!navLinks.contains(e.target) && e.target !== hamburgerBtn) {
            navLinks.classList.remove('show');
        }
    });
}

window.toggleWishlist = async function(gameId, btn) {
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para adicionar à wishlist.');
        return;
    }

    const isInWishlist = btn.classList.contains('in-wishlist');
    try {
        const url = isInWishlist ? `${API_URL}/users/wishlist/remove` : `${API_URL}/users/wishlist/add`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ gameId })
        });
        
        if (res.ok) {
            if (isInWishlist) {
                btn.classList.remove('in-wishlist');
                wishlistIds = wishlistIds.filter(id => id !== gameId);
                btn.title = 'Adicionar à wishlist';
            } else {
                btn.classList.add('in-wishlist');
                wishlistIds.push(gameId);
                btn.title = 'Remover da wishlist';
            }
        } else {
            const data = await res.json();
            alert(data.message || 'Erro ao atualizar wishlist.');
        }
    } catch (err) {
        alert('Erro ao conectar ao servidor.');
    }
} 