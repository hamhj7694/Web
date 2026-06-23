const joinForm = document.querySelector('#joinForm');
const joinIdInput = document.querySelector('#joinId');
const joinPwInput = document.querySelector('#joinPw');
const joinPwCheckInput = document.querySelector('#joinPwCheck');
const joinNicknameInput = document.querySelector('#joinNickname');
const joinEmailInput = document.querySelector('#joinEmail');
const agreeCheck = document.querySelector('#agreeCheck');


// -------------------------------------------
// 아이디 중복 검사 AJAX
// -------------------------------------------

const idDuplicateCheckBtn = document.querySelector('.id_duplicate_check_btn');

let isIdChecked = false;
let checkedIdValue = '';

joinIdInput.addEventListener('input', function() {
    isIdChecked = false;
    checkedIdValue = '';

    idDuplicateCheckBtn.classList.remove('is-checked');
    idDuplicateCheckBtn.textContent = '중복확인';
});

idDuplicateCheckBtn.addEventListener('click', function() {
    const userId = joinIdInput.value.trim();
    const idRegExp = /^[a-zA-Z0-9]{4,}$/;

    if (userId === '') {
        alert('아이디를 입력해주세요!');
        joinIdInput.focus();
        return;
    }

    if (!idRegExp.test(userId)) {
        alert('아이디는 영문 또는 숫자 조합 4자 이상으로 입력해주세요!');
        joinIdInput.focus();
        return;
    }

    // AJAX 아이디 중복 확인
    fetch('../../backend/api/auth/check_id.php?login_id=' + encodeURIComponent(userId))
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '아이디 중복확인 중 오류가 발생했어요.');
                return;
            }

            if (data.is_duplicated) {
                alert(data.message || '이미 사용 중인 아이디예요!');
                joinIdInput.focus();

                isIdChecked = false;
                checkedIdValue = '';

                idDuplicateCheckBtn.classList.remove('is-checked');
                idDuplicateCheckBtn.textContent = '중복확인';

                return;
            }

            alert(data.message || '사용 가능한 아이디예요!');

            isIdChecked = true;
            checkedIdValue = userId;

            idDuplicateCheckBtn.classList.add('is-checked');
            idDuplicateCheckBtn.textContent = '확인완료';
        })
        .catch(function(error) {
            console.error('아이디 중복확인 요청 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        });
});

// -------------------------------------------
// 회원가입
// -------------------------------------------

joinForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // 회원가입 정보
    const userId = joinIdInput.value.trim();
    const userPw = joinPwInput.value.trim();
    const userPwCheck = joinPwCheckInput.value.trim();
    const nickname = joinNicknameInput.value.trim();
    const email = joinEmailInput.value.trim();

    // 아이디 확인
    const idRegExp = /^[a-zA-Z0-9]{4,}$/;

    if (userId === '') {
        alert('아이디를 입력해주세요!');
        joinIdInput.focus();
        return;
    }

    if (!idRegExp.test(userId)) {
        alert('아이디는 영문, 숫자 조합 4자 이상으로 입력해주세요!');
        joinIdInput.focus();
        return;
    }

    if (!isIdChecked || checkedIdValue !== userId) {
        alert('아이디 중복확인을 해주세요!');
        joinIdInput.focus();
        return;
    }

    // 비밀번호 확인
    if (userPw === '') {
        alert('비밀번호를 입력해주세요!');
        joinPwInput.focus();
        return;
    }

    if (userPw.length < 4) {
        alert('비밀번호는 4자 이상 입력해주세요!');
        joinPwInput.focus();
        return;
    }

    // 비밀번호 재확인
    if (userPwCheck === '') {
        alert('비밀번호 재확인 칸을 입력해주세요!');
        joinPwCheckInput.focus();
        return;
    }

    if (userPw !== userPwCheck) {
        alert('비밀번호가 서로 달라요!');
        joinPwCheckInput.focus();
        return;
    }

    // 닉네임 확인
    if (nickname === '') {
        alert('닉네임을 입력해주세요!');
        joinNicknameInput.focus();
        return;
    }

    // 이메일 확인
    const emailRegExp = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (email === '') {
        alert('이메일을 입력해주세요!');
        joinEmailInput.focus();
        return;
    }

    if (!emailRegExp.test(email)) {
        alert('올바른 이메일 형식으로 입력해주세요!');
        joinEmailInput.focus();
        return;
    }

    if (!agreeCheck.checked) {
        alert('개인정보 수집 동의가 필요해요!');
        agreeCheck.focus();
        return;
    }

    // 회원가입 정보 전송 AJAX
    fetch('../../backend/api/auth/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login_id: userId,
            password: userPw,
            password_check: userPwCheck,
            nickname: nickname,
            email: email
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '회원가입 중 오류가 발생했어요.');
                return;
            }

            alert(data.message || '회원가입이 완료됐어요! 로그인해주세요.');
            location.href = './login.html';
        })
        .catch(function(error) {
            console.error('회원가입 요청 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        });
});