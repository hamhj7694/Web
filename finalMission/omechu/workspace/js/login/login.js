// ================================
// 로그인 페이지
// ================================

const loginForm = document.querySelector('#loginForm');
const userIdInput = document.querySelector('#userId');
const userPwInput = document.querySelector('#userPw');
const guestBtn = document.querySelector('#guestBtn');

loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = userIdInput.value.trim();
    const userPw = userPwInput.value.trim();

    if (userId === '') {
        alert('아이디를 입력해주세요!');
        userIdInput.focus();
        return;
    }

    if (userPw === '') {
        alert('비밀번호를 입력해주세요!');
        userPwInput.focus();
        return;
    }

    const savedUsers = getSavedUsers();

    const matchedUser = savedUsers.find(function(user) {
        return user.id === userId && user.password === userPw;
    });

    if (!matchedUser) {
        alert('아이디 또는 비밀번호가 올바르지 않아요!');
        userPwInput.focus();
        return;
    }

    localStorage.setItem('omechu_is_login', 'true');
    localStorage.setItem('omechu_user_id', matchedUser.id);
    localStorage.setItem('omechu_user_nickname', matchedUser.nickname);

    alert(`${matchedUser.nickname}님, 환영해요!`);

    location.href = '../../index.html';
});

guestBtn.addEventListener('click', function() {
    location.href = '../../index.html';
});

function getSavedUsers() {
    const savedData = localStorage.getItem('omechu_users');

    if (!savedData) {
        return [];
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error('회원 데이터를 불러오는 중 오류가 발생했습니다.', error);
        return [];
    }
}