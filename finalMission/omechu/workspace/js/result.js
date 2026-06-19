let btnAgain = document.querySelector('.btn_again');
let btnMap = document.querySelector('.btn_map');
let btnWiki = document.querySelector('.btn_wiki');

let rouletteOverlay = document.querySelector('.roulette_overlay');
let resultRouletteImg = document.querySelector('.result_roulette_img');

let resultFoodImg = document.querySelector('.result_food_img');
let resultMenuName = document.querySelector('.result_menu_name');
let resultComment = document.querySelector('.result_comment');
let resultCount = document.querySelector('.result_count');
let tagList = document.querySelector('.tag_list');

let btnShare = document.querySelector('.btn_share');
let shareOverlay = document.querySelector('.share_overlay');
let shareCloseBtn = document.querySelector('.share_close_btn');
let copyLinkBtn = document.querySelector('.copy_link_btn');
let shareMenuName = document.querySelector('.share_menu_name');
let shareFoodImg = document.querySelector('.share_food_img');

const menuList = [
    {
        name: '제육볶음',
        image: '../assets/food/jeyuk.png',
        count: 842,
        comment: '“점심에 실패 없는 든든한 메뉴!”',
        tags: ['#한식', '#점심', '#혼밥', '#든든함']
    },
    {
        name: '김치찌개',
        image: '../assets/food/kimchi.png',
        count: 716,
        comment: '“밥 한 공기 뚝딱 가능한 국물 메뉴!”',
        tags: ['#한식', '#점심', '#뜨끈함', '#가성비']
    },
    {
        name: '치킨',
        image: '../assets/food/chicken.png',
        count: 650,
        comment: '“저녁이나 야식 고민이면 거의 정답!”',
        tags: ['#야식', '#저녁', '#친목', '#바삭함']
    },
    {
        name: '돈까스',
        image: '../assets/food/donkatsu.png',
        count: 533,
        comment: '“혼밥하기 좋고 든든한 메뉴!”',
        tags: ['#일식', '#점심', '#혼밥', '#든든함']
    }
];

function getRandomMenu() {
    const randomIndex = Math.floor(Math.random() * menuList.length);
    return menuList[randomIndex];
}

function renderResult(menu) {
    resultMenuName.textContent = menu.name;
    resultComment.textContent = menu.comment;
    resultCount.textContent = `추천 ${menu.count}`;

    resultFoodImg.src = menu.image;
    resultFoodImg.alt = menu.name;

    tagList.innerHTML = '';

    menu.tags.forEach((tag) => {
        const span = document.createElement('span');
        span.textContent = tag;
        tagList.appendChild(span);
    });
}

function spinResultRoulette() {
    resultRouletteImg.classList.remove('spin');

    void resultRouletteImg.offsetWidth;

    resultRouletteImg.classList.add('spin');
}

btnAgain.addEventListener('click', () => {
    rouletteOverlay.classList.remove('hidden');

    spinResultRoulette();

    setTimeout(() => {
        const selectedMenu = getRandomMenu();
        renderResult(selectedMenu);

        rouletteOverlay.classList.add('hidden');
    }, 900);
});

btnMap.addEventListener('click', () => {
    location.href = './map.html';
});

btnWiki.addEventListener('click', () => {
    location.href = './wiki-detail.html';
});

// -------------------------
// 음식 자세히 보기
// -------------------------
const wikiBtn = document.querySelector('.btn_wiki');

if (wikiBtn) {
    wikiBtn.addEventListener('click', function() {
        location.href = './wiki_detail.html?id=1';
    });
}

// -------------------------
// 공유하기
// -------------------------

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

if (btnShare) {
    btnShare.addEventListener('click', openShareOverlay);
}

if (shareCloseBtn) {
shareCloseBtn.addEventListener('click', closeShareOverlay);
}

if (shareOverlay) {
    shareOverlay.addEventListener('click', (e) => {
        if (e.target === shareOverlay) {
            closeShareOverlay();
        }
    });
}

if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
        const menuName = resultMenuName.textContent;
        const shareMessage = `오늘 뭐 먹지? \n 오메추가 ${menuName}을 추천했어요! \n\n ${location.href}`;

        try {
            await navigator.clipboard.writeText(shareMessage);
            copyLinkBtn.textContent = '복사 완료!';
        } catch (error) {
            alert('복사에 실패했어요.');
        }

        setTimeout(() => {
            copyLinkBtn.textContent = '링크 복사하기';
        }, 1200);
    });
}

// ================================
// 하트 추천 토글
// ================================

// 하트 버튼들 가져오기
var recommendBtn = document.querySelector('.recommend_btn');

if (recommendBtn) {
    recommendBtn.addEventListener('click', function () {
        var heart = recommendBtn.querySelector('.heart');
        var text = recommendBtn.querySelector('.recommend_click');
        var countText = document.querySelector('.result_count');

        // 추천 버튼은 한 번 누르면 계속 좋아요 상태 유지
        recommendBtn.classList.add('is-liked');

        // 하트 / 텍스트 변경
        if (heart) {
            heart.textContent = '🤍';
        }

        if (text) {
            text.textContent = '추천 더하기!';
        }

        // 추천 수치 1 증가
        if (countText) {
            var currentCount = Number(countText.textContent.replace(/[^0-9]/g, ''));

            if (isNaN(currentCount)) {
                currentCount = 0;
            }

            countText.textContent = '추천 ' + (currentCount + 1);
        }

        // 하트 파티클 효과 실행
        createHeartParticles(recommendBtn);
    });
}

function createHeartParticles(button) {
    let particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        let particle = document.createElement('span');

        particle.classList.add('heart_particle');
        particle.textContent = '🧡';

        let randomX = Math.random() * 80 - 40;
        let randomY = Math.random() * -60 - 20;
        let randomRotate = Math.random() * 60 - 30;

        particle.style.setProperty('--x', randomX + 'px');
        particle.style.setProperty('--y', randomY + 'px');
        particle.style.setProperty('--r', randomRotate + 'deg');

        button.appendChild(particle);

        setTimeout(function () {
            particle.remove();
        }, 800);
    }
}