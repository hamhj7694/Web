// ================================
// result.js
// 오메추 결과 페이지
// DB 추천 결과 표시 / 다시 추천 / 추천하기 / 지도 / 위키 이동 / 공유
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
// 2. API / 기본값
// ================================

const DEFAULT_IMAGE = '../assets/food/default.png';

const AUTH_ME_API_URL = '../backend/api/auth/me.php';
const OMECHU_RANDOM_API_URL = '../backend/api/omechu/random.php';
const WIKI_DETAIL_API_URL = '../backend/api/wiki/detail.php';
const WIKI_LIKE_API_URL = '../backend/api/wiki/like.php';
const COMMENT_LIST_API_URL = '../backend/api/wiki/comment_list.php';


// ================================
// 3. 로그인 상태
// ================================

let IS_LOGIN = false;
let LOGIN_USER_NO = '';
let LOGIN_USER_ID = '';
let LOGIN_USER_NICKNAME = '';

async function loadLoginState() {
    try {
        const response = await fetch(AUTH_ME_API_URL, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.is_login && data.user) {
            IS_LOGIN = true;
            LOGIN_USER_NO = String(data.user.no || '');
            LOGIN_USER_ID = data.user.login_id || '';
            LOGIN_USER_NICKNAME = data.user.nickname || '';

            localStorage.setItem('omechu_is_login', 'true');
            localStorage.setItem('omechu_user_no', LOGIN_USER_NO);
            localStorage.setItem('omechu_user_id', LOGIN_USER_ID);
            localStorage.setItem('omechu_user_nickname', LOGIN_USER_NICKNAME);
            return;
        }

        clearLoginState();

    } catch (error) {
        console.error('로그인 상태 확인 실패:', error);
        clearLoginState();
    }
}

function clearLoginState() {
    IS_LOGIN = false;
    LOGIN_USER_NO = '';
    LOGIN_USER_ID = '';
    LOGIN_USER_NICKNAME = '';

    localStorage.removeItem('omechu_is_login');
    localStorage.removeItem('omechu_user_no');
    localStorage.removeItem('omechu_user_id');
    localStorage.removeItem('omechu_user_nickname');
}


// ================================
// 4. 공통 유틸
// ================================

function normalizeImagePath(imagePath) {
    if (!imagePath) {
        return DEFAULT_IMAGE;
    }

    const path = String(imagePath).trim();

    if (!path) {
        return DEFAULT_IMAGE;
    }

    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('../') ||
        path.startsWith('./')
    ) {
        return path;
    }

    if (path.startsWith('/')) {
        return path;
    }

    return `../${path}`;
}

function normalizeFood(food) {
    if (!food) {
        return null;
    }

    return {
        id: Number(food.id || food.no || 0),
        name: food.name || '이름 없는 음식',
        category: food.category || '기타',
        image: normalizeImagePath(food.image || food.image_url || ''),
        likes: Number(food.likes || food.like_count || 0),
        myLikeCount: Number(food.myLikeCount || food.my_like_count || 0),
        comment:
            food.comment ||
            food.summary ||
            food.description ||
            '“오늘 메뉴로 괜찮은 선택이에요!”',
        description:
            food.description ||
            food.summary ||
            food.comment ||
            '오늘 메뉴로 괜찮은 선택이에요.',
        summary:
            food.summary ||
            food.description ||
            food.comment ||
            '',
        situations: Array.isArray(food.situations) ? food.situations : [],
        times: Array.isArray(food.times) ? food.times : [],
        tags: Array.isArray(food.tags) ? food.tags : [],
        comments: Number(food.comments || food.comment_count || 0),
        hits: Number(food.hits || food.view_count || 0),
        photos: Number(food.photos || food.photo_count || 0)
    };
}

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

function saveResultFood(food, options = null, recommendedType = 'db_random') {
    localStorage.setItem('omechu_result', JSON.stringify({
        food: normalizeFood(food),
        options: options,
        matchedCount: 1,
        recommendedType: recommendedType,
        recommendedAt: Date.now()
    }));
}

function getFoodTotalLikeCount(food) {
    return Number(food && food.likes ? food.likes : 0);
}

