// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Получаем данные пользователя
const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-large');
const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('channel_id');
const userID = urlParams.get('userID');
let advertisementID = 0;

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
    const day = urlParams.get('date');
    if (channelId) {
        try {
            const response = await fetch(`/api/channel-payment-selector?id=${channelId}&date=${day}`);
            const channel = await response.json();
            if (channel && Object.keys(channel).length > 1) {
                advertisementID = channel.advertisementid || 0;
                const dayElement = document.querySelector('.section-title-2')
                const avatarElement = document.querySelector('.channel-avatar-large');
                const titleElement = document.querySelector('.channel-title');
                const subscribersElement = document.querySelector('.channel-subscribers');
                const descriptionElement = document.querySelector('.channel-description');
                const priceElement = document.querySelector('.price-value');
                const durationElement = document.querySelector('.duration-value');


                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }

                titleElement.textContent = channel.name;
                dayElement.textContent = `Стоимость рекламы на ${day} `;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                descriptionElement.textContent = 'Описание отсутствует';
                priceElement.textContent = `${channel.price} `;
                durationElement.textContent = `${channel.duration}`;
            }else{
                window.location.href = `no-offers`;
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const ReklamaButton = document.getElementById('purchase-button');

    ReklamaButton.addEventListener('click', async function() {
        const urlParams = new URLSearchParams(window.location.search);

        const comment = document.getElementById('offer-comment').value; // Получаем при клике
        try {
            const response = await fetch(`/api/channel-owner?id=${channelId}`);
            const user = await response.json();
            await fetch(`/api/create_notification?id=${user.id}&user=${userID}&advertisementID=${advertisementID}&comment=${encodeURIComponent(comment)}`);
            alert("Ваше предложение отправлено!")
        } catch (error) {
            console.error("Ошибка при запросе:", error);
        }
    });
});


if (channelId) {
    socket.emit('get_channel', channelId);
}




socket.on('connect_error', (err) => {
    console.error('Ошибка подключения:', err);
});



