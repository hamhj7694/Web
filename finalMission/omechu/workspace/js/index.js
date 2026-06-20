let optionBox = document.querySelector('.omechu_option');
let optionPanelBtn = document.querySelector('.option_panel_btn');
let optionSubmitBtn = document.querySelector('.option_submit_btn');

let omechuBtn = document.querySelector('.omech_btn');
let rouletteImg = document.querySelector('.roulette_img');

let heartButtons = document.querySelectorAll('.heart');

// ================================
// 오메추 음식 후보 데이터
// 추후 DB 연결 전까지 프론트 임시 데이터
// ================================

const omechuFoodList = [
    {
        id: 1,
        name: '제육볶음',
        category: '한식',
        situations: ['혼밥', '친목', '회식'],
        times: ['점심', '저녁'],
        tags: ['든든함', '매콤함', '밥도둑']
    },
    {
        id: 2,
        name: '김치찌개',
        category: '한식',
        situations: ['혼밥', '친목', '해장'],
        times: ['아침', '점심', '저녁'],
        tags: ['국물', '뜨끈함', '집밥']
    },
    {
        id: 3,
        name: '치킨',
        category: '기타',
        situations: ['친목', '회식', '배달'],
        times: ['저녁', '야식'],
        tags: ['바삭함', '야식', '배달']
    },
    {
        id: 4,
        name: '짜장면',
        category: '중식',
        situations: ['혼밥', '친목'],
        times: ['점심', '저녁'],
        tags: ['면', '가성비', '중식']
    },
    {
        id: 5,
        name: '마라탕',
        category: '중식',
        situations: ['혼밥', '친목', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['매운맛', '얼얼함', '취향존중']
    },
    {
        id: 6,
        name: '초밥',
        category: '일식',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['깔끔함', '데이트', '기분전환']
    },
    {
        id: 7,
        name: '파스타',
        category: '양식',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['분위기', '데이트', '부드러움']
    },
    {
        id: 8,
        name: '떡볶이',
        category: '분식',
        situations: ['혼밥', '친목', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['매콤함', '간식', '분식']
    },
    {
        id: 9,
        name: '라면',
        category: '분식',
        situations: ['혼밥', '해장'],
        times: ['아침', '점심', '저녁', '야식'],
        tags: ['간편함', '국물', '가성비']
    },
    {
        id: 10,
        name: '샐러드',
        category: '기타',
        situations: ['혼밥', '데이트'],
        times: ['아침', '점심', '저녁'],
        tags: ['가벼움', '건강', '산뜻함']
    },
    {
        id: 11,
        name: '돈까스',
        category: '일식',
        situations: ['혼밥', '데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['바삭함', '든든함', '일식']
    },
    {
        id: 12,
        name: '피자',
        category: '양식',
        situations: ['친목', '회식', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['배달', '친구랑', '나눠먹기']
    },

    // ================================
    // 아래부터 필터 테스트용 추가 데이터
    // ================================

    {
        id: 13,
        name: '국밥',
        category: '한식',
        situations: ['혼밥', '해장'],
        times: ['아침', '점심', '저녁'],
        tags: ['든든함', '국물', '해장']
    },
    {
        id: 14,
        name: '삼겹살',
        category: '한식',
        situations: ['친목', '회식'],
        times: ['저녁'],
        tags: ['고기', '회식', '든든함']
    },
    {
        id: 15,
        name: '짬뽕',
        category: '중식',
        situations: ['혼밥', '해장'],
        times: ['점심', '저녁'],
        tags: ['얼큰함', '국물', '중식']
    },
    {
        id: 16,
        name: '탕수육',
        category: '중식',
        situations: ['친목', '회식', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['바삭함', '중식', '나눠먹기']
    },
    {
        id: 17,
        name: '라멘',
        category: '일식',
        situations: ['혼밥', '데이트'],
        times: ['점심', '저녁', '야식'],
        tags: ['국물', '면', '혼밥']
    },
    {
        id: 18,
        name: '우동',
        category: '일식',
        situations: ['혼밥', '해장'],
        times: ['아침', '점심', '저녁'],
        tags: ['따뜻함', '국물', '면']
    },
    {
        id: 19,
        name: '버거',
        category: '양식',
        situations: ['혼밥', '데이트', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['간편함', '배달', '든든함']
    },
    {
        id: 20,
        name: '스테이크',
        category: '양식',
        situations: ['데이트', '친목'],
        times: ['저녁'],
        tags: ['분위기', '특별함', '고기']
    },
    {
        id: 21,
        name: '김밥',
        category: '분식',
        situations: ['혼밥', '배달'],
        times: ['아침', '점심', '저녁'],
        tags: ['간편함', '가성비', '분식']
    },
    {
        id: 22,
        name: '순대',
        category: '분식',
        situations: ['혼밥', '친목'],
        times: ['점심', '저녁', '야식'],
        tags: ['분식', '간식', '든든함']
    },
    {
        id: 23,
        name: '케이크',
        category: '디저트',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['달달함', '카페', '디저트']
    },
    {
        id: 24,
        name: '크로플',
        category: '디저트',
        situations: ['데이트', '친목', '혼밥'],
        times: ['아침', '점심', '저녁'],
        tags: ['달달함', '카페', '간식']
    },
    {
        id: 25,
        name: '아이스크림',
        category: '디저트',
        situations: ['데이트', '친목', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['달달함', '시원함', '디저트']
    },
    {
        id: 26,
        name: '쌀국수',
        category: '기타',
        situations: ['혼밥', '해장', '데이트'],
        times: ['점심', '저녁'],
        tags: ['국물', '깔끔함', '이국적']
    },
    {
        id: 27,
        name: '타코',
        category: '기타',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['이국적', '간편함', '분위기']
    },
    {
        id: 28,
        name: '샌드위치',
        category: '기타',
        situations: ['혼밥', '배달'],
        times: ['아침', '점심'],
        tags: ['간편함', '가벼움', '아침']
    }
];

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

function startOmechu({ closeOption = false, useOptions = false } = {}) {
    // 옵션 추천일 때만 필터링
    if (useOptions) {
        recommendFoodByOptions();
    } else {
        // 일반 오메추 받기는 옵션과 무관하게 전체 후보에서 100% 랜덤
        const randomFood = getRandomFood(getOmechuFoodDB());

        localStorage.setItem('omechu_result', JSON.stringify({
            food: randomFood,
            options: null,
            matchedCount: getOmechuFoodDB().length,
            recommendedType: 'random',
            recommendedAt: Date.now()
        }));
    }

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
        startOmechu({
            closeOption: true,
            useOptions: true
        });
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
// 8. 추천 수 기반 TOP3 랭크
// ================================

const topRankList = document.querySelector('#topRankList');

const CUSTOM_FOOD_STORAGE_KEY = 'omechu_wiki_custom_foods';
const DEFAULT_FOOD_IMAGE = './assets/food/default.png';

const foodRankMeta = {
    1: { image: './assets/food/jeyuk.png', likes: 842 },
    2: { image: './assets/food/kimchi.png', likes: 812 },
    3: { image: './assets/food/jjajang.png', likes: 604 },
    4: { image: './assets/food/jjamppong.png', likes: 578 },
    5: { image: './assets/food/donkatsu.png', likes: 533 },
    6: { image: './assets/food/ramen.png', likes: 489 },
    7: { image: './assets/food/pasta.png', likes: 461 },
    8: { image: './assets/food/burger.png', likes: 430 },
    9: { image: './assets/food/tteokbokki.png', likes: 690 },
    10: { image: './assets/food/gimbap.png', likes: 355 },
    11: { image: './assets/food/chicken.png', likes: 650 },
    12: { image: './assets/food/cake.png', likes: 302 }
};

function readJSON(key, fallbackValue) {
    const savedData = localStorage.getItem(key);

    if (!savedData) {
        return fallbackValue;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error(`${key} 데이터를 읽는 중 오류가 발생했습니다.`, error);
        return fallbackValue;
    }
}

function readNumber(key) {
    return Number(localStorage.getItem(key)) || 0;
}

function saveNumber(key, value) {
    localStorage.setItem(key, String(value));
}

function getTotalLikeKey(foodId) {
    return `omechu_wiki_food_${foodId}_like_count`;
}

function getMyLikeKey(foodId) {
    const loginUserId = localStorage.getItem('omechu_user_id') || '';
    return `omechu_wiki_food_${foodId}_my_like_count_${loginUserId}`;
}

function getCustomFoodListForRank() {
    return readJSON(CUSTOM_FOOD_STORAGE_KEY, []);
}

function getRankFoodDB() {
    const defaultFoods = omechuFoodList.map(function(food) {
        const meta = foodRankMeta[food.id] || {};

        return {
            ...food,
            image: meta.image || DEFAULT_FOOD_IMAGE,
            likes: Number(meta.likes || 0)
        };
    });

    const customFoods = getCustomFoodListForRank().map(function(food) {
        return {
            id: food.id,
            name: food.name || '이름 없는 음식',
            category: food.category || '기타',
            situations: Array.isArray(food.situations) ? food.situations : [],
            times: Array.isArray(food.times) ? food.times : [],
            tags: Array.isArray(food.tags) ? food.tags : [],
            image: food.image || DEFAULT_FOOD_IMAGE,
            likes: Number(food.likes || 0)
        };
    });

    return [
        ...customFoods,
        ...defaultFoods
    ];
}

function getFoodTotalLikeCountForRank(food) {
    return Number(food.likes || 0) + readNumber(getTotalLikeKey(food.id));
}

function getMyLikeCountForRank(foodId) {
    const isLogin = localStorage.getItem('omechu_is_login') === 'true';
    const loginUserId = localStorage.getItem('omechu_user_id') || '';

    if (!isLogin || !loginUserId) {
        return 0;
    }

    return readNumber(getMyLikeKey(foodId));
}

function getHeartTextByMyLikeCount(foodId) {
    const myLikeCount = getMyLikeCountForRank(foodId);

    return myLikeCount > 0 ? '🧡' : '♡';
}

function getTopRankFoods() {
    return getRankFoodDB()
        .map(function(food) {
            return {
                ...food,
                totalLikeCount: getFoodTotalLikeCountForRank(food)
            };
        })
        .sort(function(a, b) {
            return b.totalLikeCount - a.totalLikeCount;
        })
        .slice(0, 3);
}

function renderTopRank() {
    if (!topRankList) {
        return;
    }

    const topFoods = getTopRankFoods();

    if (topFoods.length === 0) {
        topRankList.innerHTML = `
            <p class="top_rank_empty">아직 랭킹을 만들 음식이 없어요.</p>
        `;
        return;
    }

    topRankList.innerHTML = topFoods.map(function(food, index) {
        const rank = index + 1;
        const myLikeCount = getMyLikeCountForRank(food.id);
        const heartText = myLikeCount > 0 ? '🧡' : '♡';
        const heartClass = myLikeCount > 0 ? 'heart is-liked' : 'heart';

        return `
            <article class="top_rank_item rank${rank}" data-food-id="${food.id}">
                <span class="rank_no">${rank}</span>

                <img 
                    class="rank_img" 
                    src="${food.image}" 
                    alt="${food.name}"
                    onerror="this.onerror=null; this.src='${DEFAULT_FOOD_IMAGE}'"
                >

                <h3 class="rank_menu">${food.name}</h3>

                <p class="rank_count">추천 ${food.totalLikeCount}</p>

                <button type="button" class="${heartClass}" aria-label="추천하기">
                    ${heartText}
                </button>
            </article>
        `;
    }).join('');
}

function addTopRankLike(foodId) {
    const isLogin = localStorage.getItem('omechu_is_login') === 'true';
    const loginUserId = localStorage.getItem('omechu_user_id') || '';

    if (!isLogin || !loginUserId) {
        alert('추천은 로그인 후 이용할 수 있어요!');
        location.href = './page/login/login.html';
        return;
    }

    const currentTotalAddedLike = readNumber(getTotalLikeKey(foodId));
    const currentMyLikeCount = readNumber(getMyLikeKey(foodId));

    saveNumber(getTotalLikeKey(foodId), currentTotalAddedLike + 1);
    saveNumber(getMyLikeKey(foodId), currentMyLikeCount + 1);

    renderTopRank();
}

if (topRankList) {
    topRankList.addEventListener('click', function(event) {
        const heartButton = event.target.closest('.heart');
        const rankItem = event.target.closest('.top_rank_item');

        if (!rankItem) {
            return;
        }

        const foodId = rankItem.dataset.foodId;

        if (heartButton) {
            addTopRankLike(foodId);
            return;
        }

        location.href = `./page/wiki_detail.html?id=${foodId}`;
    });
}

renderTopRank();