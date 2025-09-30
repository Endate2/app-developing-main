async function loadChannelDataUser(channelId) {
    const response = await fetch(`/api/channel?id=${channelId}`);
    const channel = await response.json();
    if(channel.blocked){
        loadBlocked(channelId);
        navigateTo('blocked');
    }else{
        initUserCalendar(channelId)
        if (channelId) {
            window.socket.emit('get_feedbacks',channelId);
            try {

                if (channel) {
                    const avatarElement = document.querySelector('.channel-avatar-large-user');
                    const titleElement = document.querySelector('.channel-title-user');
                    const subscribersElement = document.querySelector('.channel-subscribers-user');
                    const descriptionElement = document.querySelector('.channel-description-user');
                    const urlElement = document.querySelector('.channel-url-user');


                    if (channel.photo_url) {
                        avatarElement.innerHTML = `<img src="${channel.photo_url}" alt="${channel.name}" class="channel-avatar-large">`;
                    } else {
                        avatarElement.textContent = channel.name.charAt(0);
                    }

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
                    const addReviewBtn = document.getElementById('addReviewBtn');
                    const reviewModal = document.getElementById('reviewModal');
                    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
                    const submitReviewBtn = document.getElementById('submitReviewBtn');
                    const reviewText = document.getElementById('reviewText');

                    addReviewBtn.addEventListener('click', function() {
                        reviewModal.style.display = 'flex';
                    });

                    cancelReviewBtn.addEventListener('click', function() {
                        reviewModal.style.display = 'none';
                        reviewText.value = '';
                    });

                    submitReviewBtn.addEventListener('click', async () => {
                        const text = reviewText.value.trim();
                        if (text) {
                            try {
                                await fetch('/api/feedback', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: channelId, user_id: userId, text: text })
                                });
                                reviewText.value = '';
                                reviewModal.style.display = 'none';
                                window.socket.emit('get_feedbacks',channelId);
                            } catch (e) {
                                console.log('Ошибка добавления запроса')
                            }
                        } else {
                            alert('Пожалуйста, введите текст отзыва');
                        }
                    });
                    document.getElementById('backButton').addEventListener('click', function() {
                        navigateTo('search');
                    });

                    window.addEventListener('click', function(event) {
                        if (event.target === reviewModal) {
                            reviewModal.style.display = 'none';
                            reviewText.value = '';
                        }
                    });




                    const reportBtn = document.getElementById('reportBtn');
                    const reportModal = document.getElementById('reportModal');
                    const cancelReportBtn = document.getElementById('cancelReportBtn');
                    const submitReportBtn = document.getElementById('submitReportBtn');

                    // Открыть модальное окно жалобы
                    reportBtn.addEventListener('click', function() {
                        reportModal.style.display = 'block';
                    });

                    // Закрыть модальное окно жалобы
                    cancelReportBtn.addEventListener('click', function() {
                        reportModal.style.display = 'none';
                    });

                    // Отправить жалобу
                    submitReportBtn.addEventListener('click', async function() {
                        const reason = document.getElementById('reportReason').value;
                        const description = document.getElementById('reportText').value;

                        if (!reason) {
                            alert('Пожалуйста, выберите причину жалобы');
                            return;
                        }

                        try {
                            // Отправляем жалобу на сервер
                            const response = await fetch('/api/submit-complaint', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    reason: reason,
                                    description: description,
                                    channel_id: channelId, // Предполагается, что у вас есть ID канала
                                    user_id: userId // Предполагается, что у вас есть ID пользователя
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                alert('Жалоба отправлена. Спасибо за ваше сообщение!');
                                console.log('Номер жалобы:', result.complaint_id);
                                reportModal.style.display = 'none';

                                // Очистить форму
                                document.getElementById('reportReason').value = '';
                                document.getElementById('reportText').value = '';
                            } else {
                                alert('Ошибка при отправке жалобы: ' + result.error);
                            }
                        } catch (error) {
                            console.error('Ошибка:', error);
                            alert(error);
                        }
                    });

                    // Закрыть модальное окно при клике вне его
                    window.addEventListener('click', function(event) {
                        if (event.target === reportModal) {
                            reportModal.style.display = 'none';
                        }
                    });
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных канала:', error);
            }
        }
    }

}










window.socket.on("connect", () => {
    console.log("Connected to WebSocket server!");


    const hasLocalFeedbacks = loadFeedBacksFromLocalStorage();


    if (channelId && !hasLocalFeedbacks) {
        window.socket.emit('get_feedbacks', channelId);
    }
});


window.socket.on("feedbacks-list", (feedbacks) => {

    safeLocalStorage('set', 'feedback_channels', feedbacks);


    const feedbacksList = document.getElementById("reviewsContainer");
    feedbacksList.innerHTML = '';

    feedbacks.forEach(feedback => {
        addChannelToUIUser(feedback);
    });
});








function addChannelToUIUser(feedback) {
    const feedbacksList = document.getElementById("reviewsContainer");


    const feedback_item = document.createElement("div");
    feedback_item.className = "review-item";

    feedback_item.innerHTML = `
        <div class="review-author">${feedback.first_name} (@${feedback.username})</div>
        <div class="review-text">${feedback.feedback}</div>
    `;

    const feedbackId = `${feedback.user_id}_${feedback.channel_id}`;

    safeLocalStorage('set', `feedback_${feedbackId}`, {
        user_id: feedback.user_id,
        channel_id: feedback.channel_id,
        username: feedback.username,
        feedback: feedback.feedback
    });

    const feedbacks = safeLocalStorage('get', 'feedback_channels') || [];
    if (!feedbacks.some(fav => fav.user_id === feedback.user_id && fav.channel_id === feedback.channel_id)) {
        feedbacks.push({
            user_id: feedback.user_id,
            channel_id: feedback.channel_id,
            username: feedback.username,
            feedback: feedback.feedback
        });
        safeLocalStorage('set', 'feedback_channels', feedbacks);
    }

    feedbacksList.appendChild(feedback_item);
}

function loadFeedBacksFromLocalStorage() {
    const feedbacks= safeLocalStorage('get', 'feedback_channels') || [];
    const feedbacksList = document.getElementById("feedbacks-list");


    feedbacksList.innerHTML = '';


    feedbacks.forEach(feedback => {
        addChannelToUIUser(feedback);
    });

    return feedbacks.length > 0;
}