function getMyLikeCount(food) {
    if (!IS_LOGIN || !LOGIN_USER_NO || !food) {
        return 0;
    }

    return Number(food.myLikeCount || 0);
}


// ================================
// 5. DB 조회
// ================================

function fetchFoodDetail(foodId) {
    return fetch(`${WIKI_DETAIL_API_URL}?id=${foodId}`, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        });
}

function fetchRandomFoodFromDB(options = null) {
    const params = new URLSearchParams();

    if (options && options.categories && options.categories.length > 0) {
        params.set('category', options.categories[0]);
    }

    if (options && options.situations && options.situations.length > 0) {
        params.set('situation', options.situations[0]);
    }

    if (options && options.times && options.times.length > 0) {
        params.set('time', options.times[0]);
    }

    const queryString = params.toString();
    const requestUrl = queryString
        ? `${OMECHU_RANDOM_API_URL}?${queryString}`
        : OMECHU_RANDOM_API_URL;

    return fetch(requestUrl, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        });
}

function fetchRandomCommentFromDB(foodId) {
    return fetch(`${COMMENT_LIST_API_URL}?food_id=${foodId}`, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success || !Array.isArray(data.comments)) {
                return null;
            }

            const validComments = data.comments.filter(function(comment) {
                return comment && String(comment.text || '').trim() !== '';
            });

            if (validComments.length === 0) {
                return null;
            }

            const randomIndex = Math.floor(Math.random() * validComments.length);
            return validComments[randomIndex];
        })
        .catch(function(error) {
            console.error('랜덤 코멘트 불러오기 실패:', error);
            return null;
        });
}


// ================================
// 6. 화면 출력
// ================================

function renderRecommendCount(food) {
    if (!resultCount || !food) {
        return;
    }

    const totalLikeCount = getFoodTotalLikeCount(food);
    const myLikeCount = getMyLikeCount(food);

    if (IS_LOGIN) {
        resultCount.textContent = `추천 ${totalLikeCount} / 내 추천 ${myLikeCount}`;
    } else {
        resultCount.textContent = `추천 ${totalLikeCount}`;
    }
}

async function renderResult(food) {
    const normalizedFood = normalizeFood(food);

    if (!normalizedFood || !normalizedFood.id) {
        alert('추천 결과가 없어요. 다시 오메추를 받아주세요!');
        location.href = '../index.html';
        return;
    }

    resultMenuName.textContent = normalizedFood.name;

    if (resultNickname) {
        resultNickname.textContent = '오메추님:';
    }

    if (resultComment) {
        resultComment.textContent = normalizedFood.comment || '“오늘 메뉴로 괜찮은 선택이에요!”';
    }

    resultFoodImg.src = normalizedFood.image || DEFAULT_IMAGE;
    resultFoodImg.alt = normalizedFood.name;
    resultFoodImg.onerror = function() {
        resultFoodImg.onerror = null;
        resultFoodImg.src = DEFAULT_IMAGE;
    };

    renderTags(normalizedFood);
    renderRecommendCount(normalizedFood);

    const randomComment = await fetchRandomCommentFromDB(normalizedFood.id);

    if (randomComment) {
        if (resultNickname) {
            resultNickname.textContent = `${randomComment.user || '익명'}님:`;
        }

        if (resultComment) {
            resultComment.textContent = randomComment.text;
        }
    }
}

function renderTags(food) {
    if (!tagList) {
        return;
    }

    tagList.innerHTML = '';

    const visibleTags = Array.isArray(food.tags) && food.tags.length > 0
        ? food.tags.slice(0, 5)
        : [`#${food.category}`];

    visibleTags.forEach(function(tag) {
        const span = document.createElement('span');
        span.textContent = tag;
        tagList.appendChild(span);
    });
}

async function renderCurrentResult() {
    const savedResult = getSavedOmechuResult();

    if (!savedResult || !savedResult.food || !savedResult.food.id) {
        alert('추천 결과가 없어요. 다시 오메추를 받아주세요!');
        location.href = '../index.html';
        return;
    }

    const savedFood = normalizeFood(savedResult.food);

    try {
        const detailData = await fetchFoodDetail(savedFood.id);

        if (detailData.success && detailData.food) {
            const latestFood = normalizeFood(detailData.food);

            saveResultFood(
                latestFood,
                savedResult.options || null,
                savedResult.recommendedType || 'db_random'
            );

            await renderResult(latestFood);
            return;
        }

    } catch (error) {
        console.error('최신 결과 정보 불러오기 실패:', error);
    }

    await renderResult(savedFood);
}


