Telegram.WebApp.ready();
Telegram.WebApp.expand();


const userId = Telegram.WebApp.initDataUnsafe.user?.id;


const socket = io(window.location.origin);


document.getElementById('buy-mode').addEventListener('click', function() {
    if (!this.classList.contains('active')) {
        localStorage.setItem('last_mode', 'buy');
        window.location.href = 'poisk.html';
    }
});

document.getElementById('sell-mode').addEventListener('click', function() {
    if (!this.classList.contains('active')) {
        localStorage.setItem('last_mode', 'sell');
        window.location.href = 'reklama.html';
    }
});


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


function addChannelToUI(channel) {
    const channelsList = document.getElementById("channels-list");

    const channelButton = document.createElement("button");
    channelButton.className = "channel-button";

    const avatarContent = channel.photo_url
        ? `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar">`
        : `<div class="channel-avatar">${channel.name.charAt(0)}</div>`;

    channelButton.innerHTML = `
        <div class="channel-info">
            <div class="channel-avatar">${avatarContent}</div>
            <div class="channel-name">${channel.name}</div>
            <div class="channel-subs">${channel.subscribers || '0'} подписчиков</div>
        </div>
    `;

    channelButton.addEventListener('click', () => {

        safeLocalStorage('set', `channel_${channel.id}`, {
            id: channel.id,
            name: channel.name,
            photo_url: channel.photo_url
        });
        window.location.href = `channelpage-owner.html?channel_id=${channel.id}`;
    });

    channelsList.appendChild(channelButton);
}


document.addEventListener('DOMContentLoaded', () => {

    const lastMode = safeLocalStorage('get', 'last_mode');
    if (lastMode === 'buy') {
        document.getElementById('buy-mode').classList.add('active');
    } else {
        document.getElementById('sell-mode').classList.add('active');
    }


    const cachedChannels = safeLocalStorage('get', 'cached_channels');
    if (cachedChannels) {
        cachedChannels.forEach(channel => addChannelToUI(channel));
        console.log('Используются кэшированные каналы');
    }


    if (userId) {
        socket.emit('get_channels', userId);
    }


    const activeTab = safeLocalStorage('get', 'active_tab') || 'reklama.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.querySelector('a').getAttribute('href') === activeTab) {
            item.classList.add('active');
        }
    });
});


socket.on("connect", () => {
    console.log("Connected to WebSocket server!");
    safeLocalStorage('set', 'websocket_connected', true);
});

socket.on("channels_list", (channels) => {
    const channelsList = document.getElementById("channels-list");
    channelsList.innerHTML = '';


    safeLocalStorage('set', 'cached_channels', channels);

    channels.forEach(channel => {
        addChannelToUI(channel);
    });
});

socket.on("channel_added", (channel) => {
    console.log("Новый канал добавлен:", channel);
    if (channel.user_id === userId) {

        const cachedChannels = safeLocalStorage('get', 'cached_channels') || [];
        const updatedChannels = [...cachedChannels, channel];
        safeLocalStorage('set', 'cached_channels', updatedChannels);

        addChannelToUI(channel);
    }
});

socket.on("connect_error", (err) => {
    console.error("Ошибка подключения WebSocket:", err);
    safeLocalStorage('remove', 'websocket_connected');
});


document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        const tabName = this.querySelector('a').getAttribute('href');
        safeLocalStorage('set', 'active_tab', tabName);
    });
});


document.getElementById('add-channel-btn').addEventListener('click', () => {
    Telegram.WebApp.openTelegramLink('https://t.me/your_bot_username?startgroup=true');
});


Telegram.WebApp.onEvent('themeChanged', (theme) => {
    safeLocalStorage('set', 'tma_theme', theme);
    Telegram.WebApp.setHeaderColor(theme);
});


const savedTheme = safeLocalStorage('get', 'tma_theme');
if (savedTheme) {
    Telegram.WebApp.setHeaderColor(savedTheme);
}