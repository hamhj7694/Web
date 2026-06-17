let optionBox = document.querySelector('.omechu_option');
let optionPanelBtn = document.querySelector('.option_panel_btn');
let optionSubmitBtn = document.querySelector('.option_submit_btn');

let omechuBtn = document.querySelector('.omech_btn');
let rouletteImg = document.querySelector('.roulette_img');

let heartButtons = document.querySelectorAll('.heart');


// ================================
// 1. 맞춤 추천 패널 열기 / 닫기
// ================================
if (optionPanelBtn && optionBox) {
    optionPanelBtn.addEventListener('click', () => {
        optionBox.classList.toggle('open');

        if (optionBox.classList.contains('open')) {
            optionPanelBtn.textContent = '맞춤 추천 받기 ▲';
        } else {
            optionPanelBtn.textContent = '맞춤 추천 받기 ▼';
        }
    });
}


// ================================
// 2. 옵션 버튼 선택 / 해제
// ================================
const optionGroups = document.querySelectorAll('.option1, .option2, .option3, .option4');

optionGroups.forEach((group) => {
    const buttons = Array.from(group.querySelectorAll('li button'));

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const isAllButton = btn.textContent.trim() === '전체';

            if (isAllButton) {
                const isSelected = btn.classList.contains('selected');

                buttons.forEach((button) => {
                    button.classList.toggle('selected', !isSelected);
                });

                return;
            }

            btn.classList.toggle('selected');

            const allButton = buttons.find((button) => {
                return button.textContent.trim() === '전체';
            });

            if (!allButton) return;

            const normalButtons = buttons.filter((button) => {
                return button.textContent.trim() !== '전체';
            });

            const allSelected = normalButtons.every((button) => {
                return button.classList.contains('selected');
            });

            allButton.classList.toggle('selected', allSelected);
        });
    });
});


// ================================
// 3. 옵션 리스트 마우스 드래그 스크롤
// ================================
const optionLists = document.querySelectorAll('.omechu_option ul');

optionLists.forEach((list) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    list.addEventListener('mousedown', (e) => {
        isDown = true;
        list.classList.add('dragging');
        startX = e.pageX - list.offsetLeft;
        scrollLeft = list.scrollLeft;
    });

    list.addEventListener('mouseleave', () => {
        isDown = false;
        list.classList.remove('dragging');
    });

    list.addEventListener('mouseup', () => {
        isDown = false;
        list.classList.remove('dragging');
    });

    list.addEventListener('mousemove', (e) => {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - list.offsetLeft;
        const walk = x - startX;

        list.scrollLeft = scrollLeft - walk;
    });
});


// ================================
// 4. 룰렛 회전
// ================================
function spinRoulette() {
    if (!rouletteImg) return;

    rouletteImg.classList.remove('spin');

    // 같은 애니메이션 재실행용 강제 리플로우
    void rouletteImg.offsetWidth;

    rouletteImg.classList.add('spin');
}


// ================================
// 5. 오메추 실행
// ================================
function startOmechu() {
    spinRoulette();

    setTimeout(() => {
        location.href = './page/result.html';
    }, 900);
}

if (omechuBtn) {
    omechuBtn.addEventListener('click', startOmechu);
}

if (optionSubmitBtn) {
    optionSubmitBtn.addEventListener('click', startOmechu);
}


// ================================
// 6. 하트 추천 토글
// ================================
heartButtons.forEach((heart) => {
    heart.addEventListener('click', () => {
        heart.classList.toggle('is-liked');

        if (heart.classList.contains('is-liked')) {
            heart.textContent = '🧡';
            heart.setAttribute('aria-label', '추천 취소');
        } else {
            heart.textContent = '♡';
            heart.setAttribute('aria-label', '추천하기');
        }
    });
});