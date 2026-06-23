// ================================
// wiki.js
// 푸드 위키 페이지 기능
// 검색 / 카테고리 / 정렬 / 페이지네이션 / 추천
// ================================


// ================================
// 1. 음식 데이터
// ================================
// 지금은 서버 없이 배열 데이터로 화면을 그림
// 나중에 DB를 붙이면 이 배열 부분만 서버 데이터로 교체하면 됨

let foodList = [];

const WIKI_LIST_API_URL = '../backend/api/wiki/list.php';
const WIKI_LIKE_API_URL = '../backend/api/wiki/like.php';
const DEFAULT_IMAGE = '../assets/food/default.png';
const WIKI_FOOD_DELETE_API_URL = '../backend/api/wiki/food_delete.php';
const IS_ADMIN = localStorage.getItem('omechu_is_admin') === 'true';

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
        path.startsWith('/') ||
        path.startsWith('../') ||
        path.startsWith('./')
    ) {
        return path;
    }

    return `../${path}`;
}

// ================================
// 2. localStorage key
// ================================

const PER_PAGE_STORAGE_KEY = 'omechu_wiki_per_page';
const SORT_STORAGE_KEY = 'omechu_wiki_sort';


// ================================
// 3. 로그인 상태
// ================================
// 버튼 눌린 자국은 현재 로그인한 사용자 기준으로만 표시함

const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
const LOGIN_USER_NO = localStorage.getItem('omechu_user_no') || '';
const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';


// ================================
// 4. 현재 선택된 상태값
// ================================

let currentKeyword = '';
let currentCategory = '전체';
let currentSort = localStorage.getItem(SORT_STORAGE_KEY) || 'likes';
let currentPage = 1;
let perPage = Number(localStorage.getItem(PER_PAGE_STORAGE_KEY)) || 5;
let searchTimer = null;


// ================================
// 5. HTML 요소 가져오기
// ================================

const foodSearchInput = document.querySelector('#foodSearchInput');
const categoryBtns = document.querySelectorAll('.category_btn');
const sortSelect = document.querySelector('#sortSelect');
const perPageSelect = document.querySelector('#perPageSelect');

const foodListBox = document.querySelector('#foodListBox');
const foodCount = document.querySelector('#foodCount');
const emptyMessage = document.querySelector('#emptyMessage');
const pagination = document.querySelector('#pagination');
const categoryList = document.querySelector('#categoryList');
const wikiWriteBtn = document.querySelector('.wiki_write');

// ================================
// 6. 초기 select 값 반영
// ================================

if (perPageSelect) {
    perPageSelect.value = String(perPage);
}

if (sortSelect) {
    sortSelect.value = currentSort;
}


// ================================
// 7. 추천 관련 helper
// ================================

function getFoodTotalLikeCount(food) {
    return Number(food.likes || 0);
}

function getFoodTotalHitCount(food) {
    return Number(food.hits || 0);
}

function getMyLikeCountByFood(food) {
    if (!IS_LOGIN || !LOGIN_USER_NO) {
        return 0;
    }

    return Number(food.myLikeCount || 0);
}

function isMyLikedFood(food) {
    return getMyLikeCountByFood(food) > 0;
}

// ================================
// 8. 음식 카드 HTML 만들기
// ================================

function createFoodCard(food) {
    const MAX_CARD_TAG_COUNT = 6;

    const visibleTags = (food.tags || []).slice(0, MAX_CARD_TAG_COUNT);

    const tagHTML = visibleTags.map(function(tag) {
        return `<span>${tag}</span>`;
    }).join('');

    const isLiked = isMyLikedFood(food);
    const totalLikeCount = getFoodTotalLikeCount(food);
    const totalHitCount = getFoodTotalHitCount(food);

    return `
        <div class="food_card" data-id="${food.id}">
            <img 
                class="food_img" 
                src="${food.image || DEFAULT_IMAGE}"
                alt="${food.name}"
                decoding="async"
                onerror="this.onerror=null; this.src='../assets/food/default.png'"
            >

            <div class="food_info">
                <h2 class="food_name">${food.name}</h2>

                <div class="food_tags">
                    ${tagHTML}
                </div>

                <div class="food_meta">
                    <span>추천 ${totalLikeCount}</span>
                    <span>댓글 ${food.comments}</span>
                    <span>조회 ${totalHitCount}</span>
                </div>
            </div>

            <button 
                type="button" 
                class="food_like_btn ${isLiked ? 'is-liked' : ''}" 
                data-id="${food.id}"
                aria-label="${isLiked ? '추천 완료' : '추천하기'}"
            >
                ${isLiked ? '🤍' : '♡'}
            </button>

            ${
                IS_ADMIN
                ? `
                    <button
                        type="button"
                        class="wiki_food_delete_btn"
                        data-id="${food.id}"
                    >
                        위키 삭제
                    </button>
                `
                : ''
            }
        </div>
    `;
}


// ================================
// 9. 검색 / 카테고리 / 정렬 적용
// ================================

