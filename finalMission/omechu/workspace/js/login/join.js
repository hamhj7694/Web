const joinForm = document.querySelector('#joinForm');
const joinIdInput = document.querySelector('#joinId');
const joinPwInput = document.querySelector('#joinPw');
const joinPwCheckInput = document.querySelector('#joinPwCheck');
const joinNicknameInput = document.querySelector('#joinNickname');
const joinEmailInput = document.querySelector('#joinEmail');
const agreeCheck = document.querySelector('#agreeCheck');


// -------------------------------------------
// db 속 id들과 id 대조 중복 검사
// 지금은 DB 연결 전이므로 localStorage 속 id들과 대조
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
        alert('아이디는 영문, 숫자 조합 4자 이상으로 입력해주세요!');
        joinIdInput.focus();
        return;
    }

    const savedUsers = getSavedUsers();

    const isDuplicatedId = savedUsers.some(function(user) {
        return user.id === userId;
    });

    if (isDuplicatedId) {
        alert('이미 사용 중인 아이디예요!');
        joinIdInput.focus();

        isIdChecked = false;
        checkedIdValue = '';

        idDuplicateCheckBtn.classList.remove('is-checked');
        idDuplicateCheckBtn.textContent = '중복확인';

        return;
    }

    alert('사용 가능한 아이디예요!');

    isIdChecked = true;
    checkedIdValue = userId;

    idDuplicateCheckBtn.classList.add('is-checked');
    idDuplicateCheckBtn.textContent = '확인완료';
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

    // 닉네임 중복 확인
    const savedUsersForNickname = getSavedUsers();

    const isDuplicatedNickname = savedUsersForNickname.some(function(user) {
        return user.nickname === nickname;
    });

    if (isDuplicatedNickname) {
        alert('이미 사용 중인 닉네임이에요!');
        joinNicknameInput.focus();
        return;
    }

    // 이메일 확인
    const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // 회원가입 완료 및 저장 코드
    const savedUsers = getSavedUsers();

    // -----------------------------
    // 저장 직전 아이디 중복 방지
    const isDuplicatedId = savedUsers.some(function(user) {
        return user.id === userId;
    });

    if (isDuplicatedId) {
        alert('이미 사용 중인 아이디예요! 다시 중복확인을 해주세요.');

        isIdChecked = false;
        checkedIdValue = '';

        idDuplicateCheckBtn.classList.remove('is-checked');
        idDuplicateCheckBtn.textContent = '중복확인';

        joinIdInput.focus();
        return;
    }

    // 저장 직전 닉네임 중복 방지
    const isDuplicatedNicknameBeforeSave = savedUsers.some(function(user) {
        return user.nickname === nickname;
    });

    if (isDuplicatedNicknameBeforeSave) {
        alert('이미 사용 중인 닉네임이에요!');
        joinNicknameInput.focus();
        return;
    }

    // -----------------------------
    
    const newUser = {
        id: userId,
        password: userPw,
        nickname: nickname,
        email: email,
        createdAt: getTodayText()
    };

    savedUsers.push(newUser);

    localStorage.setItem('omechu_users', JSON.stringify(savedUsers));

    alert('회원가입이 완료됐어요! 로그인해주세요.');

    location.href = './login.html';
});


// -------------------------------------------
// 저장된 회원 목록 가져오기
// -------------------------------------------

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


// -------------------------------------------
// 날짜 함수
// -------------------------------------------

function getTodayText() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');

    return `${year}.${month}.${date}`;
}