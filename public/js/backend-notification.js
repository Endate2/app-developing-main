
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

    notificationElement.innerHTML = `
        <div class="notification-content">
            <div class="notification-date">Дата: ${notification.date_of_advertisement}</div>
            <div class="notification-price">Цена: ${notification.price}</div>
            <div class="notification-channel">Канал ID: ${notification.channel_name}</div>
        </div>
    `;

    notificationsList.appendChild(notificationElement);
}
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