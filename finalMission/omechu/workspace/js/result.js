// ================================
// result.js
// 오메추 결과 페이지
// 기본 음식 + 커스텀 음식(localStorage)을 하나의 DB처럼 사용
// ================================

// ================================
// 1. DOM
// ================================

const btnAgain = document.querySelector('.btn_again');
const btnMap = document.querySelector('.btn_map');
const btnWiki = document.querySelector('.btn_wiki');

const rouletteOverlay = document.querySelector('.roulette_overlay');
const resultRouletteImg = document.querySelector('.result_roulette_img');

const resultFoodImg = document.querySelector('.result_food_img');
const resultMenuName = document.querySelector('.result_menu_name');
const resultNickname = document.querySelector('.nickname');
const resultComment = document.querySelector('.result_comment');
const resultCount = document.querySelector('.result_count');
const tagList = document.querySelector('.tag_list');

const btnShare = document.querySelector('.btn_share');
const shareOverlay = document.querySelector('.share_overlay');
const shareCloseBtn = document.querySelector('.share_close_btn');
const copyLinkBtn = document.querySelector('.copy_link_btn');
const shareMenuName = document.querySelector('.share_menu_name');
const shareFoodImg = document.querySelector('.share_food_img');

const recommendBtn = document.querySelector('.recommend_btn');


// ================================
// 2. 로그인 / 기본값
// ================================

const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';

const DEFAULT_IMAGE = '../assets/food/default.png';
const CUSTOM_FOOD_STORAGE_KEY = 'omechu_wiki_custom_foods';


// ================================
// 3. 기본 음식 DB
// 나중에 진짜 DB 붙이면 이 부분을 fetch 결과로 교체하면 됨
// ================================

