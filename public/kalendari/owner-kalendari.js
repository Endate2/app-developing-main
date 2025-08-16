const calendarGrid = document.getElementById('calendarGrid');
const monthYear = document.querySelector('.month-year');
const prevButton = document.getElementById('prevMonth');
const nextButton = document.getElementById('nextMonth');



let currentDate = new Date();

function generateCalendar(channelId) {
    calendarGrid.innerHTML = '';


    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });


    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;


    for(let i = 0; i < startDay; i++) {
        createDayElement(channelId,'', true);
    }

    for(let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isCurrent = isToday(date);
        const hasEvent = day % 5 === 0;
        createDayElement(channelId,day, false, isCurrent, hasEvent);
    }

    monthYear.textContent = currentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
    }).replace(' г.', '');
}

function createDayElement(channelId,day, isOtherMonth, isCurrent = false, hasEvent = false) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isCurrent ? 'current-day' : ''}`;
    dayElement.innerHTML = `
        <span>${day}</span>
        ${hasEvent ? '<div class="event-marker"></div>' : ''}
      `;

    if(day) {

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        dayElement.addEventListener('click', () => handleDayClick(date,channelId));
        dayElement.style.cursor = 'pointer';
    }

    calendarGrid.appendChild(dayElement);
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function handleDayClick(date,channelId) {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }


    const now = new Date();
    const dateStr = formatDateToLocal(date);
    const nowStr = formatDateToLocal(now);

    if (date < now && !isSameDay(date, now)) {
        alert("На данную дату нельзя добавить предложения, так как она уже прошла");
    } else {
        loadCreateAdvertisement(dateStr,channelId)

        navigateTo('create-advertisement');
    }
}



function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function isSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

prevButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
});

nextButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
});





window.addEventListener('resize', () => {
    calendarGrid.style.width = '100%';
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.style.minWidth = '';
    });
});