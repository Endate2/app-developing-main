
Telegram.WebApp.ready();
Telegram.WebApp.expand();
const userId = Telegram.WebApp.initDataUnsafe.user?.id;

const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-Profil');

e
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
        socket.emit('get_favourites', userId);
    }
});


socket.on("favourites_list", (channels) => {

    safeLocalStorage('set', 'favourite_channels', channels);


    const channelsList = document.getElementById("channels-list");
    channelsList.innerHTML = '';

    channels.forEach(channel => {
        addChannelToUI(channel);
    });
});




function addChannelToUI(channel) {
    const channelsList = document.getElementById("channels-list");

    const channelButton = document.createElement("div");
    channelButton.className = "channel-item";


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

        safeLocalStorage('set', `channel_${channel.id}`, {
            id: channel.id,
            name: channel.name,
            photo_url: channel.photo_url
        });


        const favourites = safeLocalStorage('get', 'favourite_channels') || [];
        if (!favourites.some(fav => fav.id === channel.id)) {
            favourites.push({
                id: channel.id,
                name: channel.name,
                photo_url: channel.photo_url
            });
            safeLocalStorage('set', 'favourite_channels', favourites);
        }

        window.location.href = `channelpage-user.html?channel_id=${channel.id}&userID=${userId}`;
    });

    channelsList.appendChild(channelButton);
}
function loadFavouritesFromLocalStorage() {
    const favourites = safeLocalStorage('get', 'favourite_channels') || [];
    const channelsList = document.getElementById("channels-list");


    channelsList.innerHTML = '';


    favourites.forEach(channel => {
        addChannelToUI(channel);
    });

    return favourites.length > 0;
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