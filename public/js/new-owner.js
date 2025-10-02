async function loadChannelData(channelId){
    if (channelId) {
        try {
            initOwnerCalendar(channelId);
            const response = await fetch(`/api/channel?id=${channelId}`);
            if (!response.ok) throw new Error('Ошибка при запросе данных канала');
            const channel = await response.json();

            if (channel) {
                const avatarElement = document.querySelector('.channel-avatar-large');
                const titleElement = document.querySelector('.channel-title-owner');
                const subscribersElement = document.querySelector('.channel-subscribers');
                const descriptionElement = document.querySelector('.channel-description-owner');
                const urlElement = document.querySelector('.channel-url');
                const referralInput = document.getElementById('referralLinkInput');
                const copyBtn = document.getElementById('copyReferralBtn');
                const toggle = document.getElementById('searchVisibilityToggle');
                if (avatarElement) {
                    if (channel.photo_url) {
                        avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                    } else {
                        avatarElement.textContent = channel.name.charAt(0);
                    }
                }
                if (titleElement) titleElement.textContent = channel.name;
                if (subscribersElement) subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                if (descriptionElement) descriptionElement.textContent = channel.description || 'Описание отсутствует';
                if (referralInput) referralInput.value = `t.me/portad_bot?start=${channelId}`;
                if (urlElement && channel.channel_url) {
                    urlElement.textContent = channel.channel_url;
                    urlElement.style.cursor = 'pointer';
                    urlElement.addEventListener('click', () => {
                        window.open(channel.channel_url, '_blank');
                    });
                }else{
                    urlElement.textContent = "Канал приватный";
                }
                if(channel.in_search){
                    toggle.checked = true;
                }else{
                    toggle.checked = false;
                }
                toggle.addEventListener('change', async () => {
                    try {
                        const response = await fetch('/api/update_in_search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ channelId: channelId, in_search: toggle.checked })
                        });
                        const data = await response.json();
                        if (!data.success) {
                            alert('Ошибка при обновлении отображения канала в поиске');
                        }
                    } catch (e) {
                        alert("Ошибка при соединении с сервером");
                    }
                });


                copyBtn.addEventListener('click', () => {
                    referralInput.select();
                    referralInput.setSelectionRange(0, 99999);
                    try {
                        const copied = document.execCommand('copy');
                        if (!copied) {
                            alert('Не удалось скопировать');
                        }
                    } catch (err) {
                        alert('Ошибка копирования');
                    }
                });
                // Загрузка категорий канала
                try {
                    const categoriesResponse = await fetch(`/api/channel-categories?id=${channelId}`);
                    if (!categoriesResponse.ok) throw new Error('Ошибка при запросе категорий');
                    const data = await categoriesResponse.json();

                    if (data.success) {
                        ChannelCategories(data,channelId);
                    } else {
                        AllCategories(channelId);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке категорий:', error);
                    AllCategories();
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }

    // Навешиваем обработчик обновления
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            this.classList.add('refreshing');

            try {
                if (!channelId) throw new Error('channel_id не определён');


                const response = await fetch('/api/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelId: channelId })
                });

                if (!response.ok) {
                    throw new Error('Ошибка при обновлении данных');
                }

                setTimeout(() => {
                    this.classList.remove('refreshing');
                    location.reload();
                }, 1000);

            } catch (error) {
                this.classList.remove('refreshing');
                alert('Ошибка: ' + error.message);
            }
        });
    }

}

// Функция для загрузки и отображения всех категорий с чекбоксами (если канал не имеет своих)
async function AllCategories(channelId) {
    const contentList = document.getElementById('criteria-section');
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
        <div class="criteria-title">Установите тематики канала, чтобы люди видели его в поиске</div>
        <div class="themes-grid">
          ${checkboxesHTML}
        </div>
        <button class="search-btn" id="set-categories-btn">Установить</button>
      `;

        document.getElementById('set-categories-btn').addEventListener('click', async function() {
            const button = this;
            button.textContent = 'Ожидание...';
            button.disabled = true;

            try {
                await saveSelectedCategories(channelId);
                button.textContent = 'Установить';
            } catch (error) {
                button.textContent = 'Ошибка';
                console.error(error);
            } finally {
                button.disabled = false; // Включаем кнопку обратно, даже если произошла ошибка
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки всех категорий:', error);
    }
}

// Сохраняем выбранные категории
async function saveSelectedCategories(channelId) {
    const selectedCheckboxes = document.querySelectorAll('.criteria-section .theme-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!selectedIds.length) {
        alert('Пожалуйста, выберите хотя бы одну категорию.');
        return;
    }

    try {
        const response = await fetch('/api/set-channel-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: channelId,
                categories: selectedIds
            })
        });

        const data = await response.json();

        if (data.success) {
            const categoriesResponse = await fetch(`/api/channel-categories?id=${channelId}`);
            if (!categoriesResponse.ok) throw new Error('Ошибка при запросе категорий');
            const data = await categoriesResponse.json();
            ChannelCategories(data,channelId);
        } else {
            alert("Не нужно нажимать кнопку несколько раз");
            alert
        }
    } catch (error) {
        console.error('Ошибка при отправке категорий:', error);
        alert('Ошибка при отправке категорий');
    }
}


function ChannelCategories(Data,channelId) {
    const contentList = document.getElementById('criteria-section');
    if (!contentList) return;

    const adData = Data.rows;
    const checkboxesHTML = adData.map(cat => `
    <div class="theme-item">
      <label for="theme${cat.id}" class="theme-label">${cat.categorie}</label>
    </div>
  `).join('');

    contentList.innerHTML = `
    <div class="criteria-title">Категории канала</div>
    <div class="themes-grid">
      ${checkboxesHTML}
    </div>
    <button class="search-btn" id="delete-categories-btn">Удалить</button>
  `;

    document.getElementById('delete-categories-btn').addEventListener('click', async () => {
        await deleteSelectedCategories(channelId);
    });
}

// Удаляем все категории канала
async function deleteSelectedCategories(channelId) {
    try {
        const categoriesResponse = await fetch('/api/delete-channel-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: channelId })
        });

        const data = await categoriesResponse.json();

        if (data.success) {
            AllCategories(channelId);
        } else {
            alert('Ошибка при удалении категорий: ' + (data.message || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка при удалении категорий:', error);
        alert('Ошибка при удалении категорий');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const referralInfoBtn = document.getElementById('referralInfoBtn');
    const referralDescription = document.getElementById('referralDescription');

    if (referralInfoBtn && referralDescription) {
        referralInfoBtn.addEventListener('click', () => {
            if (referralDescription.style.display === 'none' || referralDescription.style.display === '') {
                referralDescription.style.display = 'block';
                referralInfoBtn.textContent = 'Скрыть';
            } else {
                referralDescription.style.display = 'none';
                referralInfoBtn.textContent = 'Подробнее';
            }
        });
    }
});
