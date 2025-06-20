// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();
const userId = Telegram.WebApp.initDataUnsafe.user?.id;
// Получаем данные пользователя
const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-Profil');

// функция для безопасной раоты с LocalStorage
function safeLocalStorage(method, key, value) {
    try {
        if (method === 'get') {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } else if (method === 'set') {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } else if (method === 'remove') {
            localStorage.removeItem(key);
            return true;
        }
    } catch (e) {
        console.error('LocalStorage error:', e);
        if (e.name === 'QuotaExceededError') {
            localStorage.clear();
        }
        return null;
    }
}

if (user) {
    // Если у пользователя есть фото
    if (user.photo_url) {
        avatarElement.innerHTML = ''; // Очищаем содержимое
        avatarElement.style.backgroundImage = `url(${user.photo_url})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
    } else {
        // Если фото нет, показываем инициалы
        const firstNameLetter = user.first_name ? user.first_name[0] : '';
        const lastNameLetter = user.last_name ? user.last_name[0] : '';
        avatarElement.textContent = (firstNameLetter + lastNameLetter).toUpperCase();
    }
}
const socket = io(window.location.origin);

// Логируем статус подключения
socket.on("connect", () => {
    console.log("Connected to WebSocket server!");

    // Сначала пробуем загрузить избранные из LocalStorage
    const hasLocalFavourites = loadFavouritesFromLocalStorage();

    // Если в LocalStorage нет избранных или нужны свежие данные с сервера
    if (userId && !hasLocalFavourites) {
        socket.emit('get_favourites', userId);
    }
});

// Получаем список каналов
socket.on("favourites_list", (channels) => {
    // Сохраняем новые каналы в LocalStorage
    safeLocalStorage('set', 'favourite_channels', channels);

    // Обновляем UI
    const channelsList = document.getElementById("channels-list");
    channelsList.innerHTML = '';

    channels.forEach(channel => {
        addChannelToUI(channel);
    });
});



// Функция для добавления канала в UIqwqwqq
function addChannelToUI(channel) {
    const channelsList = document.getElementById("channels-list");

    const channelButton = document.createElement("div");
    channelButton.className = "channel-item";

    // Если есть photo_url, используем его, иначе показываем первую букву названия
    const avatarContent = channel.photo_url
        ? `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar">`
        : `<div class="channel-avatar">${channel.name.charAt(0)}</div>`;

    channelButton.innerHTML = `
        <div class="channel-item">
            <div class="channel-avatar">${avatarContent}</div>
            <div class="channel-name">${channel.name}</div>
        </div>
    `;

    channelButton.addEventListener('click', () => {
        // Сохраняем выбранный канал в LocalStorage
        safeLocalStorage('set', `channel_${channel.id}`, {
            id: channel.id,
            name: channel.name,
            photo_url: channel.photo_url
        });

        // Также сохраняем в список избранных
        const favourites = safeLocalStorage('get', 'favourite_channels') || [];
        if (!favourites.some(fav => fav.id === channel.id)) {
            favourites.push({
                id: channel.id,
                name: channel.name,
                photo_url: channel.photo_url
            });
            safeLocalStorage('set', 'favourite_channels', favourites);
        }

        window.location.href = `channelpage-user.html?channel_id=${channel.id}`;
    });

    channelsList.appendChild(channelButton);
}
function loadFavouritesFromLocalStorage() {
    const favourites = safeLocalStorage('get', 'favourite_channels') || [];
    const channelsList = document.getElementById("channels-list");

    // Очищаем список перед загрузкой
    channelsList.innerHTML = '';

    // Добавляем каждый избранный канал в UI
    favourites.forEach(channel => {
        addChannelToUI(channel);
    });

    return favourites.length > 0;
}
// Запрет масштабирования
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// Логика для календаря
document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('calendar-day-active'));
        this.classList.add('calendar-day-active');
    });
});