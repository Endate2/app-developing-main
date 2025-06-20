
// Инициализация Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Можно добавить дополнительную логику здесь
document.querySelectorAll('.action-button').forEach(button => {
  button.addEventListener('click', () => {
    console.log(`Нажата кнопка: ${button.textContent}`);
    // Здесь можно добавить обработку кликов по кнопкам
  });
});

// Обработка кликов по навигации
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    console.log(`Выбран раздел: ${this.textContent}`);
    // Здесь можно добавить переключение между разделами
  });
});