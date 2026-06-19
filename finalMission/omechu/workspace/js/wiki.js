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

const foodList = [
    {
        id: 1,
        name: '제육볶음',
        category: '한식',
        image: '../assets/food/jeyuk.png',
        description: '점심에 실패 없는 든든한 메뉴',
        tags: ['#한식', '#점심', '#혼밥'],
        likes: 842,
        comments: 37,
        hits: 50
    },
    {
        id: 2,
        name: '김치찌개',
        category: '한식',
        image: '../assets/food/kimchi.png',
        description: '밥 한 공기 뚝딱 가능한 얼큰한 집밥 메뉴',
        tags: ['#한식', '#국물', '#집밥'],
        likes: 812,
        comments: 42,
        hits: 50
    },
    {
        id: 3,
        name: '치킨',
        category: '야식',
        image: '../assets/food/chicken.png',
        description: '야식 고민을 끝내주는 바삭한 정답',
        tags: ['#야식', '#배달', '#주말'],
        likes: 1052,
        comments: 96,
        hits: 50
    },
    {
        id: 4,
        name: '짜장면',
        category: '중식',
        image: '../assets/food/jajang.png',
        description: '달달하고 고소한 국민 중식 메뉴',
        tags: ['#중식', '#배달', '#가성비'],
        likes: 765,
        comments: 52,
        hits: 50
    },
    {
        id: 5,
        name: '마라탕',
        category: '중식',
        image: '../assets/food/maratang.png',
        description: '취향대로 재료를 고르는 얼얼한 메뉴',
        tags: ['#중식', '#매운맛', '#친구랑'],
        likes: 998,
        comments: 104,
        hits: 50
    },
    {
        id: 6,
        name: '초밥',
        category: '일식',
        image: '../assets/food/sushi.png',
        description: '깔끔하고 특별한 기분을 내고 싶을 때',
        tags: ['#일식', '#데이트', '#깔끔'],
        likes: 691,
        comments: 44,
        hits: 50
    },
    {
        id: 7,
        name: '파스타',
        category: '양식',
        image: '../assets/food/pasta.png',
        description: '분위기 내고 싶을 때 좋은 부드러운 메뉴',
        tags: ['#양식', '#데이트', '#저녁'],
        likes: 634,
        comments: 29,
        hits: 50
    },
    {
        id: 8,
        name: '떡볶이',
        category: '분식',
        image: '../assets/food/tteokbokki.png',
        description: '매콤달콤하게 기분 전환하기 좋은 분식',
        tags: ['#분식', '#매콤', '#간식'],
        likes: 913,
        comments: 81,
        hits: 50
    },
    {
        id: 9,
        name: '라면',
        category: '분식',
        image: '../assets/food/ramen.png',
        description: '간단하지만 늘 강력한 한 끼 메뉴',
        tags: ['#분식', '#혼밥', '#간단'],
        likes: 720,
        comments: 63,
        hits: 50
    },
    {
        id: 10,
        name: '샐러드',
        category: '기타',
        image: '../assets/food/salad.png',
        description: '가볍고 산뜻하게 먹고 싶을 때',
        tags: ['#기타', '#가벼움', '#건강'],
        likes: 356,
        comments: 18,
        hits: 50
    },
    {
        id: 11,
        name: '돈까스',
        category: '일식',
        image: '../assets/food/donkatsu.png',
        description: '바삭하고 든든하게 먹기 좋은 메뉴',
        tags: ['#일식', '#점심', '#든든함'],
        likes: 678,
        comments: 35,
        hits: 50
    },
    {
        id: 12,
        name: '피자',
        category: '양식',
        image: '../assets/food/pizza.png',
        description: '여럿이 나눠 먹기 좋은 대표 메뉴',
        tags: ['#양식', '#배달', '#친구랑'],
        likes: 884,
        comments: 77,
        hits: 50
    }
];


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

function getTotalLikeStorageKey(foodId) {
    // 전체 추천 수 증가분
    // 나중에 DB 연결하면 이 key는 제거하고 서버 추천 수를 쓰면 됨
    return `omechu_wiki_food_${foodId}_like_count`;
}

function getMyLikeStorageKey(foodId) {
    // 현재 로그인한 사용자가 해당 메뉴를 추천했는지
    return `omechu_wiki_food_${foodId}_my_like_${LOGIN_USER_ID}`;
}

function getAddedLikeCount(foodId) {
    const key = getTotalLikeStorageKey(foodId);
    return Number(localStorage.getItem(key)) || 0;
}

function getFoodTotalLikeCount(food) {
    return food.likes + getAddedLikeCount(food.id);
}

function getAddedHitCount(foodId) {
    const hitStorageKey = `omechu_wiki_food_${foodId}_hits`;
    return Number(localStorage.getItem(hitStorageKey)) || 0;
}

function getFoodTotalHitCount(food) {
    return food.hits + getAddedHitCount(food.id);
}

function isMyLikedFood(foodId) {
    if (!IS_LOGIN || !LOGIN_USER_ID) {
        return false;
    }

    return localStorage.getItem(getMyLikeStorageKey(foodId)) === 'true';
}


// ================================
// 8. 음식 카드 HTML 만들기
// ================================

function createFoodCard(food) {
    const tagHTML = food.tags.map(function(tag) {
        return `<span>${tag}</span>`;
    }).join('');

    const isLiked = isMyLikedFood(food.id);
    const totalLikeCount = getFoodTotalLikeCount(food);
    const totalHitCount = getFoodTotalHitCount(food);

    return `
        <div class="food_card" data-id="${food.id}">
            <img 
                class="food_img" 
                src="${food.image}" 
                alt="${food.name}"
                decoding="async"
                onerror="this.onerror=null; this.src='../assets/food/default.png'"
            >

            <div class="food_info">
                <h2 class="food_name">${food.name}</h2>

                <p class="food_desc">${food.description}</p>

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

    if (!IS_LOGIN || !LOGIN_USER_ID) {
        // 비로그인일 때는 login_common.js가 먼저 잡아서 로그인으로 보냄
        // 그래도 안전하게 여기서 한 번 더 막음
        return;
    }

    if (isMyLikedFood(foodId)) {
        alert('이미 추천한 메뉴예요!');
        return;
    }

    const totalLikeStorageKey = getTotalLikeStorageKey(foodId);
    const myLikeStorageKey = getMyLikeStorageKey(foodId);

    const currentAddedLikeCount = Number(localStorage.getItem(totalLikeStorageKey)) || 0;
    const nextAddedLikeCount = currentAddedLikeCount + 1;

    // 전체 추천 수 증가분 저장
    // 나중에 DB 연결하면 이 부분은 서버 요청으로 교체
    localStorage.setItem(totalLikeStorageKey, String(nextAddedLikeCount));

    // 내가 추천했다는 상태 저장
    localStorage.setItem(myLikeStorageKey, 'true');

    button.classList.add('is-liked');
    button.textContent = '🤍';
    button.setAttribute('aria-label', '추천 완료');

    const card = button.closest('.food_card');
    const likeText = card ? card.querySelector('.food_meta span:first-child') : null;

    if (likeText) {
        const currentLikeNumber = Number(likeText.textContent.replace(/[^0-9]/g, '')) || 0;
        likeText.textContent = `추천 ${currentLikeNumber + 1}`;
    }

    createFoodHeartParticles(button);

    if (currentSort === 'likes') {
        setTimeout(function() {
            renderFoodList();
        }, 800);
    }
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

renderFoodList();