
Telegram.WebApp.ready();
Telegram.WebApp.expand();
const userId = Telegram.WebApp.initDataUnsafe.user?.id;

const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-Profil');


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

    if (user.photo_url) {
        avatarElement.innerHTML = '';
        avatarElement.style.backgroundImage = `url(${user.photo_url})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
    } else {

        const firstNameLetter = user.first_name ? user.first_name[0] : '';
        const lastNameLetter = user.last_name ? user.last_name[0] : '';
        avatarElement.textContent = (firstNameLetter + lastNameLetter).toUpperCase();
    }
}
const socket = io(window.location.origin);


socket.on("connect", () => {
    console.log("Connected to WebSocket server!");


    const hasLocalFavourites = loadFavouritesFromLocalStorage();


    if (userId && !hasLocalFavourites) {
        socket.emit('get_notification', userId);
    }
});


socket.on("notification_list", (notifications) => {

    safeLocalStorage('set', 'notifications', notifications);


    const notificationList = document.getElementById("notifications-list");
    notificationList.innerHTML = '';

    notifications.forEach(notification => {
        addNotificationToUI(notification);
    });
});


function addNotificationToUI(notification) {
    const notificationsList = document.getElementById("notifications-list");

    const notificationElement = document.createElement("div");
    notificationElement.className = "notification-item";
    if (Number(notification.id_categorie) === 1){
        notificationElement.innerHTML = `
        <div class="notification-content" data-notification-id="${notification.id}">
            <div class="notification-channel">
                <span class="notification-label">Канал:</span>
                <span class="notification-value">${notification.channel_name}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Дата размещения:</span>
                <span class="notification-value">${notification.date_of_advertisement}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Длительность размещения:</span>
                <span class="notification-value">${notification.duration}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Цена:</span>
                <span class="notification-value">${notification.price}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Комментарий:</span>
                <span class="notification-value">${notification.comment}</span>
            </div>
        </div>
        <div class="action-buttons">
          <button class="btn btn-accept">Принять</button>
          <button class="btn btn-reject">Отклонить</button>
        </div>
    `;
    }else{
        notificationElement.innerHTML = `
        <div class="notification-content" data-notification-id="${notification.id}">
            <div class="notification-channel">
                <span class="notification-label">Канал:</span>
                <span class="notification-value">${notification.channel_name}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Дата размещения:</span>
                <span class="notification-value">${notification.date_of_advertisement}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Длительность размещения:</span>
                <span class="notification-value">${notification.duration}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Цена:</span>
                <span class="notification-value">${notification.price}</span>
            </div>
            <div class="notification-date">
                <span class="notification-label">Комментарий:</span>
                <span class="notification-value">Ваше предложение было принято! Перейдите на страницу сделки.</span>
            </div>
        </div>
        <div class="action-buttons">
          <button class="btn btn-cross">Перейти</button>
        </div>
    `;
    }




    notificationsList.appendChild(notificationElement);
}
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-accept') || e.target.classList.contains('btn-reject')) {
        const notificationItem = e.target.closest('.notification-item');
        const notificationId = notificationItem.querySelector('.notification-content').dataset.notificationId;

        if (e.target.classList.contains('btn-reject')) {  // Исправлено с reject_notification на btn-reject
            socket.emit('reject_notification', { userId, notificationId });  // Отправляем объект с данными
        } else {
            socket.emit('accept_notification', { userId, notificationId });
        }

        notificationItem.remove();
    }
});
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-cross')) {
        window.location.href = `deal`;

    }
});
function loadFavouritesFromLocalStorage() {
    const notifications = safeLocalStorage('get', 'notification') || [];
    const notificationsList = document.getElementById("notifications-list");


    notificationsList.innerHTML = '';


    notifications.forEach(notification => {
        addChannelToUI(notification);
    });

    return notifications.length > 0;
}

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});


document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('calendar-day-active'));
        this.classList.add('calendar-day-active');
    });
});