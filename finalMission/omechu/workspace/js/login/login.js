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

    // 로그인 요청 AJAX
    fetch('../../backend/api/auth/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login_id: userId,
            password: userPw
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '아이디 또는 비밀번호가 올바르지 않아요!');
                userPwInput.focus();
                return;
            }

            localStorage.setItem('omechu_is_login', 'true');
            localStorage.setItem('omechu_user_no', data.user.no);
            localStorage.setItem('omechu_user_id', data.user.login_id);
            localStorage.setItem('omechu_user_nickname', data.user.nickname);
            localStorage.setItem('omechu_user_role', data.user.role || 'user');
            localStorage.setItem('omechu_is_admin', data.user.isAdmin ? 'true' : 'false');

            alert(`${data.user.nickname}님, 환영해요!`);
            location.href = '../../index.html';
        })
        .catch(function(error) {
            console.error('로그인 요청 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        });
});

guestBtn.addEventListener('click', function() {
    location.href = '../../index.html';
});