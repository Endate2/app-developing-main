// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();



const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-large');
const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('channel_id');
const day = urlParams.get('date');

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
                const avatarElement = document.querySelector('.channel-avatar-large');
                const titleElement = document.querySelector('.channel-title');
                const subscribersElement = document.querySelector('.channel-subscribers');
                const descriptionElement = document.querySelector('.channel-description');
                const dayElement = document.querySelector('.section-title-2');


                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }

                titleElement.textContent = channel.name;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                dayElement.textContent = `Ваше предложение на ${day} `;
                descriptionElement.textContent = channel.description || 'Описание отсутствует';
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }


    const durationOptions = document.querySelectorAll('.duration-option');
    durationOptions.forEach(option => {
        option.addEventListener('click', function() {
            durationOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });


    document.getElementById('submit-offer').addEventListener('click', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel_id');
        const price = document.getElementById('offer-price').value;
        const duration = document.getElementById('offer-duration').value;
        if (!price) {
            alert('Пожалуйста, укажите цену');
            return;
        }

        if (!duration) {
            alert('Пожалуйста, выберите длительность');
            return;
        }


        submitOffer(price,channelId,duration,day)
    });
});

function submitOffer(price,channel_id,duration,day) {
    fetch(`/api/reklama?id=${channel_id}&duration=${duration}&price=${price}&day=${day}`);

    alert('Ваше предложение успешно отправлено!');

}


if (channelId) {
    socket.emit('get_channel', channelId);
}




socket.on('connect_error', (err) => {
    console.error('Ошибка подключения:', err);
});