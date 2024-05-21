let championsData = [];
let filteredChampions = [];
const pageSize = 10;
const paginationSize = 5; 
let currentPage = 1;
let currentPaginationStart = 1;

//連API
function fetchChampions() {
    fetch('https://ddragon.leagueoflegends.com/cdn/10.22.1/data/zh_TW/champion.json')
        .then(response => response.json())
        .then(data => {
            championsData = Object.values(data.data);
            filteredChampions = championsData;
            renderChampions();
            renderPagination();
            renderFavorites();
        })
        .catch(error => console.error('Error fetching data:', error));
}

function renderChampions() {
    const championContainer = document.getElementById('championContainer');
    championContainer.innerHTML = '';

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    const currentChampions = filteredChampions.slice(startIndex, endIndex);

    currentChampions.forEach(champion => {
        const championCard = createChampionCard(champion, true);
        championContainer.appendChild(championCard);
    });

    renderPagination();
}

function createChampionCard(champion, addFavoriteButton = true) {
    const championCard = document.createElement('div');
    championCard.classList.add('champion-card');
    championCard.innerHTML = `
        <img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg" alt="${champion.name}">
        <div class="champion-card-content">
            <h2>${champion.name}</h2>
            <p>攻擊: ${champion.info.attack}</p>
            <p>防禦: ${champion.info.defense}</p>
            <p>魔法: ${champion.info.magic}</p>
            <p>難度: ${champion.info.difficulty}</p>
            <button onclick="viewChampionDetails('${champion.id}')">查看詳情</button>
            ${addFavoriteButton ? `<button onclick="addToFavorites('${champion.id}')">加入收藏</button>` : `<button onclick="removeFromFavorites('${champion.id}')">移除收藏</button>`}
        </div>
    `;
    return championCard;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredChampions.length / pageSize);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.textContent = '上一頁';
    prevButton.disabled = currentPaginationStart === 1;
    prevButton.onclick = () => {
        currentPaginationStart = Math.max(1, currentPaginationStart - 1);
        currentPage = (currentPaginationStart - 1) * paginationSize + 1;
        renderChampions();
    };
    pagination.appendChild(prevButton);

    for (let i = currentPaginationStart; i <= currentPaginationStart + paginationSize - 1 && i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = (i - 1) * pageSize + 1;
            renderChampions();
        };
        if ((i - 1) * pageSize + 1 === currentPage) {
            pageButton.classList.add('active');
        }
        pagination.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = '下一頁';
    nextButton.disabled = currentPaginationStart + paginationSize > totalPages;
    nextButton.onclick = () => {
        currentPaginationStart = Math.min(totalPages - paginationSize + 1, currentPaginationStart + 1);
        currentPage = (currentPaginationStart - 1) * paginationSize + 1;
        renderChampions();
    };
    pagination.appendChild(nextButton);
}

function viewChampionDetails(championId) {
    const champion = championsData.find(champion => champion.id === championId);
    if (champion) {
        const modal = document.getElementById('detailsModal');
        const championDetails = document.getElementById('championDetails');
        const radarChartCanvas = document.getElementById('radarChart');

        championDetails.innerHTML = `
            <h2>${champion.name}</h2>
            <p>${champion.blurb}</p>
            <p>攻擊: ${champion.info.attack}</p>
            <p>防禦: ${champion.info.defense}</p>
            <p>魔法: ${champion.info.magic}</p>
            <p>難度: ${champion.info.difficulty}</p>
        `;

        // 建立雷達圖
        const radarData = {
            labels: ['攻擊', '防禦', '魔法', '難度'],
            datasets: [{
                label: '屬性',
                data: [champion.info.attack, champion.info.defense, champion.info.magic, champion.info.difficulty],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };

        if (radarChartCanvas) {
            radarChartCanvas.parentNode.removeChild(radarChartCanvas);
        }
        const newCanvas = document.createElement('canvas');
        newCanvas.setAttribute('id', 'radarChart');
        championDetails.appendChild(newCanvas);
        new Chart(newCanvas, {
            type: 'radar',
            data: radarData,
            options: {}
        });

        modal.style.display = 'block';

        modal.onclick = function(event) {
            if (event.target === modal || event.target.classList.contains('close')) {
                championDetails.innerHTML = ''; // Clear champion details when modal is closed
                modal.style.display = 'none';
            }
        };
    }
}

function filterChampions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredChampions = championsData.filter(champion => champion.name.toLowerCase().includes(searchTerm));
    currentPage = 1;
    renderChampions();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').selectedIndex = 0;
    filteredChampions = championsData;
    currentPage = 1;
    renderChampions();
}

function sortChampions() {
    const sortBy = document.getElementById('sortSelect').value;
    if (sortBy === 'name') {
        filteredChampions.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        filteredChampions.sort((a, b) => b.info[sortBy] - a.info[sortBy]);
    }
    currentPage = 1;
    renderChampions();
}

function addToFavorites(championId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.includes(championId)) {
        favorites.push(championId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function removeFromFavorites(championId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(id => id !== championId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    favoritesContainer.innerHTML = '';

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteChampions = championsData.filter(champion => favorites.includes(champion.id));

    favoriteChampions.forEach(champion => {
        const championCard = createChampionCard(champion, false);
        favoritesContainer.appendChild(championCard);
    });
}

fetchChampions();