function getFilteredFoodList() {
    let result = [...foodList];

    if (currentKeyword !== '') {
        const cleanKeyword = currentKeyword.replace('#', '');

        result = result.filter(function(food) {
            const isNameMatched = food.name.includes(cleanKeyword);

            const isTagMatched = food.tags.some(function(tag) {
                const cleanTag = tag.replace('#', '');
                return cleanTag.includes(cleanKeyword);
            });

            return isNameMatched || isTagMatched;
        });
    }

    if (currentCategory !== '전체') {
        result = result.filter(function(food) {
            return food.category === currentCategory;
        });
    }

    if (currentSort === 'likes') {
        result.sort(function(a, b) {
            return getFoodTotalLikeCount(b) - getFoodTotalLikeCount(a);
        });
    }

    if (currentSort === 'latest') {
        result.sort(function(a, b) {
            return b.id - a.id;
        });
    }

    if (currentSort === 'comments') {
        result.sort(function(a, b) {
            return b.comments - a.comments;
        });
    }

    return result;
}


// ================================
// 10. 페이지 처리
// ================================

function getPagedFoodList(list) {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return list.slice(startIndex, endIndex);
}

function getTotalPage(totalCount) {
    return Math.ceil(totalCount / perPage);
}


// ================================
// 11. 음식 목록 출력
// ================================

function normalizeFoodFromDB(food) {
    return {
        id: Number(food.id),
        name: food.name || '이름 없는 음식',
        category: food.category || '기타',
        image: normalizeImagePath(food.image),
        summary: food.summary || '',
        description: food.description || '',
        tags: Array.isArray(food.tags) ? food.tags : [],
        situations: Array.isArray(food.situations) ? food.situations : [],
        times: Array.isArray(food.times) ? food.times : [],
        likes: Number(food.likes || 0),
        comments: Number(food.comments || 0),
        hits: Number(food.hits || 0),
        photos: Number(food.photos || 0),
        myLikeCount: Number(food.myLikeCount || 0),
        createdAt: food.createdAt || ''
    };
}

function loadWikiFoodList() {
    if (foodListBox) {
        foodListBox.innerHTML = `
            <p class="my_empty_text">푸드 위키를 불러오는 중이에요...</p>
        `;
    }

    fetch(WIKI_LIST_API_URL, {
        method: 'GET',
        credentials: 'include'
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '푸드 위키 목록을 불러오지 못했어요.');
                foodList = [];
                renderFoodList();
                return;
            }

            foodList = Array.isArray(data.foods)
                ? data.foods.map(normalizeFoodFromDB)
                : [];

            renderFoodList();
        })
        .catch(function(error) {
            console.error('푸드 위키 목록 불러오기 실패:', error);

            foodList = [];
            renderFoodList();
        });
}

function renderFoodList() {
    const filteredList = getFilteredFoodList();
    const totalPage = getTotalPage(filteredList.length);

    if (currentPage > totalPage && totalPage > 0) {
        currentPage = totalPage;
    }

    foodCount.textContent = filteredList.length;

    if (filteredList.length === 0) {
        foodListBox.innerHTML = '';
        pagination.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        return;
    }

    emptyMessage.classList.add('hidden');

    const pagedList = getPagedFoodList(filteredList);

    foodListBox.innerHTML = pagedList.map(function(food) {
        return createFoodCard(food);
    }).join('');

    renderPagination(totalPage);
}


// ================================
// 12. 페이지네이션 출력
// ================================

