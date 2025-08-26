// Уникальные идентификаторы для элементов пользовательского календаря
const userCalendarGrid = document.getElementById('calendarGrid-user');
const userMonthYear = document.getElementById('month-year-user');
const userPrevButton = document.getElementById('prevMonth-user');
const userNextButton = document.getElementById('nextMonth-user');

let userCurrentDate = new Date();

function initUserCalendar(channelId) {
    userCalendarGrid.setAttribute('data-channel-id', channelId);
    generateUserCalendar(channelId);
}

function generateUserCalendar(channelId) {
    if (!userCalendarGrid) return;

    userCalendarGrid.innerHTML = '';

    // Заголовки дней недели
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        userCalendarGrid.appendChild(dayElement);
    });

    // Расчет дней месяца
    const firstDay = new Date(userCurrentDate.getFullYear(), userCurrentDate.getMonth(), 1);
    const lastDay = new Date(userCurrentDate.getFullYear(), userCurrentDate.getMonth() + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Пустые дни в начале календаря
    for (let i = 0; i < startDay; i++) {
        createUserDayElement(channelId, '', true);
    }

    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(userCurrentDate.getFullYear(), userCurrentDate.getMonth(), day);
        const isCurrent = isUserToday(date);
        const hasEvent = day % 5 === 0; // Пример: отмечаем каждый 5-й день
        createUserDayElement(channelId, day, false, isCurrent, hasEvent);
    }

    // Обновление заголовка месяца и года
    if (userMonthYear) {
        userMonthYear.textContent = userCurrentDate.toLocaleDateString('ru-RU', {
            month: 'long',
            year: 'numeric'
        }).replace(' г.', '');
    }
}

function createUserDayElement(channelId, day, isOtherMonth, isCurrent = false, hasEvent = false) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isCurrent ? 'current-day' : ''}`;
    dayElement.innerHTML = `
            <span>${day}</span>
            ${hasEvent ? '<div class="event-marker"></div>' : ''}
        `;

    if (day) {
        const date = new Date(userCurrentDate.getFullYear(), userCurrentDate.getMonth(), day);
        dayElement.addEventListener('click', () => handleUserDayClick(channelId, date));
        dayElement.style.cursor = 'pointer';
    }

    if (userCalendarGrid) {
        userCalendarGrid.appendChild(dayElement);
    }
}

function isUserToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

async function handleUserDayClick(channelId, date) {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }

    const now = new Date();
    const dateStr = formatUserDateToLocal(date);
    const nowStr = formatUserDateToLocal(now);

    if (date < now && !isUserSameDay(date, now)) {
        alert("На данную дату нельзя посмотреть предложения, так как она уже прошла");
    } else {
        const response = await fetch(`/api/channel-payment-selector?id=${channelId}&date=${dateStr}`);
        const channel = await response.json();
        if (channel && Object.keys(channel).length > 1) {
            await loadChannelDataPayment(channelId,dateStr);
            navigateTo('payment');
        } else {
            loadNooffers(channelId);
            navigateTo('no-offers');
        }
    }
}

function formatUserDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isUserSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

// Инициализация календаря
if (userPrevButton && userNextButton) {
    userPrevButton.addEventListener('click', () => {
        userCurrentDate.setMonth(userCurrentDate.getMonth() - 1);
        const channelId = userCalendarGrid.getAttribute('data-channel-id');
        generateUserCalendar(channelId);
    });

    userNextButton.addEventListener('click', () => {
        userCurrentDate.setMonth(userCurrentDate.getMonth() + 1);
        const channelId = userCalendarGrid.getAttribute('data-channel-id');
        generateUserCalendar(channelId);
    });
}

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    if (userCalendarGrid) {
        userCalendarGrid.style.width = '100%';
        document.querySelectorAll('#calendarGrid-user .calendar-day').forEach(day => {
            day.style.minWidth = '';
        });
    }
});
