let optionBox = document.querySelector('.omechu_option');
let optionPanelBtn = document.querySelector('.option_panel_btn');
let optionSubmitBtn = document.querySelector('.option_submit_btn');

let omechuBtn = document.querySelector('.omech_btn');
let rouletteImg = document.querySelector('.roulette_img');

let heartButtons = document.querySelectorAll('.heart');


// ================================
// 오메추 기본 음식 후보 데이터
// ================================

const OMECHU_RANDOM_API_URL = './backend/api/omechu/random.php';
function recommendRandomFoodFromDB(closeOption) {
    fetch(OMECHU_RANDOM_API_URL, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success || !data.food) {
                alert(data.message || '추천할 음식을 찾지 못했어요.');
                return;
            }

            localStorage.setItem('omechu_result', JSON.stringify({
                food: data.food,
                options: null,
                matchedCount: 1,
                recommendedType: 'db_random',
                recommendedAt: Date.now()
            }));

            moveToResultAfterRoulette(closeOption);
        })
        .catch(function(error) {
            console.error('DB 랜덤 추천 실패:', error);
            alert('오메추 추천 중 오류가 발생했어요.');
        });
}

function moveToResultAfterRoulette(closeOption) {
    if (closeOption) {
        closeOptionPanel();

        setTimeout(function() {
            spinRoulette();
            setTimeout(goResultPage, 900);
        }, 320);

        return;
    }

    spinRoulette();
    setTimeout(goResultPage, 900);
}

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
// 선택 옵션 수집
// ================================

function getSelectedOptionValues(optionSelector) {
    const optionGroup = document.querySelector(optionSelector);

    if (!optionGroup) return [];

    const selectedButtons = optionGroup.querySelectorAll('button.selected');

    return Array.from(selectedButtons)
        .map((button) => button.textContent.trim())
        .filter((value) => value !== '전체');
}

function getSelectedOmechuOptions() {
    return {
        categories: getSelectedOptionValues('.option1'),
        situations: getSelectedOptionValues('.option2'),
        times: getSelectedOptionValues('.option3'),
        distance: distanceRange ? distanceRange.value : '1'
    };
}

// ================================
// 선택 조건으로 음식 랜덤 추천
// ================================

function normalizeOptionFood(food) {
    return {
        id: food.id,
        name: food.name || '이름 없는 음식',
        category: food.category || '기타',
        situations: Array.isArray(food.situations) ? food.situations : [],
        times: Array.isArray(food.times) ? food.times : [],
        tags: Array.isArray(food.tags) ? food.tags : []
    };
}

function getCustomOmechuFoodList() {
    const savedData = localStorage.getItem('omechu_wiki_custom_foods');

    if (!savedData) {
        return [];
    }

    try {
        const customFoods = JSON.parse(savedData);

        if (!Array.isArray(customFoods)) {
            return [];
        }

        return customFoods.map(normalizeOptionFood);
    } catch (error) {
        console.error('커스텀 음식 데이터를 읽는 중 오류가 발생했습니다.', error);
        return [];
    }
}

function getOmechuFoodDB() {
    const defaultFoods = omechuFoodList.map(normalizeOptionFood);
    const customFoods = getCustomOmechuFoodList();

    return [
        ...customFoods,
        ...defaultFoods
    ];
}

function getFilteredFoodList(options) {
    const foodDB = getOmechuFoodDB();

    return foodDB.filter((food) => {
        const categoryMatched =
            options.categories.length === 0 ||
            options.categories.includes(food.category);

        const situationMatched =
            options.situations.length === 0 ||
            options.situations.some((situation) => {
                return food.situations.includes(situation);
            });

        const timeMatched =
            options.times.length === 0 ||
            options.times.some((time) => {
                return food.times.includes(time);
            });

        return categoryMatched && situationMatched && timeMatched;
    });
}

function getRandomFood(foodList) {
    if (!foodList || foodList.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * foodList.length);

    return foodList[randomIndex];
}