function renderPagination(totalPage) {
    if (totalPage <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let pageHTML = '';

    pageHTML += `
        <button 
            type="button" 
            class="page_btn prev_btn" 
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? 'disabled' : ''}
        >
            이전
        </button>
    `;

    for (let i = 1; i <= totalPage; i++) {
        pageHTML += `
            <button 
                type="button" 
                class="page_btn ${currentPage === i ? 'active' : ''}" 
                data-page="${i}"
            >
                ${i}
            </button>
        `;
    }

    pageHTML += `
        <button 
            type="button" 
            class="page_btn next_btn" 
            data-page="${currentPage + 1}"
            ${currentPage === totalPage ? 'disabled' : ''}
        >
            다음
        </button>
    `;

    pagination.innerHTML = pageHTML;
}


// ================================
// 13. 추천 버튼 처리
// ================================

function handleFoodLikeButton(button) {
    const foodId = Number(button.dataset.id);

    if (!foodId) {
        return;
    }

    if (!IS_LOGIN || !LOGIN_USER_NO) {
        alert('추천은 로그인 후 이용할 수 있어요!');
        location.href = './login/login.html';
        return;
    }

    button.disabled = true;

    fetch(WIKI_LIKE_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            food_id: foodId
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

            const targetFood = foodList.find(function(food) {
                return Number(food.id) === Number(foodId);
            });

            if (targetFood) {
                targetFood.likes = Number(data.like_count || 0);
                targetFood.myLikeCount = Number(data.my_like_count || 0);
            }

            button.classList.add('is-liked');
            button.textContent = '🤍';
            button.setAttribute('aria-label', `내 추천 ${data.my_like_count}회`);

            const foodCard = button.closest('.food_card');
            const likeCountText = foodCard ? foodCard.querySelector('.food_meta span:first-child') : null;

            if (likeCountText && targetFood) {
                likeCountText.textContent = `추천 ${targetFood.likes}`;
            }

            createFoodHeartParticles(button);
        })
        .catch(function(error) {
            console.error('추천 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        })
        .finally(function() {
            button.disabled = false;
        });
}

function deleteWikiFood(foodId) {
    if (!IS_ADMIN) {
        alert('관리자만 삭제할 수 있어요.');
        return;
    }

    const targetFood = foodList.find(function(food) {
        return Number(food.id) === Number(foodId);
    });

    if (!targetFood) {
        alert('삭제할 음식 정보를 찾을 수 없어요.');
        return;
    }

    if (!confirm(`"${targetFood.name}" 위키를 삭제할까요?\n관련 코멘트와 사진도 함께 숨김 처리됩니다.`)) {
        return;
    }

    fetch(WIKI_FOOD_DELETE_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            food_id: foodId
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '음식 위키 삭제에 실패했어요.');
                return;
            }

            alert(data.message || '음식 위키가 삭제됐어요.');

            foodList = foodList.filter(function(food) {
                return Number(food.id) !== Number(foodId);
            });

            renderFoodList();
        })
        .catch(function(error) {
            console.error('음식 위키 삭제 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        });
}

// ================================
// 14. 하트 파티클
// ================================

function createFoodHeartParticles(button) {
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

        button.appendChild(particle);

        setTimeout(function() {
            particle.remove();
        }, 800);
    }
}


// ================================
// 15. 이벤트 연결
// ================================

// 음식 카드 / 추천 버튼 클릭
foodListBox.addEventListener('click', function(event) {
    const deleteButton = event.target.closest('.wiki_food_delete_btn');

    if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();

        deleteWikiFood(Number(deleteButton.dataset.id));
        return;
    }

    const likeButton = event.target.closest('.food_like_btn');

    if (likeButton) {
        event.preventDefault();
        event.stopPropagation();

        handleFoodLikeButton(likeButton);
        return;
    }

    const foodCard = event.target.closest('.food_card');

    if (!foodCard) {
        return;
    }

    const foodId = foodCard.dataset.id;

    location.href = `./wiki_detail.html?id=${foodId}`;
});


// 페이지네이션 클릭
pagination.addEventListener('click', function(event) {
    const pageButton = event.target.closest('.page_btn');

    if (!pageButton || pageButton.disabled) {
        return;
    }

    currentPage = Number(pageButton.dataset.page);

    renderFoodList();

    foodListBox.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});


// 검색 입력
foodSearchInput.addEventListener('input', function() {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(function() {
        currentKeyword = foodSearchInput.value.trim();
        currentPage = 1;

        renderFoodList();
    }, 200);
});


// 카테고리 버튼
categoryBtns.forEach(function(button) {
    button.addEventListener('click', function() {
        categoryBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        button.classList.add('selected');

        currentCategory = button.dataset.category || '전체';
        currentPage = 1;

        renderFoodList();
    });
});


// 정렬 선택
sortSelect.addEventListener('change', function() {
    currentSort = sortSelect.value;

    localStorage.setItem(SORT_STORAGE_KEY, currentSort);

    currentPage = 1;

    renderFoodList();
});


// 페이지당 개수 선택
perPageSelect.addEventListener('change', function() {
    perPage = Number(perPageSelect.value);

    localStorage.setItem(PER_PAGE_STORAGE_KEY, String(perPage));

    currentPage = 1;

    renderFoodList();
});

if (wikiWriteBtn) {
    wikiWriteBtn.addEventListener('click', function() {
        location.href = './wiki_write.html';
    });
}

// ================================
// 16. 카테고리 마우스 드래그 가로 스크롤
// ================================

if (categoryList) {
    let isCategoryDragging = false;
    let categoryStartX = 0;
    let categoryStartScrollLeft = 0;
    let categoryMovedDistance = 0;

    categoryList.addEventListener('mousedown', function(event) {
        isCategoryDragging = true;
        categoryMovedDistance = 0;

        categoryList.classList.add('is-dragging');

        categoryStartX = event.pageX;
        categoryStartScrollLeft = categoryList.scrollLeft;
    });

    categoryList.addEventListener('mousemove', function(event) {
        if (!isCategoryDragging) {
            return;
        }

        event.preventDefault();

        const currentX = event.pageX;
        const moveX = currentX - categoryStartX;

        categoryMovedDistance = Math.abs(moveX);

        categoryList.scrollLeft = categoryStartScrollLeft - moveX;
    });

    categoryList.addEventListener('mouseup', function() {
        isCategoryDragging = false;
        categoryList.classList.remove('is-dragging');
    });

    categoryList.addEventListener('mouseleave', function() {
        isCategoryDragging = false;
        categoryList.classList.remove('is-dragging');
    });

    categoryList.addEventListener('click', function(event) {
        if (categoryMovedDistance > 5) {
            event.preventDefault();
            event.stopPropagation();

            categoryMovedDistance = 0;
        }
    }, true);
}


// ================================
// 17. 최초 실행
// ================================

loadWikiFoodList();