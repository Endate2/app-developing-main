const calendarGrid = document.getElementById('calendarGrid');
const monthYear = document.querySelector('.month-year');
const prevButton = document.getElementById('prevMonth');
const nextButton = document.getElementById('nextMonth');



let currentDate = new Date();

function generateCalendar() {
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
        createDayElement('', true);
    }

    for(let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isCurrent = isToday(date);
        const hasEvent = day % 5 === 0;
        createDayElement(day, false, isCurrent, hasEvent);
    }

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

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        dayElement.addEventListener('click', () => handleDayClick(date));
        dayElement.style.cursor = 'pointer';
    }

    calendarGrid.appendChild(dayElement);
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function handleDayClick(date) {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel_id');

    const now = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];
    if (now > date){
        alert("На данную дату нельзя добавить предложения, так как она уже прошла")
    }else {
        window.location.href = `/create_advertisement?channel_id=${channelId}&date=${dateStr}`;
    }

}


prevButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
});

nextButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
});


generateCalendar();


window.addEventListener('resize', () => {
    calendarGrid.style.width = '100%';
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.style.minWidth = '';
    });
});