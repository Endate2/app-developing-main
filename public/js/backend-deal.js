Telegram.WebApp.ready();
Telegram.WebApp.expand();
const userId = Telegram.WebApp.initDataUnsafe.user?.id;

const user = Telegram.WebApp.initDataUnsafe?.user;
const avatarElement = document.querySelector('.channel-avatar-Profil');


if (user) {

    if (user.photo_url) {
        avatarElement.innerHTML = '';
        avatarElement.style.backgroundImage = `url(${user.photo_url})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
    } else {

        const firstNameLetter = user.first_name ? user.first_name[0] : '';
        const lastNameLetter = user.last_name ? user.last_name[0] : '';
        avatarElement.textContent = (firstNameLetter + lastNameLetter).toUpperCase();
    }
}