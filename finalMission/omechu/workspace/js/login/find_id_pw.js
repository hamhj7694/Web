// ================================
// ID / PW 찾기 페이지
// DB/PHP API 연동 버전
// ================================

const findTabButtons = document.querySelectorAll('.find_tab_btn');

const findIdForm = document.querySelector('#findIdForm');
const findPwForm = document.querySelector('#findPwForm');

const findIdEmailInput = document.querySelector('#findIdEmail');
const findIdResult = document.querySelector('#findIdResult');

const findPwIdInput = document.querySelector('#findPwId');
const findPwEmailInput = document.querySelector('#findPwEmail');
const newPwInput = document.querySelector('#newPw');
const newPwCheckInput = document.querySelector('#newPwCheck');
const findPwResult = document.querySelector('#findPwResult');

const guestBtn = document.querySelector('#guestBtn');

const FIND_ID_API_URL = '../../backend/api/auth/find_id.php';
const RESET_PASSWORD_API_URL = '../../backend/api/auth/reset_password.php';


// ================================
// 1. 탭 전환
// ================================

findTabButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const target = button.dataset.target;

        findTabButtons.forEach(function(tabButton) {
            tabButton.classList.remove('is-active');
        });

        button.classList.add('is-active');

        if (target === 'findIdBox') {
            findIdForm.classList.remove('hidden');
            findPwForm.classList.add('hidden');
        }

        if (target === 'findPwBox') {
            findPwForm.classList.remove('hidden');
            findIdForm.classList.add('hidden');
        }

        hideResultBoxes();
    });
});


// ================================
// 2. 아이디 찾기
// ================================

findIdForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = findIdEmailInput.value.trim();
    const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    hideResultBoxes();

    if (email === '') {
        alert('이메일을 입력해주세요!');
        findIdEmailInput.focus();
        return;
    }

    if (!emailRegExp.test(email)) {
        alert('올바른 이메일 형식으로 입력해주세요!');
        findIdEmailInput.focus();
        return;
    }

    fetch(FIND_ID_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            findIdResult.classList.remove('hidden');

            if (!data.success) {
                findIdResult.innerHTML = data.message || '일치하는 회원 정보를 찾을 수 없어요.';
                return;
            }

            findIdResult.innerHTML = `
                찾은 아이디는 <strong>${escapeHTML(data.login_id)}</strong> 입니다.
            `;
        })
        .catch(function(error) {
            console.error('아이디 찾기 실패:', error);

            findIdResult.classList.remove('hidden');
            findIdResult.innerHTML = '서버와 통신 중 오류가 발생했어요.';
        });
});


// ================================
// 3. 비밀번호 변경
// ================================

findPwForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = findPwIdInput.value.trim();
    const email = findPwEmailInput.value.trim();
    const newPw = newPwInput.value.trim();
    const newPwCheck = newPwCheckInput.value.trim();

    const idRegExp = /^[a-zA-Z0-9]{4,}$/;
    const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    hideResultBoxes();

    if (userId === '') {
        alert('아이디를 입력해주세요!');
        findPwIdInput.focus();
        return;
    }

    if (!idRegExp.test(userId)) {
        alert('아이디는 영문, 숫자 조합 4자 이상으로 입력해주세요!');
        findPwIdInput.focus();
        return;
    }

    if (email === '') {
        alert('이메일을 입력해주세요!');
        findPwEmailInput.focus();
        return;
    }

    if (!emailRegExp.test(email)) {
        alert('올바른 이메일 형식으로 입력해주세요!');
        findPwEmailInput.focus();
        return;
    }

    if (newPw === '') {
        alert('새 비밀번호를 입력해주세요!');
        newPwInput.focus();
        return;
    }

    if (newPw.length < 4) {
        alert('새 비밀번호는 4자 이상 입력해주세요!');
        newPwInput.focus();
        return;
    }

    if (newPwCheck === '') {
        alert('새 비밀번호 확인을 입력해주세요!');
        newPwCheckInput.focus();
        return;
    }

    if (newPw !== newPwCheck) {
        alert('새 비밀번호가 서로 달라요!');
        newPwCheckInput.focus();
        return;
    }

    fetch(RESET_PASSWORD_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login_id: userId,
            email: email,
            new_password: newPw
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            findPwResult.classList.remove('hidden');

            if (!data.success) {
                findPwResult.innerHTML = data.message || '일치하는 회원 정보를 찾을 수 없어요.';
                return;
            }

            findPwResult.innerHTML = `
                비밀번호가 변경됐어요.<br>
                새 비밀번호로 로그인해주세요.
            `;

            newPwInput.value = '';
            newPwCheckInput.value = '';
        })
        .catch(function(error) {
            console.error('비밀번호 변경 실패:', error);

            findPwResult.classList.remove('hidden');
            findPwResult.innerHTML = '서버와 통신 중 오류가 발생했어요.';
        });
});


// ================================
// 4. 비로그인으로 둘러보기
// ================================

guestBtn.addEventListener('click', function() {
    location.href = '../../index.html';
});


// ================================
// 5. 공통 함수
// ================================

function hideResultBoxes() {
    findIdResult.classList.add('hidden');
    findPwResult.classList.add('hidden');

    findIdResult.innerHTML = '';
    findPwResult.innerHTML = '';
}

function escapeHTML(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}