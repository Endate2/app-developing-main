// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Получаем данные пользователя
const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-large');
const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('channel_id');
const userID = urlParams.get('userID');

// Подключаемся к серверу
const socket = io(window.location.origin);




document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});


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
                const descriptionElement = document.querySelector('.channel-description');


                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }

                titleElement.textContent = channel.name;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                descriptionElement.textContent = channel.description || 'Описание отсутствует';
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    const favoriteIcon = document.getElementById('favorite-icon');

    try {
        const response = await fetch(`/api/get-favourites?id=${channelId}&userID=${userID}`);
        const result = await response.json();

        if (result.rows && result.rows.length > 0) {
            favoriteIcon.classList.add('fas', 'active');
            favoriteIcon.classList.remove('far');
        } else {
            favoriteIcon.classList.add('far');
            favoriteIcon.classList.remove('fas', 'active');
        }
    } catch (error) {
        console.error('Ошибка при проверке избранного:', error);
    }

    favoriteIcon.addEventListener('click', async function() {
        this.classList.toggle('far');
        this.classList.toggle('fas');
        this.classList.toggle('active');

        try {
            await fetch(`/api/favourites?id=${channelId}&userID=${userID}`);
        } catch (error) {
            console.error('Ошибка при обновлении избранного:', error);
        }
    });
});



if (channelId) {
    socket.emit('get_channel', channelId);
}




socket.on('connect_error', (err) => {
    console.error('Ошибка подключения:', err);
});



