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

// 옵션 거리 막대
const distanceRange = document.querySelector('.distance_range');
const distanceList = ['500m', '1km', '2km', '3km+'];

if (distanceRange) {
    function updateDistanceRange() {
        const percent = (distanceRange.value / distanceRange.max) * 100;

        distanceRange.style.background = `
            linear-gradient(
                to right,
                var(--color-main) 0%,
                var(--color-main) ${percent}%,
                var(--color-line) ${percent}%,
                var(--color-line) 100%
            )
        `;
    }

    distanceRange.addEventListener('input', updateDistanceRange);
    updateDistanceRange();
}

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
function closeOptionPanel() {
    if (!optionBox || !optionPanelBtn) return;

    optionBox.classList.remove('open');
    optionPanelBtn.textContent = '맞춤 추천 받기 ▼';
}

function goResultPage() {
    location.href = './page/result.html';
}

function startOmechu({ closeOption = false } = {}) {
    if (closeOption) {
        closeOptionPanel();

        setTimeout(() => {
            spinRoulette();

            setTimeout(goResultPage, 900);
        }, 320);

        return;
    }

    spinRoulette();
    setTimeout(goResultPage, 900);
}

if (omechuBtn) {
    omechuBtn.addEventListener('click', () => {
        startOmechu();
    });
}

if (optionSubmitBtn) {
    optionSubmitBtn.addEventListener('click', () => {
        startOmechu({ closeOption: true });
    });
}


// ================================
// 6. 하트 추천 토글
// ================================
heartButtons.forEach((heart) => {
    heart.addEventListener('click', () => {
        // 추천 취소가 아니라, 계속 추천 상태 유지
        heart.classList.add('is-liked');

        // 하트 모양 유지
        heart.textContent = '🧡';
        heart.setAttribute('aria-label', '추천하기');

        // 추천 수 1 증가
        const card = heart.closest('.food_card, .result_card, article, section');
        const countText = card ? card.querySelector('.rank_count, .result_count, .like_count, .food_like_count') : document.querySelector('.result_count');

        if (countText) {
            const currentCount = Number(countText.textContent.replace(/[^0-9]/g, ''));

            if (isNaN(currentCount)) {
                countText.textContent = '추천 1';
            } else {
                countText.textContent = '추천 ' + (currentCount + 1);
            }
        }

        // 하트 파티클 효과
        createHeartParticles(heart);
    });
});

function createHeartParticles(target) {
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('span');

        particle.classList.add('heart_particle');
        particle.textContent = '🧡';

        const randomX = Math.random() * 80 - 40;
        const randomY = Math.random() * -60 - 20;
        const randomRotate = Math.random() * 60 - 30;

        particle.style.setProperty('--x', randomX + 'px');
        particle.style.setProperty('--y', randomY + 'px');
        particle.style.setProperty('--r', randomRotate + 'deg');

        target.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 800);
    }
}

// ================================
// 7. 위키 작성하기
// ================================

// 로그인 여부에 따른 위키 작성 이동은 login_common.js에서 처리

// ================================
// 8. TOP 위키 상세 가기
// ================================

const topRankItems = document.querySelectorAll('.top_rank_item');

topRankItems.forEach(function(item) {
    item.addEventListener('click', function(event) {
        // 하트 버튼을 누를 때는 상세 페이지로 이동하지 않게 막기
        if (event.target.closest('.heart')) {
            return;
        }

        const foodId = item.dataset.foodId;

        location.href = `./page/wiki_detail.html?id=${foodId}`;
    });
});