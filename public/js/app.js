

Telegram.WebApp.ready();
Telegram.WebApp.expand();


document.querySelectorAll('.action-button').forEach(button => {
  button.addEventListener('click', () => {
    console.log(`Нажата кнопка: ${button.textContent}`);
  });
});


document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    console.log(`Выбран раздел: ${this.textContent}`);
  });
});