document.addEventListener('DOMContentLoaded', async function () {
    let currentPage = 1;
    const channelsPerPage = 5;
    let totalPages = 1;
    let currentChannels = [];

    function renderChannelsWithPagination(page) {
        const poiskGrid = document.querySelector('.poisk-result-channels-2');
        poiskGrid.innerHTML = '';

        const startIndex = (page - 1) * channelsPerPage;
        const endIndex = Math.min(startIndex + channelsPerPage, currentChannels.length);
        const pageChannels = currentChannels.slice(startIndex, endIndex);

        pageChannels.forEach(channel => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';

            channelItem.innerHTML = `
                ${channel.photo_url
                ? `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar" />`
                : `<div class="channel-avatar">${channel.name.charAt(0)}</div>`}
                <div class="channel-name">${channel.name}</div>
            `;

            channelItem.addEventListener('click', async () => {
                const data = await fetch(`/api/check-owner-channel?user_id=${userId}&channel_id=${channel.id}`);
                const Data = await data.json();

                if (Data.success) {
                    alert("Вы являетесь владельцем этого канала");
                } else {
                    loadChannelDataUser(channel.id);
                    navigateTo('user');
                }
            });

            poiskGrid.appendChild(channelItem);
        });

        updatePaginationControls();
    }
    function updatePaginationControls() {
        let paginationContainer = document.getElementById('pagination-controls');

        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'pagination-controls';
            paginationContainer.style.display = 'flex'; // Добавляем flex-контейнер
            paginationContainer.style.overflowX = 'auto'; // Горизонтальная прокрутка
            paginationContainer.style.gap = '6px'; // Отступ между кнопками
            paginationContainer.style.padding = '5px 0'; // Небольшие отступы
            paginationContainer.style.maxWidth = '100%'; // Ограничиваем ширину
            document.querySelector('#search-by-criteria').appendChild(paginationContainer);
        }

        paginationContainer.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.innerHTML = '&lt;';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderChannelsWithPagination(currentPage);
                vibrate();
            }
        });
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderChannelsWithPagination(currentPage);
                vibrate();
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.innerHTML = '&gt;';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderChannelsWithPagination(currentPage);
                vibrate();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    document.getElementById('search-name-btn').addEventListener('click', async function () {
        const nameInput = document.getElementById('name-input').value.trim().toLowerCase();
        if (!nameInput) {
            alert('Введите название канала для поиска');
            return;
        }

        try {
            const response = await fetch(`/api/channels-search?name=${encodeURIComponent(nameInput)}`);
            if (!response.ok) {
                throw new Error('Ошибка сервера при поиске каналов');
            }

            const channels = await response.json();

            if (channels.length === 0) {
                alert('Каналы не найдены');
                return;
            } else {
                renderChannels(channels);
            }

        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при поиске каналов');
        }
    });

    const contentList = document.getElementById("categories-list");
    if (!contentList) return;

    try {
        const response = await fetch('/api/all-channel-categories');
        if (!response.ok) {
            contentList.innerHTML = '<div>Ошибка загрузки категорий</div>';
            return;
        }
        const categories = await response.json();

        const checkboxesHTML = categories.map(cat => `
        <div class="theme-item">
          <input type="checkbox" id="theme${cat.id}" class="theme-checkbox" value="${cat.id}" />
          <label for="theme${cat.id}" class="theme-label">${cat.categorie}</label>
        </div>
      `).join('');

        contentList.innerHTML = `
        <div class="themes-grid">
          ${checkboxesHTML}
        </div>
      `;
    } catch (error) {
        console.error('Ошибка загрузки всех категорий:', error);
    }

    document.getElementById('search-criteria-btn').addEventListener('click', async function () {
        const selectedCheckboxes = document.querySelectorAll('.criteria-section .theme-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        const sortOrder = document.getElementById('sort-order').value;

        try {
            const response = await fetch(`/api/channels-by-criteria?categories=${selectedIds.join(',')}&sort=${sortOrder}`);
            if (!response.ok) {
                throw new Error('Ошибка сервера при поиске каналов');
            }

            const channels = await response.json();

            if (channels.length === 0) {
                alert('Каналы не найдены');
                return;
            } else {
                currentChannels = channels;
                currentPage = 1;
                totalPages = Math.ceil(channels.length / channelsPerPage);

                renderChannelsWithPagination(1);
            }

        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при поиске каналов');
        }
    });
});


function renderChannels(channels) {
    const poiskGrid = document.querySelector('.poisk-result-channels');
    poiskGrid.innerHTML = '';

    channels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';

        channelItem.innerHTML = `
            ${channel.photo_url
            ? `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar" />`
            : `<div class="channel-avatar">${channel.name.charAt(0)}</div>`}
            <div class="channel-name">${channel.name}</div>
        `;

        channelItem.addEventListener('click', async () => {
            const data = await fetch(`/api/check-owner-channel?user_id=${userId}&channel_id=${channel.id}`);
            const Data = await data.json();

            if (Data.success) {
                alert("Вы являетесь владельцем этого канала");
            } else {
                loadChannelDataUser(channel.id);
                navigateTo('user');
            }
        });

        poiskGrid.appendChild(channelItem);
    });
}


document.getElementById('back-from-name')?.addEventListener('click', () => {
    document.getElementById('choice-container').style.display = 'block';
    document.getElementById('search-by-name').style.display = 'none';
    vibrate();
});

document.getElementById('back-from-criteria')?.addEventListener('click', () => {
    document.getElementById('choice-container').style.display = 'block';
    document.getElementById('search-by-criteria').style.display = 'none';
    vibrate();
});


document.getElementById('btn-by-name')?.addEventListener('click', () => {
    document.getElementById('choice-container').style.display = 'none';
    document.getElementById('search-by-name').style.display = 'block';
    vibrate();
});

document.getElementById('btn-by-criteria')?.addEventListener('click', () => {
    document.getElementById('choice-container').style.display = 'none';
    document.getElementById('search-by-criteria').style.display = 'block';
    vibrate();
});


document.getElementById('all-themes')?.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#search-by-criteria .themes-grid .theme-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = this.checked;
    });
    vibrate();
});