// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Получаем данные пользователя
const user = Telegram.WebApp.initDataUnsafe?.user;
const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('channel_id');

// Подключаемся к серверу
const socket = io(window.location.origin);



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


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel_id');

    if (channelId) {
        try {
            const response = await fetch(`/api/channel?id=${channelId}`);
            const channel = await response.json();

            if (channel) {
                // Обновляем информацию о канале на странице
                const avatarElement = document.querySelector('.channel-avatar-large');
                const titleElement = document.querySelector('.channel-title');
                const subscribersElement = document.querySelector('.channel-subscribers');

                // Устанавливаем аватар (первая буква названия, если нет фото)
                // Исправленный код в backend-channelpage-user.js
                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }

                titleElement.textContent = channel.name;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }
});




// Запрашиваем данные канала
if (channelId) {
    socket.emit('get_channel', channelId);
}

// Получаем данные канала и обновляем интерфейс

// Обработка ошибок
socket.on('connect_error', (err) => {
    console.error('Ошибка подключения:', err);
});



