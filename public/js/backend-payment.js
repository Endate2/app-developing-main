






async function loadChannelDataPayment(channelId,day) {
    window.socket.emit('get_advertisements_payment', day,channelId);
    let channel = null;
    if (channelId) {
        try {
            const response = await fetch(`/api/channel-payment-selector?id=${channelId}&date=${day}`);
            channel = await response.json();
            const avatarElement = document.querySelector('.channel-avatar-large-payment');
            const titleElement = document.querySelector('.channel-title-payment');
            const subscribersElement = document.querySelector('.channel-subscribers-payment');
            const descriptionElement = document.querySelector('.channel-description-payment');
            const priceElement = document.querySelector('.price-value-payment');
            const durationElement = document.querySelector('.duration-value-payment');
            const urlElement = document.querySelector('.channel-url-payment');


            if (channel.photo_url) {
                avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
            } else {
                avatarElement.textContent = channel.name.charAt(0);
            }
            if (urlElement && channel.channel_url) {
                urlElement.textContent = channel.channel_url;
                urlElement.style.cursor = 'pointer';
                urlElement.addEventListener('click', () => {
                    window.open(channel.channel_url, '_blank');
                });
            }else{
                urlElement.textContent = "Канал приватный";
            }
            titleElement.textContent = channel.name;
            subscribersElement.textContent = `${channel.subscribers.toLocaleString()} подписчиков`;
            descriptionElement.textContent = 'Описание отсутствует';
        } catch (error) {
            console.error('Ошибка при загрузке данных канала:', error);
        }
    }
    document.getElementById('content-list-payment').addEventListener('click', async function(e) {
        if (e.target && e.target.matches('.purchase-button')) {
            const advertisementId = e.target.dataset.advertisementId;
            const comment = document.getElementById('offer-comment').value;

            try {
                const response = await fetch(`/api/channel-owner?id=${channelId}`);
                const user = await response.json();

                const result = await fetch(`/api/create_notification?id=${user.id}&user=${userId}&advertisementID=${advertisementId}&comment=${encodeURIComponent(comment)}`);
                const data = await result.json();

                if (data.success) {
                    alert("Ваше предложение отправлено!");
                } else {
                    alert('Вы уже отправили предложение');
                }
            } catch (error) {
                alert('Произошла ошибка при отправке предложения.');
                console.error('Ошибка:', error);
            }
        }
    });

}

window.socket.on("payments_list", (payments) => {
    const paymentsList = document.getElementById("content-list-payment");
    if (paymentsList) {
        paymentsList.innerHTML = '';  // очистка контейнера
        payments.forEach(payment => addBlockToPayment(payment));
    }
});

function addBlockToPayment(adData) {
    const contentList = document.getElementById('content-list-payment');
    if (!contentList) return;

    const payment = document.createElement('div');
    payment.className = "ad-price-container";
    const day = adData.date_of_advertisement;
    const dateObj = new Date(day);
    payment.innerHTML = `
    <div class="ad-price-container">
  <div class="section-title-2-payment">Стоимость рекламы на ${dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</div>

  <div class="price-item">
    <div class="price-label-container">
      <i class="fas fa-money-bill-wave price-icon"></i>
      <span class="price-label">Цена за пост</span>
    </div>
    <span class="price-value">${adData.price} руб</span>
  </div>

  <div class="price-item">
    <div class="price-label-container">
      <i class="fas fa-clock price-icon"></i>
      <span class="price-label">Длительность</span>
    </div>
    <span class="duration-value">${adData.duration ? adData.duration + ' часов' : 'Без удаления'}</span>
  </div>

  <div class="price-item commission">
    <div class="price-label-container">
      <i class="fas fa-percentage price-icon"></i>
      <span class="price-label">Включая комиссию сервиса (10%)</span>
    </div>
    <span class="commission-value">${Math.round(adData.price * 0.1)} руб</span>
  </div>

  <div class="form-group">
    <div class="price-label-container">
      <i class="fas fa-comment price-icon"></i>
      <label class="form-label">Комментарий к предложению</label>
    </div>
    <textarea class="form-textarea" id="offer-comment" placeholder="Опишите ваше предложение (необязательно)"></textarea>
  </div>
  
  <button class="purchase-button" data-advertisement-id="${adData.id}">
    <i class="fas fa-check-circle"></i> Разместить рекламу
  </button>
</div>
`;


    contentList.appendChild(payment);
}