const defaultFoodDB = [
    {
        id: 1,
        name: '제육볶음',
        category: '한식',
        image: '../assets/food/jeyuk.png',
        likes: 842,
        comment: '“점심에 실패 없는 든든한 메뉴!”',
        description: '점심에 실패 없는 든든한 메뉴',
        situations: ['혼밥', '친목', '회식'],
        times: ['점심', '저녁'],
        tags: ['#한식', '#점심', '#혼밥', '#든든함']
    },
    {
        id: 2,
        name: '김치찌개',
        category: '한식',
        image: '../assets/food/kimchi.png',
        likes: 812,
        comment: '“밥 한 공기 뚝딱 가능한 국물 메뉴!”',
        description: '밥 한 공기 뚝딱 가능한 얼큰한 집밥 메뉴',
        situations: ['혼밥', '친목', '해장'],
        times: ['아침', '점심', '저녁'],
        tags: ['#한식', '#점심', '#뜨끈함', '#가성비']
    },
    {
        id: 3,
        name: '치킨',
        category: '야식',
        image: '../assets/food/chicken.png',
        likes: 1052,
        comment: '“저녁이나 야식 고민이면 거의 정답!”',
        description: '야식 고민을 끝내주는 바삭한 정답',
        situations: ['친목', '회식', '배달'],
        times: ['저녁', '야식'],
        tags: ['#야식', '#저녁', '#친목', '#바삭함']
    },
    {
        id: 4,
        name: '짜장면',
        category: '중식',
        image: '../assets/food/jajang.png',
        likes: 765,
        comment: '“가볍게 먹기 좋은 중식 대표 메뉴!”',
        description: '달달하고 고소한 국민 중식 메뉴',
        situations: ['혼밥', '친목'],
        times: ['점심', '저녁'],
        tags: ['#중식', '#점심', '#혼밥', '#가성비']
    },
    {
        id: 5,
        name: '마라탕',
        category: '중식',
        image: '../assets/food/maratang.png',
        likes: 998,
        comment: '“취향대로 재료를 고르는 얼얼한 메뉴!”',
        description: '취향대로 재료를 고르는 얼얼한 메뉴',
        situations: ['혼밥', '친목', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['#중식', '#매운맛', '#친구랑']
    },
    {
        id: 6,
        name: '초밥',
        category: '일식',
        image: '../assets/food/sushi.png',
        likes: 691,
        comment: '“깔끔하고 특별한 기분을 내고 싶을 때!”',
        description: '깔끔하고 특별한 기분을 내고 싶을 때',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['#일식', '#데이트', '#깔끔']
    },
    {
        id: 7,
        name: '파스타',
        category: '양식',
        image: '../assets/food/pasta.png',
        likes: 634,
        comment: '“데이트나 기분 전환에 좋은 메뉴!”',
        description: '분위기 내고 싶을 때 좋은 부드러운 메뉴',
        situations: ['데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['#양식', '#데이트', '#분위기', '#저녁']
    },
    {
        id: 8,
        name: '떡볶이',
        category: '분식',
        image: '../assets/food/tteokbokki.png',
        likes: 913,
        comment: '“매콤한 게 당길 때 실패 없는 메뉴!”',
        description: '매콤달콤하게 기분 전환하기 좋은 분식',
        situations: ['혼밥', '친목', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['#분식', '#매콤함', '#야식', '#간식']
    },
    {
        id: 9,
        name: '라면',
        category: '분식',
        image: '../assets/food/ramen.png',
        likes: 720,
        comment: '“간단하지만 늘 강력한 한 끼 메뉴!”',
        description: '간단하지만 늘 강력한 한 끼 메뉴',
        situations: ['혼밥', '배달'],
        times: ['아침', '점심', '저녁', '야식'],
        tags: ['#분식', '#혼밥', '#간단']
    },
    {
        id: 10,
        name: '샐러드',
        category: '기타',
        image: '../assets/food/salad.png',
        likes: 356,
        comment: '“가볍고 산뜻하게 먹고 싶을 때!”',
        description: '가볍고 산뜻하게 먹고 싶을 때',
        situations: ['혼밥', '데이트'],
        times: ['아침', '점심', '저녁'],
        tags: ['#기타', '#가벼움', '#건강']
    },
    {
        id: 11,
        name: '돈까스',
        category: '일식',
        image: '../assets/food/donkatsu.png',
        likes: 678,
        comment: '“바삭하고 든든하게 먹기 좋은 메뉴!”',
        description: '바삭하고 든든하게 먹기 좋은 메뉴',
        situations: ['혼밥', '데이트', '친목'],
        times: ['점심', '저녁'],
        tags: ['#일식', '#점심', '#든든함']
    },
    {
        id: 12,
        name: '피자',
        category: '양식',
        image: '../assets/food/pizza.png',
        likes: 884,
        comment: '“여럿이 나눠 먹기 좋은 대표 메뉴!”',
        description: '여럿이 나눠 먹기 좋은 대표 메뉴',
        situations: ['친목', '회식', '배달'],
        times: ['점심', '저녁', '야식'],
        tags: ['#양식', '#배달', '#친구랑']
    }
];


// ================================
// 4. 공통 유틸
// ================================

function readJSON(key, fallbackValue) {
    const savedData = localStorage.getItem(key);

    if (!savedData) {
        return fallbackValue;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error(`${key} 데이터를 불러오지 못했습니다.`, error);
        return fallbackValue;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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
    return `omechu_wiki_food_${foodId}_my_like_count_${LOGIN_USER_ID}`;
}

function getCommentKey(foodId) {
    return `omechu_food_${foodId}_comments`;
}

function getSavedCommentsByFoodId(foodId) {
    return readJSON(getCommentKey(foodId), []);
}

function getCustomFoodComments(food) {
    if (!Array.isArray(food.commentList)) {
        return [];
    }

    return food.commentList;
}

function getAllCommentsByFood(food) {
    return [
        ...getSavedCommentsByFoodId(food.id),
        ...getCustomFoodComments(food)
    ];
}

function getRandomCommentByFood(food) {
    const comments = getAllCommentsByFood(food).filter(function(comment) {
        return comment && String(comment.text || '').trim() !== '';
    });

    if (comments.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * comments.length);

    return comments[randomIndex];
}

function getCustomFoodList() {
    return readJSON(CUSTOM_FOOD_STORAGE_KEY, []);
}


// ================================
// 5. DB처럼 쓸 음식 목록 만들기
// 기본 음식 + 사용자가 작성한 커스텀 음식
// ================================

function normalizeFood(food) {
    const tags = Array.isArray(food.tags) ? food.tags : [];
                
    return {
        id: food.id,
        name: food.name || '이름 없는 음식',
        category: food.category || '기타',
        image: food.image || DEFAULT_IMAGE,
        likes: Number(food.likes || food.count || 0),
        comment:
            food.comment ||
            food.description ||
            food.summary ||
            '“오늘 메뉴로 괜찮은 선택이에요!”',
        description:
            food.description ||
            food.summary ||
            food.comment ||
            '오늘 메뉴로 괜찮은 선택이에요.',
        situations: Array.isArray(food.situations) ? food.situations : [],
        times: Array.isArray(food.times) ? food.times : [],
        tags: tags,

        // 커스텀 음식 내부 데이터 유지
        commentList: Array.isArray(food.commentList) ? food.commentList : [],
        photos: Array.isArray(food.photos) ? food.photos : []
    };
}

function getFoodDB() {
    const customFoods = getCustomFoodList();

    return [
        ...customFoods.map(normalizeFood),
        ...defaultFoodDB.map(normalizeFood)
    ];
}

function findFoodById(foodId) {
    const foodDB = getFoodDB();

    return foodDB.find(function(food) {
        return String(food.id) === String(foodId);
    }) || null;
}

function findFoodBySavedFood(savedFood) {
    if (!savedFood || !savedFood.id) {
        return null;
    }

    return findFoodById(savedFood.id);
}

function getFoodTotalLikeCount(food) {
    return Number(food.likes || 0) + readNumber(getTotalLikeKey(food.id));
}

function getMyLikeCount(foodId) {
    if (!IS_LOGIN || !LOGIN_USER_ID) {
        return 0;
    }

    return readNumber(getMyLikeKey(foodId));
}


// ================================
// 6. 옵션 필터
// ================================

function getFilteredFoodListByOptions(options) {
    const foodDB = getFoodDB();

    if (!options) {
        return foodDB;
    }

    return foodDB.filter(function(food) {
        const categoryMatched =
            !options.categories ||
            options.categories.length === 0 ||
            options.categories.includes(food.category);

        const situationMatched =
            !options.situations ||
            options.situations.length === 0 ||
            options.situations.some(function(situation) {
                return food.situations.includes(situation);
            });

        const timeMatched =
            !options.times ||
            options.times.length === 0 ||
            options.times.some(function(time) {
                return food.times.includes(time);
            });

        return categoryMatched && situationMatched && timeMatched;
    });
}

function getRandomFood(foodList) {
    if (!Array.isArray(foodList) || foodList.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * foodList.length);
    return foodList[randomIndex];
}


// ================================
// 7. 결과 저장 / 불러오기
// ================================

function getSavedOmechuResult() {
    const savedResult = localStorage.getItem('omechu_result');

    if (!savedResult) {
        return null;
    }

    try {
        return JSON.parse(savedResult);
    } catch (error) {
        localStorage.removeItem('omechu_result');
        return null;
    }
}

function saveResultFood(food, options = null, recommendedType = 'random') {
    const matchedList = options ? getFilteredFoodListByOptions(options) : getFoodDB();

    saveJSON('omechu_result', {
        food: {
            id: food.id,
            name: food.name,
            category: food.category,
            situations: food.situations,
            times: food.times,
            tags: food.tags
        },
        options: options,
        matchedCount: matchedList.length,
        recommendedType: recommendedType,
        recommendedAt: Date.now()
    });
}


// ================================
// 8. 화면 출력
// ================================

function renderRecommendCount(food) {
    if (!resultCount || !food) {
        return;
    }

    const totalLikeCount = getFoodTotalLikeCount(food);
    const myLikeCount = getMyLikeCount(food.id);

    if (IS_LOGIN) {
        resultCount.textContent = `추천 ${totalLikeCount} / 내 추천 ${myLikeCount}`;
    } else {
        resultCount.textContent = `추천 ${totalLikeCount}`;
    }
}

function renderResult(food) {
    if (!food) {
        alert('추천 결과가 없어요. 다시 오메추를 받아주세요!');
        location.href = '../index.html';
        return;
    }

    resultMenuName.textContent = food.name;

    const randomComment = getRandomCommentByFood(food);

    if (randomComment) {
        if (resultNickname) {
            resultNickname.textContent = `${randomComment.user || '익명'}님:`;
        }

        resultComment.textContent = randomComment.text;
    } else {
        if (resultNickname) {
            resultNickname.textContent = '오메추님:';
        }

        resultComment.textContent = food.comment || '“오늘 메뉴로 괜찮은 선택이에요!”';
    }

    resultFoodImg.src = food.image || DEFAULT_IMAGE;
    resultFoodImg.alt = food.name;
    resultFoodImg.onerror = function() {
        resultFoodImg.onerror = null;
        resultFoodImg.src = DEFAULT_IMAGE;
    };

    tagList.innerHTML = '';

    const visibleTags = Array.isArray(food.tags) && food.tags.length > 0
        ? food.tags.slice(0, 5)
        : [`#${food.category}`];

    visibleTags.forEach(function(tag) {
        const span = document.createElement('span');
        span.textContent = tag;
        tagList.appendChild(span);
    });

    renderRecommendCount(food);
}

function renderCurrentResult() {
    const savedResult = getSavedOmechuResult();
    const savedFood = savedResult ? findFoodBySavedFood(savedResult.food) : null;

    if (savedFood) {
        renderResult(savedFood);
        return;
    }

    const foodDB = getFoodDB();
    const selectedFood = getRandomFood(foodDB);

    if (!selectedFood) {
        alert('추천할 음식 데이터가 없어요.');
        location.href = '../index.html';
        return;
    }

    saveResultFood(selectedFood, null, 'random');
    renderResult(selectedFood);
}


// ================================
// 9. 다시 추천
// ================================

function spinResultRoulette() {
    if (!resultRouletteImg) {
        return;
    }

    resultRouletteImg.classList.remove('spin');
    void resultRouletteImg.offsetWidth;
    resultRouletteImg.classList.add('spin');
}

function handleAgainClick() {
    rouletteOverlay.classList.remove('hidden');
    spinResultRoulette();

    setTimeout(function() {
        const currentResult = getSavedOmechuResult();

        let candidateList = getFoodDB();
        let options = null;
        let recommendedType = 'random';

        if (currentResult && currentResult.options) {
            options = currentResult.options;
            candidateList = getFilteredFoodListByOptions(options);
            recommendedType = 'option';

            if (candidateList.length === 0) {
                candidateList = getFoodDB();
                options = null;
                recommendedType = 'random';
            }
        }

        const selectedFood = getRandomFood(candidateList);

        saveResultFood(selectedFood, options, recommendedType);
        renderResult(selectedFood);

        rouletteOverlay.classList.add('hidden');
    }, 900);
}


// ================================
// 10. 식당 찾기 / 위키 이동
// ================================

function handleMapClick() {
    const menuName = resultMenuName ? resultMenuName.textContent.trim() : '';

    if (!menuName) {
        alert('검색할 음식 이름을 찾을 수 없어요.');
        return;
    }

    localStorage.setItem('omechu_map_keyword', menuName);

    location.href = './map.html';
}

function handleWikiClick() {
    const currentResult = getSavedOmechuResult();
    const foodId = currentResult && currentResult.food ? currentResult.food.id : 1;

    location.href = `./wiki_detail.html?id=${foodId}`;
}


// ================================
// 11. 공유하기
// ================================

function openShareOverlay() {
    const menuName = resultMenuName.textContent;

    shareMenuName.textContent = `오늘의 추천 메뉴는 ${menuName}!`;

    shareFoodImg.src = resultFoodImg.src;
    shareFoodImg.alt = menuName;

    shareOverlay.classList.remove('hidden');
}

function closeShareOverlay() {
    shareOverlay.classList.add('hidden');
}

async function handleCopyLink() {
    const menuName = resultMenuName.textContent;
    const shareMessage = `오늘 뭐 먹지?\n오메추가 ${menuName}을 추천했어요!\n\n${location.href}`;

    try {
        await navigator.clipboard.writeText(shareMessage);
        copyLinkBtn.textContent = '복사 완료!';
    } catch (error) {
        alert('복사에 실패했어요.');
    }

    setTimeout(function() {
        copyLinkBtn.textContent = '링크 복사하기';
    }, 1200);
}


// ================================
// 12. 추천하기
// 푸드위키와 같은 localStorage key를 사용
// ================================

function handleRecommendClick() {
    const currentResult = getSavedOmechuResult();
    const currentFood = currentResult ? findFoodBySavedFood(currentResult.food) : null;

    if (!currentFood) {
        alert('추천할 음식 정보를 찾을 수 없어요.');
        return;
    }

    if (!IS_LOGIN || !LOGIN_USER_ID) {
        alert('추천은 로그인 후 이용할 수 있어요!');
        location.href = './login/login.html';
        return;
    }

    const currentMyLikeCount = getMyLikeCount(currentFood.id);
    const currentAddedLikeCount = readNumber(getTotalLikeKey(currentFood.id));

    saveNumber(getMyLikeKey(currentFood.id), currentMyLikeCount + 1);
    saveNumber(getTotalLikeKey(currentFood.id), currentAddedLikeCount + 1);

    updateRecommendButtonLiked();
    renderRecommendCount(currentFood);
    createHeartParticles(recommendBtn);
}

function updateRecommendButtonLiked() {
    if (!recommendBtn) {
        return;
    }

    const heart = recommendBtn.querySelector('.heart');
    const text = recommendBtn.querySelector('.recommend_click');

    recommendBtn.classList.add('is-liked');

    if (heart) {
        heart.textContent = '🤍';
    }

    if (text) {
        text.textContent = '추천 더하기!';
    }
}

function createHeartParticles(button) {
    if (!button) {
        return;
    }

    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('span');

        particle.classList.add('heart_particle');
        particle.textContent = '🧡';

        const randomX = Math.random() * 80 - 40;
        const randomY = Math.random() * -60 - 20;
        const randomRotate = Math.random() * 60 - 30;

        particle.style.setProperty('--x', `${randomX}px`);
        particle.style.setProperty('--y', `${randomY}px`);
        particle.style.setProperty('--r', `${randomRotate}deg`);

        button.appendChild(particle);

        setTimeout(function() {
            particle.remove();
        }, 800);
    }
}


// ================================
// 13. 이벤트 연결
// ================================

if (btnAgain) {
    btnAgain.addEventListener('click', handleAgainClick);
}

if (btnMap) {
    btnMap.addEventListener('click', handleMapClick);
}

if (btnWiki) {
    btnWiki.addEventListener('click', handleWikiClick);
}

if (btnShare) {
    btnShare.addEventListener('click', openShareOverlay);
}

if (shareCloseBtn) {
    shareCloseBtn.addEventListener('click', closeShareOverlay);
}

if (shareOverlay) {
    shareOverlay.addEventListener('click', function(event) {
        if (event.target === shareOverlay) {
            closeShareOverlay();
        }
    });
}

if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', handleCopyLink);
}

if (recommendBtn) {
    recommendBtn.addEventListener('click', handleRecommendClick);
}


// ================================
// 14. 실행
// ================================

renderCurrentResult();