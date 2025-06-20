const allChannels = [
    { emoji: '📈', name: 'Крипто Тренды', subs: '142K', posts: '25' },
    { emoji: '📱', name: 'Гаджеты', subs: '98K', posts: '18' },
    { emoji: '💼', name: 'Бизнес Идеи', subs: '87K', posts: '12' },
    { emoji: '🏠', name: 'Недвижимость', subs: '76K', posts: '10' },
    { emoji: '🍳', name: 'Рецепты', subs: '65K', posts: '22' },
    { emoji: '🚀', name: 'Наука и Тех', subs: '210K', posts: '25' },
    { emoji: '💰', name: 'Инвестиции', subs: '185K', posts: '18' },
    { emoji: '🌎', name: 'Путешествия', subs: '172K', posts: '12' },
    { emoji: '🏋️', name: 'Фитнес', subs: '158K', posts: '15' },
    { emoji: '🎮', name: 'Игры', subs: '142K', posts: '20' }
];

const elements = {
    searchInput: document.querySelector('.search-input'),
    searchResults: document.querySelector('.search-results'),
    mainContent: document.querySelector('.main-content'),
    searchHeader: document.querySelector('.search-header'),
    header: document.querySelector('.header')
};

// Поиск каналов
function handleSearch(query) {
    const results = allChannels.filter(channel =>
        channel.name.toLowerCase().includes(query.toLowerCase())
    );

    elements.searchResults.innerHTML = results.length
        ? results.map(channel => `
          <div class="channel-card${query ? '' : ' vertical'}">
            <div class="channel-image">${channel.emoji}</div>
            <div class="channel-name">${channel.name}</div>
            <div class="channel-stats">
              ${channel.subs} подписчиков${query ? ` • ${channel.posts} постов в день` : ''}
            </div>
          </div>
        `).join('')
        : '<div class="no-results">Ничего не найдено</div>';
}

// Обработчики событий
elements.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

elements.searchInput.addEventListener('focus', () => {
    elements.searchHeader.style.display = 'flex';
    elements.header.style.display = 'none';
    elements.mainContent.style.display = 'none';
    elements.searchResults.style.display = 'block';
    handleSearch(elements.searchInput.value);
});

document.querySelector('.back-button').addEventListener('click', () => {
    elements.searchHeader.style.display = 'none';
    elements.header.style.display = 'block';
    elements.mainContent.style.display = 'block';
    elements.searchResults.style.display = 'none';
    elements.searchInput.value = '';
});

// Клики по карточкам
document.addEventListener('click', (e) => {
    const card = e.target.closest('.channel-card');
    if (card) {
        const channelName = card.querySelector('.channel-name').textContent;
        alert(`Вы выбрали канал: ${channelName}`);
    }
});

// Обработчики для кнопок режимов (как в оригинале)
document.getElementById('buy-mode').addEventListener('click', function() {
    if (!this.classList.contains('active')) {
        window.location.href = 'poisk.html';
    }
});

document.getElementById('sell-mode').addEventListener('click', function() {
    if (!this.classList.contains('active')) {
        window.location.href = 'reklama.html';
    }
});

// Инициализация Telegram
Telegram.WebApp.ready();
Telegram.WebApp.expand();
Telegram.WebApp.setHeaderColor('#ffffff');
Telegram.WebApp.setBackgroundColor('#ffffff');