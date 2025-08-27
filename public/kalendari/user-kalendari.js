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

    // Получаем даты текущей недели (понедельник - воскресенье)
    const weekDates = getCurrentWeekDates();
    
    // Пустые дни в начале календаря (если нужно)
    const firstDayOfWeek = weekDates[0].getDay() === 0 ? 6 : weekDates[0].getDay() - 1;
    for (let i = 0; i < firstDayOfWeek; i++) {
        createUserDayElement(channelId, '', true);
    }

    // Дни текущей недели
    weekDates.forEach(date => {
        const day = date.getDate();
        const isCurrent = isUserToday(date);
        const hasEvent = day % 5 === 0; // Пример: отмечаем каждый 5-й день
        createUserDayElement(channelId, day, false, isCurrent, hasEvent, date);
    });

    // Обновление заголовка с информацией о неделе
    if (userMonthYear) {
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        userMonthYear.textContent = `${formatWeekDate(startDate)} - ${formatWeekDate(endDate)}`;
    }
}

// Функция для получения дат текущей недели (понедельник - воскресенье)
function getCurrentWeekDates() {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Находим понедельник текущей недели
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekDates = [];
    
    // Заполняем массив датами недели (7 дней)
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
    }
    
    return weekDates;
}

// Форматирование даты для отображения в заголовке
function formatWeekDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
    });
}

function createUserDayElement(channelId, day, isOtherMonth, isCurrent = false, hasEvent = false, date = null) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isCurrent ? 'current-day' : ''}`;
    dayElement.innerHTML = `
            <span>${day}</span>
            ${hasEvent ? '<div class="event-marker"></div>' : ''}
        `;

    if (day && date) {
        dayElement.addEventListener('click', () => handleUserDayClick(channelId, date));
        dayElement.style.cursor = 'pointer';
        
        // Блокируем даты вне текущей недели
        const today = new Date();
        const weekDates = getCurrentWeekDates();
        const isInCurrentWeek = weekDates.some(weekDate => 
            weekDate.toDateString() === date.toDateString()
        );
        
        if (!isInCurrentWeek) {
            dayElement.style.opacity = '0.5';
            dayElement.style.cursor = 'not-allowed';
            dayElement.onclick = null;
        }
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

    // Проверяем, что дата в пределах текущей недели
    const weekDates = getCurrentWeekDates();
    const isInCurrentWeek = weekDates.some(weekDate => 
        weekDate.toDateString() === date.toDateString()
    );

    if (!isInCurrentWeek) {
        alert("Вы можете выбрать только даты текущей недели");
        return;
    }

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

// Убираем обработчики переключения месяцев, так как теперь показываем только неделю
if (userPrevButton && userNextButton) {
    userPrevButton.style.display = 'none';
    userNextButton.style.display = 'none';
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
