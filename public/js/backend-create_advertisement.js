// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();


// Получаем данные пользователя
const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-large');
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
                const day = urlParams.get('day');
                // Обновляем информацию о канале на странице
                const avatarElement = document.querySelector('.channel-avatar-large');
                const titleElement = document.querySelector('.channel-title');
                const subscribersElement = document.querySelector('.channel-subscribers');
                const descriptionElement = document.querySelector('.channel-description');
                const dayElement = document.querySelector('.section-title-2');

                // Устанавливаем аватар (первая буква названия, если нет фото)
                // Исправленный код в backend-channelpage-user.js
                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }

                titleElement.textContent = channel.name;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                dayElement.textContent = `Ваше предложение на ${day} число`;
                descriptionElement.textContent = channel.description || 'Описание отсутствует';
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }

    // Обработчик для выбора длительности
    const durationOptions = document.querySelectorAll('.duration-option');
    durationOptions.forEach(option => {
        option.addEventListener('click', function() {
            durationOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Обработчик кнопки "Выставить предложение"
    document.getElementById('submit-offer').addEventListener('click', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel_id');
        const day = urlParams.get('day');
        const price = document.getElementById('offer-price').value;
        const comment = document.getElementById('offer-comment').value;
        const duration = document.querySelector('.duration-option.active')?.textContent;

        if (!price) {
            alert('Пожалуйста, укажите цену');
            return;
        }

        if (!duration) {
            alert('Пожалуйста, выберите длительность');
            return;
        }

        // Здесь можно добавить отправку данных на сервер
        submitOffer(price,channelId,day)
    });
});

function submitOffer(price,channel_id,day) {

    fetch(`/api/reklama?id=${channel_id}&price=${price}&day=${day}`);

    alert('Ваше предложение успешно отправлено!');

}

// Запрашиваем данные канала
if (channelId) {
    socket.emit('get_channel', channelId);
}

// Получаем данные канала и обновляем интерфейс

// Обработка ошибок
socket.on('connect_error', (err) => {
    console.error('Ошибка подключения:', err);
});