function recommendFoodByOptions() {
    const selectedOptions = getSelectedOmechuOptions();
    let filteredFoodList = getFilteredFoodList(selectedOptions);

    // 조건이 너무 빡세서 결과가 없으면 전체 후보에서 랜덤 추천
    if (filteredFoodList.length === 0) {
        filteredFoodList = getOmechuFoodDB();
    }

    const recommendedFood = getRandomFood(filteredFoodList);

    if (!recommendedFood) {
        alert('추천할 음식 데이터가 없어요.');
        return null;
    }

    const resultData = {
        food: recommendedFood,
        options: selectedOptions,
        matchedCount: filteredFoodList.length,
        recommendedAt: Date.now()
    };

    localStorage.setItem('omechu_result', JSON.stringify(resultData));

    return recommendedFood;
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

function startOmechu(options = {}) {
    const closeOption = options.closeOption === true;
    const useOptions = options.useOptions === true;

    if (useOptions) {
        recommendFoodByOptionsFromDB(closeOption);
        return;
    }

    recommendRandomFoodFromDB(closeOption);
}

if (omechuBtn) {
    omechuBtn.addEventListener('click', () => {
        startOmechu({
            closeOption: false,
            useOptions: false
        });
    });
}

if (optionSubmitBtn) {
    optionSubmitBtn.addEventListener('click', () => {
        startOmechu({
            closeOption: true,
            useOptions: true
        });
    });
}

function recommendFoodByOptionsFromDB(closeOption) {
    const selectedOptions = getSelectedOmechuOptions();

    const params = new URLSearchParams();

    if (selectedOptions.categories && selectedOptions.categories.length > 0) {
        params.set('category', selectedOptions.categories[0]);
    }

    if (selectedOptions.situations && selectedOptions.situations.length > 0) {
        params.set('situation', selectedOptions.situations[0]);
    }

    if (selectedOptions.times && selectedOptions.times.length > 0) {
        params.set('time', selectedOptions.times[0]);
    }

    fetch(`${OMECHU_RANDOM_API_URL}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success || !data.food) {
                alert(data.message || '조건에 맞는 음식을 찾지 못했어요.');
                return;
            }

            localStorage.setItem('omechu_result', JSON.stringify({
                food: data.food,
                options: selectedOptions,
                matchedCount: 1,
                recommendedType: 'db_option',
                recommendedAt: Date.now()
            }));

            moveToResultAfterRoulette(closeOption);
        })
        .catch(function(error) {
            console.error('DB 맞춤 추천 실패:', error);
            alert('맞춤 추천 중 오류가 발생했어요.');
        });
}

// // ================================
// // 6. 하트 추천 토글
// // ================================
// heartButtons.forEach((heart) => {
//     heart.addEventListener('click', () => {
//         // 추천 취소가 아니라, 계속 추천 상태 유지
//         heart.classList.add('is-liked');

//         // 하트 모양 유지
//         heart.textContent = '🧡';
//         heart.setAttribute('aria-label', '추천하기');

//         // 추천 수 1 증가
//         const card = heart.closest('.food_card, .result_card, article, section');
//         const countText = card ? card.querySelector('.rank_count, .result_count, .like_count, .food_like_count') : document.querySelector('.result_count');

//         if (countText) {
//             const currentCount = Number(countText.textContent.replace(/[^0-9]/g, ''));

//             if (isNaN(currentCount)) {
//                 countText.textContent = '추천 1';
//             } else {
//                 countText.textContent = '추천 ' + (currentCount + 1);
//             }
//         }

//         // 하트 파티클 효과
//         createHeartParticles(heart);
//     });
// });

// function createHeartParticles(target) {
//     const particleCount = 8;

//     for (let i = 0; i < particleCount; i++) {
//         const particle = document.createElement('span');

//         particle.classList.add('heart_particle');
//         particle.textContent = '🧡';

//         const randomX = Math.random() * 80 - 40;
//         const randomY = Math.random() * -60 - 20;
//         const randomRotate = Math.random() * 60 - 30;

//         particle.style.setProperty('--x', randomX + 'px');
//         particle.style.setProperty('--y', randomY + 'px');
//         particle.style.setProperty('--r', randomRotate + 'deg');

//         target.appendChild(particle);

//         setTimeout(() => {
//             particle.remove();
//         }, 800);
//     }
// }

// ================================
// 7. 위키 작성하기
// ================================

// 로그인 여부에 따른 위키 작성 이동은 login_common.js에서 처리