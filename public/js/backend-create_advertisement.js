async function loadCreateAdvertisement(day, channelId) {
    window.socket.emit('get_advertisements', day,channelId);

    if (channelId) {
        try {
            const channelResponse = await fetch(`/api/channel?id=${channelId}`);
            const channel = await channelResponse.json();

            if (channel) {
                const avatarElement = document.querySelector('.channel-avatar-large-advertisement');
                const titleElement = document.querySelector('.channel-title-advertisement');
                const subscribersElement = document.querySelector('.channel-subscribers-advertisement');
                const descriptionElement = document.querySelector('.channel-description-advertisement');
                const dayElement = document.querySelector('.section-title-2-advertisement');
                const dateElement = document.getElementById('current-offer-date');
                const urlElement = document.querySelector('.channel-url-advertisement');
                const dateObjElement = new Date(day);

                if (channel.photo_url) {
                    avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                } else {
                    avatarElement.textContent = channel.name.charAt(0);
                }
                dateElement.textContent = dateObjElement.toDateString();
                titleElement.textContent = channel.name;
                subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
                descriptionElement.textContent = channel.description || 'Описание отсутствует';

                if (channel.channel_url) {
                    urlElement.textContent = channel.channel_url;
                    urlElement.style.cursor = 'pointer';
                    urlElement.addEventListener('click', () => {
                        window.open(channel.channel_url, '_blank');
                    });
                }else{
                    urlElement.textContent = "Канал приватный";
                }
                document.addEventListener('click', async function(e) {
                    if (e.target && e.target.classList.contains('delete-button')) {
                        e.preventDefault();

                        const advertisementId = e.target.dataset.advertisementId;
                        const channelId = e.target.dataset.channelId;
                        const day = e.target.dataset.day;
                        const dateObj = new Date(day);
                        if (!advertisementId || !channelId || !day) {
                            alert('Недостаточно данных для удаления');
                            return;
                        }

                        try {
                            const res = await fetch('/api/reklama-delete', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                    id: advertisementId,
                                    channelId: channelId,
                                    day: dateObj.toDateString()
                                })
                            });
                            const data = await res.json();
                            if (data.success) {
                                window.socket.emit('get_advertisements', dateObj.toDateString(), channelId);
                            } else {
                                alert(data.day);
                            }
                        } catch (err) {
                            console.error('Ошибка при удалении:', err);
                            alert('Произошла ошибка при удалении');
                        }
                    } else if (e.target && e.target.id === 'submit-offer') {
                        e.preventDefault();
                        const price = document.getElementById('offer-price').value;
                        const duration = document.getElementById('offer-duration').value; // Исправлено получение длительности

                        if (!price) {
                            alert('Пожалуйста, укажите цену');
                            return;
                        }

                        if (price <= 0 || price >= 100_000_000) {
                            alert('Цена должна быть больше 0');
                            return;
                        }

                        if (duration !== '' && duration != null) {  // если duration задана (не пуста)
                            const numDuration = Number(duration);
                            if (isNaN(numDuration) || numDuration <= 0 || numDuration >= 100_000_000) {
                                alert('Длительность должна быть больше 0 и меньше 100000000');
                                return;
                            }
                        }




                        if (!channelId || !day) {
                            alert('Не удалось определить канал или дату');
                            return;
                        }

                        submitOffer(price, channelId, duration, day);
                    }
                });

            }


        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    }

    const durationOptions = document.querySelectorAll('.duration-option');
    durationOptions.forEach(option => {
        option.addEventListener('click', function () {
            durationOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });

}

async function submitOffer(price, channel_id, duration, day) {
    try {
        const response = await fetch('/api/reklama', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: channel_id, duration: duration, price: price, day: day})
        });
        const data = await response.json();

        if (data.success) {
            window.socket.emit('get_advertisements', day, channel_id);
        } else {
            alert('Ошибка при добавлении предложения');
        }
    } catch (error) {
        alert('Произошла ошибка при отправке предложения.');
        console.error('Ошибка:', error);
    }
}


function addBlockTo(adData) {
    const contentList = document.getElementById('content-list');
    if (!contentList) return;
    const advertisement = document.createElement('div');
    advertisement.className = "offer-form";
    const day = adData.date_of_advertisement;
    const dateObj = new Date(day);
    advertisement.innerHTML = `
  <div class="section-title-2">Ваше предложение на ${dateObj.toDateString()}</div>
  <div class="form-group">
      <label class="form-label">Ваша цена за размещение: ${adData.price} руб</label>
  </div>
  <div class="form-group">
      <label class="form-label">
  Длительность размещения: ${adData.duration ? adData.duration + ' часов' : 'Без удаления'}
</label>

  </div>
  <button class="delete-button" data-advertisement-id="${adData.id}" data-channel-id="${adData.channel_id}" data-day="${adData.date_of_advertisement}">Удалить предложение</button>
`;


    contentList.appendChild(advertisement);
}


window.socket.on("advertisements_list", (advertisements) => {
    const advertisementsList = document.getElementById("content-list");
    if (advertisementsList) {
        advertisementsList.innerHTML = '';  // очистка контейнера
        advertisements.forEach(advertisement => addBlockTo(advertisement));
    }
});


