






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
    <div class="section-title-2-payment">Стоимость рекламы на ${dateObj.toDateString()}</div>

    <div class="price-item">
      <span class="price-label">Цена за пост</span>
      <span class="price-value-payment">${adData.price}</span>
    </div>

    <div class="price-item">
      <span class="price-label">Длительность</span>
      <label class="form-label">
  Длительность размещения: ${adData.duration ? adData.duration + ' часов' : 'Без удаления'}
</label>
    </div>

    <div class="price-item">
      <span class="price-label">Комиссия сервиса 10% от стоимости</span>
    </div>
    <div class="form-group">
      <label class="form-label">Комментарий к предложению</label>
      <textarea class="form-textarea" id="offer-comment" placeholder="Опишите ваше предложение (необязательно)"></textarea>
    </div>
    <div class="total-price"></div>
    <button id="purchase-button" data-advertisement-id="${adData.id}"class="purchase-button">Разместить рекламу</button>
`;


    contentList.appendChild(payment);
}




