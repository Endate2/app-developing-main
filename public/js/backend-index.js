
Telegram.WebApp.ready();
Telegram.WebApp.expand();
const userId = Telegram.WebApp.initDataUnsafe.user?.id;
const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-Profil');

const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('channel_id');

if (channelId) {
    loadChannelData(channelId);
    navigateTo('owner');
}

if (user) {
    fetch('https://endate2-app-developing-main-d2d3.twc1.net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })
        .then(res => res.json())
        .then(data => console.log('User saved:', data))
        .catch(err => console.error('Ошибка при сохранении пользователя:', err));

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

function initReklamaPage() {
    const lastMode = safeLocalStorage('get', 'last_mode');
    if (lastMode === 'buy') {
        document.getElementById('buy-mode').classList.add('active');
    } else {
        document.getElementById('sell-mode').classList.add('active');
    }

    const cachedChannels = safeLocalStorage('get', 'cached_channels');
    if (cachedChannels) {
        cachedChannels.forEach(channel => addChannelToUI(channel, "channels-list"));
        console.log('Используются кэшированные каналы');
    }

    if (userId) {
        window.socket.emit('get_channels', userId);
    }

    const activeTab = safeLocalStorage('get', 'active_tab') || 'reklama.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.querySelector('a').getAttribute('href') === activeTab) {
            item.classList.add('active');
        }
    });

    document.getElementById('buy-mode')?.addEventListener('click', () => {
        safeLocalStorage('set', 'last_mode', 'buy');
        document.getElementById('buy-mode').classList.add('active');
        document.getElementById('sell-mode').classList.remove('active');
        vibrate();
    });

    document.getElementById('sell-mode')?.addEventListener('click', () => {
        safeLocalStorage('set', 'last_mode', 'sell');
        document.getElementById('sell-mode').classList.add('active');
        document.getElementById('buy-mode').classList.remove('active');
        vibrate();
    });
    document.getElementById('add-channel-btn')?.addEventListener('click', () => {
        Telegram.WebApp.openTelegramLink('https://t.me/your_bot_username?startgroup=true');
    });
}

function addChannelToUI(channel, listId = "channels-list-favourites") {
    const channelsList = document.getElementById(listId);
    if (!channelsList) return;

    const existingChannel = Array.from(channelsList.children).find(item => {
        return item.dataset.channelId === channel.id;
    });

    if (existingChannel) return;

    const channelButton = document.createElement(listId === "channels-list-favourites" ? "div" : "button");
    channelButton.className = listId === "channels-list-favourites" ? "channel-item" : "channel-button";

    const avatarContent = channel.photo_url
        ? `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar">`
        : `<div class="channel-avatar">${channel.name.charAt(0)}</div>`;

    channelButton.innerHTML = `
        <div class="${listId === "channels-list-favourites" ? "channel-item" : "channel-info"}">
            <div>${avatarContent}</div>
            <div class="channel-name">${channel.name}</div>
            ${listId === "channels-list" ? `<div class="channel-subs">${channel.subscribers || '0'} подписчиков</div>` : ''}
        </div>
    `;

    channelButton.addEventListener('click', async () => {
        safeLocalStorage('set', `channel_${channel.id}`, {
            id: channel.id,
            name: channel.name,
            photo_url: channel.photo_url
        });

        vibrate();

        if (listId === "channels-list-favourites") {
            const favourites = safeLocalStorage('get', 'favourite_channels') || [];
            if (!favourites.some(fav => fav.id === channel.id)) {
                favourites.push({
                    id: channel.id,
                    name: channel.name,
                    photo_url: channel.photo_url
                });
                safeLocalStorage('set', 'favourite_channels', favourites);
            }

            const data = await fetch(`/api/check-owner-channel?user_id=${userId}&channel_id=${channel.id}`);
            const Data = await data.json();

            if (Data.success) {
                alert("Вы являетесь владельцем этого канала");
            } else {
                history.pushState(null, null, `channelpage-user.html?channel_id=${channel.id}&userID=${userId}`);
            }
        } else {
            loadChannelData(channel.id);


            navigateTo('owner');


        }
    });

    channelsList.appendChild(channelButton);
}


window.socket.on("channels_list", (channels) => {
    const channelsList = document.getElementById("channels-list");
    if (channelsList) {
        channelsList.innerHTML = '';
        safeLocalStorage('set', 'cached_channels', channels);
        channels.forEach(channel => addChannelToUI(channel, "channels-list"));
    }
});

window.socket.on("channel_added", (channel) => {
    console.log("Новый канал добавлен:", channel);
    if (channel.user_id === userId) {
        const cachedChannels = safeLocalStorage('get', 'cached_channels') || [];
        const updatedChannels = [...cachedChannels, channel];
        safeLocalStorage('set', 'cached_channels', updatedChannels);
        addChannelToUI(channel, "channels-list");
    }
});




window.socket.on("connect_error", (err) => {
    console.error("Ошибка подключения WebSocket:", err);
    safeLocalStorage('remove', 'websocket_connected');
});


function loadFavouritesFromLocalStorage() {
    const favourites = safeLocalStorage('get', 'favourite_channels') || [];
    const channelsList = document.getElementById("channels-list-favourites");
    if (channelsList) {
        channelsList.innerHTML = '';
        favourites.forEach(channel => addChannelToUI(channel, "channels-list-favourites"));
    }
    return favourites.length > 0;
}


function navigateTo(page) {
    document.querySelectorAll('.page-container').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(`${page}-page`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

    vibrate();

    if (page === 'reklama') {
        initReklamaPage();
    }
}


document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        navigateTo(page);
    });
});





function vibrate() {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}


document.getElementById('Telegram')?.addEventListener('click', () => {
    window.open("https://t.me/port_sp", '_blank');
    vibrate();
});

document.getElementById('Git')?.addEventListener('click', () => {
    window.open("https://github.com/port-ru", '_blank');
    vibrate();
});

document.getElementById('Inst')?.addEventListener('click', () => {
    window.open("https://www.instagram.com/p0rt_company/", '_blank');
    vibrate();
});
document.getElementById('copyReferralBtn')?.addEventListener('click', () => {
    vibrate();
});
document.getElementById('submit-offer')?.addEventListener('click', () => {
    vibrate();
});
document.getElementById('support')?.addEventListener('click', () => {
    window.open("https://t.me/spb_port", '_blank');
    vibrate();
});
const shareUrl = 'https://t.me/your_bot_username?start=app_name';
const shareText = encodeURIComponent('Попробуй это классное Telegram мини-приложение для покупки рекламы!');

document.getElementById('share').addEventListener('click', () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    window.open(url, '_blank');
    vibrate();
});
document.getElementById('userdoc')?.addEventListener('click', () => {
    vibrate();
});
document.getElementById('about')?.addEventListener('click', () => {
    vibrate();
});
document.getElementById('UserId')?.addEventListener('click', () => {
    alert(userId);
    vibrate();
});
document.getElementById('Screen')?.addEventListener('click', () => {
    vibrate();
});
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('calendar-day-active'));
        this.classList.add('calendar-day-active');
    });
});


document.getElementById('all-themes')?.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#search-by-criteria .themes-grid .theme-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = this.checked;
    });
});

Telegram.WebApp.onEvent('themeChanged', (theme) => {
    safeLocalStorage('set', 'tma_theme', theme);
    Telegram.WebApp.setHeaderColor(theme);
});

const savedTheme = safeLocalStorage('get', 'tma_theme');
if (savedTheme) {
    Telegram.WebApp.setHeaderColor(savedTheme);
}

// Начальная загрузка
navigateTo('profile');
