const calendarGrid = document.getElementById('calendarGrid');
const monthYear = document.querySelector('.month-year');
const prevButton = document.getElementById('prevMonth');
const nextButton = document.getElementById('nextMonth');



let currentDate = new Date();

function generateCalendar() {
    calendarGrid.innerHTML = '';

    // Заголовки дней
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // Расчет дней
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Пустые ячейки
    for(let i = 0; i < startDay; i++) {
        createDayElement('', true);
    }

    // Основные дни
    for(let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isCurrent = isToday(date);
        const hasEvent = day % 5 === 0;
        createDayElement(day, false, isCurrent, hasEvent);
    }

    // Обновление заголовка
    monthYear.textContent = currentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
    }).replace(' г.', '');
}

function createDayElement(day, isOtherMonth, isCurrent = false, hasEvent = false) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isCurrent ? 'current-day' : ''}`;
    dayElement.innerHTML = `
        <span>${day}</span>
        ${hasEvent ? '<div class="event-marker"></div>' : ''}
      `;

    if(day) {
        dayElement.addEventListener('click', () => handleDayClick(day));
        dayElement.style.cursor = 'pointer';
    }

    calendarGrid.appendChild(dayElement);
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function handleDayClick(day) {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel_id');
    window.location.href = `/payment?channel_id=${channelId}`;
}

// Навигация
prevButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
});

nextButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
});

// Инициализация
generateCalendar();

// Адаптация при ресайзе
window.addEventListener('resize', () => {
    calendarGrid.style.width = '100%';
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.style.minWidth = '';
    });
});