// ================================
// 7. 다시 추천
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
    if (rouletteOverlay) {
        rouletteOverlay.classList.remove('hidden');
    }

    spinResultRoulette();

    setTimeout(function() {
        const currentResult = getSavedOmechuResult();
        const options = currentResult ? currentResult.options : null;
        const recommendedType = options ? 'db_option' : 'db_random';

        fetchRandomFoodFromDB(options)
            .then(function(data) {
                if (!data.success || !data.food) {
                    alert(data.message || '추천할 음식을 찾지 못했어요.');
                    return;
                }

                const nextFood = normalizeFood(data.food);

                saveResultFood(nextFood, options, recommendedType);
                return renderResult(nextFood);
            })
            .catch(function(error) {
                console.error('다시 추천 실패:', error);
                alert('다시 추천 중 오류가 발생했어요.');
            })
            .finally(function() {
                if (rouletteOverlay) {
                    rouletteOverlay.classList.add('hidden');
                }
            });
    }, 900);
}


// ================================
// 8. 식당 찾기 / 위키 이동
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
// 9. 공유하기
// ================================

function openShareOverlay() {
    if (!shareOverlay) {
        return;
    }

    const menuName = resultMenuName ? resultMenuName.textContent : '';

    if (shareMenuName) {
        shareMenuName.textContent = `오늘의 추천 메뉴는 ${menuName}!`;
    }

    if (shareFoodImg && resultFoodImg) {
        shareFoodImg.src = resultFoodImg.src;
        shareFoodImg.alt = menuName;
    }

    shareOverlay.classList.remove('hidden');
}

function closeShareOverlay() {
    if (shareOverlay) {
        shareOverlay.classList.add('hidden');
    }
}

async function handleCopyLink() {
    const menuName = resultMenuName ? resultMenuName.textContent : '';
    const shareMessage = `오늘 뭐 먹지?\n오메추가 ${menuName}을 추천했어요!\n\n${location.href}`;

    try {
        await navigator.clipboard.writeText(shareMessage);

        if (copyLinkBtn) {
            copyLinkBtn.textContent = '복사 완료!';
        }

    } catch (error) {
        alert('복사에 실패했어요.');
    }

    setTimeout(function() {
        if (copyLinkBtn) {
            copyLinkBtn.textContent = '링크 복사하기';
        }
    }, 1200);
}


// ================================
// 10. 추천하기
// ================================

function handleRecommendClick() {
    const currentResult = getSavedOmechuResult();
    const currentFood = currentResult && currentResult.food
        ? normalizeFood(currentResult.food)
        : null;

    if (!currentFood || !currentFood.id) {
        alert('추천할 음식 정보를 찾을 수 없어요.');
        return;
    }

    if (!IS_LOGIN || !LOGIN_USER_NO) {
        alert('추천은 로그인 후 이용할 수 있어요!');
        location.href = './login/login.html';
        return;
    }

    if (recommendBtn) {
        recommendBtn.disabled = true;
    }

    fetch(WIKI_LIKE_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            food_id: currentFood.id
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '추천에 실패했어요.');
                return;
            }

            currentFood.likes = Number(data.like_count || currentFood.likes || 0);
            currentFood.myLikeCount = Number(data.my_like_count || 0);

            if (currentResult) {
                currentResult.food = currentFood;
                localStorage.setItem('omechu_result', JSON.stringify(currentResult));
            }

            updateRecommendButtonLiked();
            renderRecommendCount(currentFood);
            createHeartParticles(recommendBtn);
        })
        .catch(function(error) {
            console.error('추천 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        })
        .finally(function() {
            if (recommendBtn) {
                recommendBtn.disabled = false;
            }
        });
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
// 11. 이벤트 연결
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
// 12. 실행
// ================================

async function initResultPage() {
    await loadLoginState();
    await renderCurrentResult();
}

initResultPage();