(function () {
    // ================================
    // 1. 기본 설정
    // ================================

    const DEFAULT_IMAGE = '../assets/food/default.png';
    const MAX_VISIBLE_PHOTO_COUNT = 5;
    const COMMENT_PAGE_SIZE = 10;
    const PHOTO_OVERLAY_PAGE_SIZE = 12;

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';
    const LOGIN_USER_NICKNAME = localStorage.getItem('omechu_user_nickname') || '익명';

    const $ = function (selector) {
        return document.querySelector(selector);
    };

    const foodId = Number(new URLSearchParams(location.search).get('id')) || 1;


    // ================================
    // 2. 기본 음식 데이터
    // ================================

    function makeTestPhotos(imagePath) {
        return [imagePath, imagePath, imagePath, imagePath, imagePath, imagePath];
    }

    function makeTestComments(foodName) {
        return [
            {
                id: `default_comment_${foodName}_1`,
                userId: '',
                user: '맛잘알',
                text: `${foodName}은 오늘 메뉴로 실패 확률이 낮아요.`,
                date: '2026.06.18',
                timePeriod: '점심',
                tags: ['#추천', '#든든함']
            },
            {
                id: `default_comment_${foodName}_2`,
                userId: '',
                user: '혼밥러',
                text: '혼자 먹기에도 부담 없는 메뉴예요.',
                date: '2026.06.17',
                timePeriod: '저녁',
                tags: ['#혼밥', '#가성비']
            },
            {
                id: `default_comment_${foodName}_3`,
                userId: '',
                user: '오메추러버',
                text: `고민될 때 ${foodName} 고르면 꽤 안정적이에요.`,
                date: '2026.06.16',
                timePeriod: '야식',
                tags: ['#안정픽', '#점심']
            }
        ];
    }

    let foodList = [
        {
            id: 1,
            name: '제육볶음',
            category: '한식',
            image: '../assets/food/jeyuk.png',
            summary: '매콤달콤한 양념! 제육볶음!\n밥 한 공기 뚝딱!',
            tags: ['#한식', '#점심', '#혼밥', '#매운맛'],
            likes: 842,
            hits: 100,
            photos: makeTestPhotos('../assets/food/jeyuk.png'),
            commentList: makeTestComments('제육볶음')
        },
        {
            id: 2,
            name: '김치찌개',
            category: '한식',
            image: '../assets/food/kimchi.png',
            summary: '얼큰한 국물에 밥 한 공기!\n실패 없는 집밥 메뉴!',
            tags: ['#한식', '#국물', '#집밥'],
            likes: 812,
            hits: 100,
            photos: makeTestPhotos('../assets/food/kimchi.png'),
            commentList: makeTestComments('김치찌개')
        },
        {
            id: 3,
            name: '치킨',
            category: '야식',
            image: '../assets/food/chicken.png',
            summary: '바삭한 치킨 한 마리!\n야식 고민 끝!',
            tags: ['#야식', '#배달', '#주말'],
            likes: 1052,
            hits: 100,
            photos: makeTestPhotos('../assets/food/chicken.png'),
            commentList: makeTestComments('치킨')
        },
        {
            id: 4,
            name: '짜장면',
            category: '중식',
            image: '../assets/food/jajang.png',
            summary: '달달하고 고소한 짜장면!\n탕수육까지 있으면 완벽!',
            tags: ['#중식', '#배달', '#가성비'],
            likes: 765,
            hits: 100,
            photos: makeTestPhotos('../assets/food/jajang.png'),
            commentList: makeTestComments('짜장면')
        },
        {
            id: 5,
            name: '마라탕',
            category: '중식',
            image: '../assets/food/maratang.png',
            summary: '얼얼하고 매콤한 마라탕!\n재료 고르는 재미까지!',
            tags: ['#중식', '#매운맛', '#친구랑'],
            likes: 998,
            hits: 100,
            photos: makeTestPhotos('../assets/food/maratang.png'),
            commentList: makeTestComments('마라탕')
        },
        {
            id: 6,
            name: '초밥',
            category: '일식',
            image: '../assets/food/sushi.png',
            summary: '깔끔하고 산뜻한 초밥!\n특별한 한 끼로 추천!',
            tags: ['#일식', '#데이트', '#깔끔'],
            likes: 691,
            hits: 100,
            photos: makeTestPhotos('../assets/food/sushi.png'),
            commentList: makeTestComments('초밥')
        },
        {
            id: 7,
            name: '파스타',
            category: '양식',
            image: '../assets/food/pasta.png',
            summary: '부드럽고 고소한 파스타!\n기분 내고 싶은 날 딱!',
            tags: ['#양식', '#데이트', '#저녁'],
            likes: 634,
            hits: 100,
            photos: makeTestPhotos('../assets/food/pasta.png'),
            commentList: makeTestComments('파스타')
        },
        {
            id: 8,
            name: '떡볶이',
            category: '분식',
            image: '../assets/food/tteokbokki.png',
            summary: '매콤달콤 떡볶이!\n간식도 식사도 가능!',
            tags: ['#분식', '#매콤', '#간식'],
            likes: 913,
            hits: 100,
            photos: makeTestPhotos('../assets/food/tteokbokki.png'),
            commentList: makeTestComments('떡볶이')
        },
        {
            id: 9,
            name: '라면',
            category: '분식',
            image: '../assets/food/ramen.png',
            summary: '간단하지만 강력한 라면!\n혼밥 메뉴로 최고!',
            tags: ['#분식', '#혼밥', '#간단'],
            likes: 720,
            hits: 100,
            photos: makeTestPhotos('../assets/food/ramen.png'),
            commentList: makeTestComments('라면')
        },
        {
            id: 10,
            name: '샐러드',
            category: '기타',
            image: '../assets/food/salad.png',
            summary: '가볍고 산뜻한 샐러드!\n부담 없는 한 끼!',
            tags: ['#기타', '#가벼움', '#건강'],
            likes: 356,
            hits: 100,
            photos: makeTestPhotos('../assets/food/salad.png'),
            commentList: makeTestComments('샐러드')
        },
        {
            id: 11,
            name: '돈까스',
            category: '일식',
            image: '../assets/food/donkatsu.png',
            summary: '바삭한 튀김과 든든함!\n점심 메뉴로 안정적!',
            tags: ['#일식', '#점심', '#든든함'],
            likes: 678,
            hits: 100,
            photos: makeTestPhotos('../assets/food/donkatsu.png'),
            commentList: makeTestComments('돈까스')
        },
        {
            id: 12,
            name: '피자',
            category: '양식',
            image: '../assets/food/pizza.png',
            summary: '여럿이 나눠 먹기 좋은 피자!\n친구랑 먹기 딱!',
            tags: ['#양식', '#배달', '#친구랑'],
            likes: 884,
            hits: 100,
            photos: makeTestPhotos('../assets/food/pizza.png'),
            commentList: makeTestComments('피자')
        }
    ];


    // ================================
    // 3. 저장/불러오기 유틸
    // ================================

    function readStorage(key, fallbackValue) {
        const savedData = localStorage.getItem(key);

        if (!savedData) return fallbackValue;

        try {
            return JSON.parse(savedData);
        } catch (error) {
            console.error(`${key} 불러오기 실패`, error);
            return fallbackValue;
        }
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function readNumber(key) {
        return Number(localStorage.getItem(key)) || 0;
    }

    function saveNumber(key, value) {
        localStorage.setItem(key, String(value));
    }

    function todayText() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');

        return `${year}.${month}.${date}`;
    }

    function currentMealTime() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 11) return '아침';
        if (hour >= 11 && hour < 16) return '점심';
        if (hour >= 16 && hour < 21) return '저녁';

        return '야식';
    }

    function selectedMealTime(inputElement) {
        if (inputElement === el.commentOverlayInput && el.commentOverlayTimeSelect) {
            return el.commentOverlayTimeSelect.value || currentMealTime();
        }

        if (inputElement === el.commentInput && el.commentTimeSelect) {
            return el.commentTimeSelect.value || currentMealTime();
        }

        return currentMealTime();
    }

    function escapeHTML(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function makeTag(value) {
        const cleanValue = String(value || '').trim();

        if (!cleanValue) return '';

        return cleanValue.startsWith('#') ? cleanValue : `#${cleanValue}`;
    }

    function getCustomFoodList() {
        return readStorage('omechu_wiki_custom_foods', []);
    }

    foodList = [
        ...getCustomFoodList(),
        ...foodList
    ];

    const currentFood = foodList.find(function (food) {
        return food.id === foodId;
    });

    if (!currentFood) {
        alert('존재하지 않는 메뉴입니다.');
        location.href = './wiki.html';
        return;
    }


    // ================================
    // 4. DOM
    // ================================

    const el = {
        detailImage: $('#detailImage'),
        foodName: $('#foodName'),
        likeCount: $('#likeCount'),
        hitsCount: $('#hitsCount'),
        tagList: $('#tagList'),
        tagMoreBtn: $('#tagMoreBtn'),

        likeBtn: $('#likeBtn'),
        myBtn: $('#myBtn'),
        photoBtn: $('#photoBtn'),
        commentMoveBtn: $('#commentMoveBtn'),

        photoGrid: $('#photoGrid'),
        photoCount: $('#photoCount'),
        photoMoreBtn: $('#photoMoreBtn'),

        commentSection: $('#commentSection'),
        commentInput: $('#commentInput'),
        commentSubmitBtn: $('#commentSubmitBtn'),
        commentList: $('#commentList'),
        commentTotal: $('#commentTotal'),
        commentMoreBtn: $('#commentMoreBtn'),
        commentTimeSelect: $('#commentTimeSelect'),

        backBtn: $('#backBtn'),
        shareBtn: $('#shareBtn'),

        photoOverlay: $('#photoOverlay'),
        photoOverlayBg: $('#photoOverlayBg'),
        photoOverlayCloseBtn: $('#photoOverlayCloseBtn'),
        photoOverlayGrid: $('#photoOverlayGrid'),
        photoOverlayCount: $('#photoOverlayCount'),

        photoViewer: $('#photoViewer'),
        photoViewerBg: $('#photoViewerBg'),
        photoViewerCloseBtn: $('#photoViewerCloseBtn'),
        photoViewerImage: $('#photoViewerImage'),

        photoAddOverlay: $('#photoAddOverlay'),
        photoAddOverlayBg: $('#photoAddOverlayBg'),
        photoAddCloseBtn: $('#photoAddCloseBtn'),
        photoFileInput: $('#photoFileInput'),
        photoFileName: $('#photoFileName'),
        photoPreviewBox: $('#photoPreviewBox'),
        photoPreviewImage: $('#photoPreviewImage'),
        photoAddSubmitBtn: $('#photoAddSubmitBtn'),

        commentOverlay: $('#commentOverlay'),
        commentOverlayBg: $('#commentOverlayBg'),
        commentOverlayCloseBtn: $('#commentOverlayCloseBtn'),
        commentOverlayList: $('#commentOverlayList'),
        commentOverlayCount: $('#commentOverlayCount'),
        commentOverlayInput: $('#commentOverlayInput'),
        commentOverlaySubmitBtn: $('#commentOverlaySubmitBtn'),
        commentOverlayTimeSelect: $('#commentOverlayTimeSelect'),

        tagOverlay: $('#tagOverlay'),
        tagOverlayBg: $('#tagOverlayBg'),
        tagOverlayCloseBtn: $('#tagOverlayCloseBtn'),
        tagTimeList: $('#tagTimeList'),
        tagSituationList: $('#tagSituationList'),
        tagCustomList: $('#tagCustomList'),
        detailCustomTagsInput: $('#detailCustomTagsInput'),
        tagAddSubmitBtn: $('#tagAddSubmitBtn'),
        tagDeleteBtn: $('#tagDeleteBtn')
    };


    // ================================
    // 5. 상태값
    // ================================

    const CUSTOM_FOOD_STORAGE_KEY = 'omechu_wiki_custom_foods';

    const STORAGE = {
        comments: `omechu_food_${foodId}_comments`,
        replies: `omechu_food_${foodId}_replies`,
        photos: `omechu_food_${foodId}_photos`,
        customTags: `omechu_food_${foodId}_tags`,
        myTags: IS_LOGIN && LOGIN_USER_ID
            ? `omechu_food_${foodId}_my_tags_${LOGIN_USER_ID}`
            : '',
        hits: `omechu_wiki_food_${foodId}_hits`,
        totalLike: `omechu_wiki_food_${foodId}_like_count`,
        myLike: IS_LOGIN && LOGIN_USER_ID
            ? `omechu_wiki_food_${foodId}_my_like_count_${LOGIN_USER_ID}`
            : ''
    };

    let addedLikeCount = readNumber(STORAGE.totalLike);
    let myLikeCount = STORAGE.myLike ? readNumber(STORAGE.myLike) : 0;
    let addedHitsCount = readNumber(STORAGE.hits);

    let savedComments = readStorage(STORAGE.comments, []);
    let savedReplies = readStorage(STORAGE.replies, {});
    let savedPhotos = readStorage(STORAGE.photos, []);
    let savedCustomTags = readStorage(STORAGE.customTags, []);
    let savedMyTags = STORAGE.myTags ? readStorage(STORAGE.myTags, []) : [];

    let selectedPhotoData = '';
    let photoOverlayVisibleCount = PHOTO_OVERLAY_PAGE_SIZE;

    let currentCommentPage = 1;
    let currentOverlayCommentPage = 1;

    const selectedTagSet = new Set();
    const selectedMyTagSet = new Set();

    const timeTagOptions = ['#아침', '#점심', '#저녁', '#야식'];
    const situationTagOptions = ['#혼밥', '#데이트', '#친목', '#회식', '#해장', '#배달'];

    currentFood.tags = Array.from(new Set([
        ...(currentFood.tags || []),
        ...savedCustomTags
    ]));


    // ================================
    // 6. 공통 렌더
    // ================================

    function setOverlayOpenState() {
        const myOverlay = $('#myOverlay');

        const isOpen =
            (el.photoOverlay && !el.photoOverlay.classList.contains('hidden')) ||
            (el.photoViewer && !el.photoViewer.classList.contains('hidden')) ||
            (el.photoAddOverlay && !el.photoAddOverlay.classList.contains('hidden')) ||
            (el.commentOverlay && !el.commentOverlay.classList.contains('hidden')) ||
            (el.tagOverlay && !el.tagOverlay.classList.contains('hidden')) ||
            (myOverlay && !myOverlay.classList.contains('hidden'));

        document.body.classList.toggle('overlay_open', isOpen);
    }

    function renderDetail() {
        document.title = `오메추! ${currentFood.name}`;

        el.foodName.textContent = currentFood.name;

        el.detailImage.src = currentFood.image || DEFAULT_IMAGE;
        el.detailImage.alt = currentFood.name;
        el.detailImage.onerror = function () {
            el.detailImage.onerror = null;
            el.detailImage.src = DEFAULT_IMAGE;
        };

        el.tagList.innerHTML = currentFood.tags.slice(0, 3).map(function (tag) {
            return `<span>${escapeHTML(tag)}</span>`;
        }).join('');

        renderLike();
        renderPhotos();
        renderComments();
    }


    // ================================
    // 7. 추천
    // ================================

    function renderLike() {
        const icon = el.likeBtn.querySelector('.action_icon');
        const text = el.likeBtn.querySelector('span:last-child');
        const totalLike = currentFood.likes + addedLikeCount;

        if (IS_LOGIN && myLikeCount > 0) {
            el.likeBtn.classList.add('is-liked');
            icon.textContent = '🧡';
            text.textContent = '추천 더하기!';
        } else {
            el.likeBtn.classList.remove('is-liked');
            icon.textContent = '♡';
            text.textContent = '추천하기';
        }

        el.likeCount.textContent = IS_LOGIN
            ? `🧡추천 ${totalLike} / 내 추천 ${myLikeCount}`
            : `🧡추천 ${totalLike}`;

        el.hitsCount.textContent = `| 👀조회 ${currentFood.hits + addedHitsCount}`;
    }

    function handleLikeClick() {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('추천은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        addedLikeCount += 1;
        myLikeCount += 1;

        saveNumber(STORAGE.totalLike, addedLikeCount);
        saveNumber(STORAGE.myLike, myLikeCount);

        renderLike();
        createHeartParticles(el.likeBtn);
    }

    function createHeartParticles(target) {
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('span');

            particle.className = 'heart_particle';
            particle.textContent = '🧡';

            particle.style.setProperty('--x', `${Math.random() * 80 - 40}px`);
            particle.style.setProperty('--y', `${Math.random() * -60 - 20}px`);
            particle.style.setProperty('--r', `${Math.random() * 60 - 30}deg`);

            target.appendChild(particle);

            setTimeout(function () {
                particle.remove();
            }, 800);
        }
    }


    // ================================
    // 8. 사진
    // ================================

    function normalizeFoodPhoto(photo, index) {
        if (typeof photo === 'object' && photo !== null) {
            return {
                id: photo.id || `custom_photo_${currentFood.id}_${index}`,
                src: photo.src || DEFAULT_IMAGE,
                userId: photo.userId || '',
                user: photo.user || '익명',
                date: photo.date || '',
                isDefault: false,
                source: 'customFood'
            };
        }

        return {
            id: `default_photo_${currentFood.id}_${index}`,
            src: photo || DEFAULT_IMAGE,
            userId: '',
            user: '오메추',
            date: '',
            isDefault: true,
            source: 'default'
        };
    }

    function getDefaultPhotos() {
        return (currentFood.photos || []).map(normalizeFoodPhoto);
    }
    
    function getAllPhotos() {
        return [...savedPhotos, ...getDefaultPhotos()];
    }

    function makePhotoHTML(photo) {
        const isMine = photo.userId === LOGIN_USER_ID && photo.userId !== '';

        return `
            <div class="photo_item" data-photo-id="${escapeHTML(photo.id)}">
                <img
                    src="${photo.src}"
                    alt="${escapeHTML(currentFood.name)} 사진"
                    decoding="async"
                    onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                >

                ${
                    isMine
                    ? `<button type="button" class="photo_delete_btn">삭제</button>`
                    : ''
                }
            </div>
        `;
    }

    function renderPhotos() {
        const photos = getAllPhotos();
        const visiblePhotos = photos.slice(0, MAX_VISIBLE_PHOTO_COUNT);

        el.photoCount.textContent = `${photos.length}개`;
        el.photoMoreBtn.classList.toggle('hidden', photos.length <= MAX_VISIBLE_PHOTO_COUNT);

        el.photoGrid.innerHTML = visiblePhotos.map(makePhotoHTML).join('') + `
            <button type="button" class="photo_add" id="photoAddBtn">
                + 사진 추가
            </button>
        `;
    }

    function renderPhotoOverlay() {
        const photos = getAllPhotos();
        const visiblePhotos = photos.slice(0, photoOverlayVisibleCount);

        el.photoOverlayCount.textContent = `사진 ${photos.length}`;

        if (photos.length === 0) {
            el.photoOverlayGrid.innerHTML = `
                <div class="photo_overlay_empty">등록된 사진이 없어요.</div>
            `;
            return;
        }

        let html = visiblePhotos.map(function (photo) {
            return `
                <div class="photo_overlay_item" data-photo-id="${escapeHTML(photo.id)}">
                    <img
                        src="${photo.src}"
                        alt="${escapeHTML(currentFood.name)} 사진"
                        decoding="async"
                        onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                    >

                    ${
                        photo.userId === LOGIN_USER_ID && photo.userId !== ''
                        ? `<button type="button" class="photo_delete_btn">삭제</button>`
                        : ''
                    }
                </div>
            `;
        }).join('');

        if (visiblePhotos.length < photos.length) {
            html += `<div class="photo_overlay_loading">아래로 스크롤하면 더 볼 수 있어요</div>`;
        }

        el.photoOverlayGrid.innerHTML = html;
    }

    function openPhotoOverlay() {
        photoOverlayVisibleCount = PHOTO_OVERLAY_PAGE_SIZE;
        renderPhotoOverlay();

        el.photoOverlay.classList.remove('hidden');
        el.photoOverlayGrid.scrollTop = 0;
        setOverlayOpenState();
    }

    function closePhotoOverlay() {
        el.photoOverlay.classList.add('hidden');
        setOverlayOpenState();
    }

    function loadMorePhotos() {
        const photos = getAllPhotos();

        if (photoOverlayVisibleCount >= photos.length) return;

        photoOverlayVisibleCount += PHOTO_OVERLAY_PAGE_SIZE;
        renderPhotoOverlay();
    }

    function openPhotoAddOverlay() {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('사진 추가는 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        el.photoAddOverlay.classList.remove('hidden');
        setOverlayOpenState();
    }

    function closePhotoAddOverlay() {
        el.photoAddOverlay.classList.add('hidden');
        resetPhotoAddForm();
        setOverlayOpenState();
    }

    function resetPhotoAddForm() {
        selectedPhotoData = '';

        el.photoFileInput.value = '';
        el.photoFileName.textContent = '선택된 사진이 없어요.';
        el.photoPreviewImage.src = '';
        el.photoPreviewBox.classList.add('hidden');
    }

    function handlePhotoFileChange() {
        const file = el.photoFileInput.files[0];

        if (!file) {
            resetPhotoAddForm();
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 등록할 수 있어요!');
            resetPhotoAddForm();
            return;
        }

        el.photoFileName.textContent = file.name;

        const reader = new FileReader();

        reader.addEventListener('load', function (event) {
            selectedPhotoData = event.target.result;
            el.photoPreviewImage.src = selectedPhotoData;
            el.photoPreviewBox.classList.remove('hidden');
        });

        reader.readAsDataURL(file);
    }

    function submitPhoto() {
        if (!selectedPhotoData) {
            alert('추가할 사진을 선택해주세요!');
            return;
        }

        savedPhotos.unshift({
            id: `user_photo_${Date.now()}`,
            src: selectedPhotoData,
            userId: LOGIN_USER_ID,
            user: LOGIN_USER_NICKNAME,
            date: todayText()
        });

        saveStorage(STORAGE.photos, savedPhotos);

        renderPhotos();
        renderPhotoOverlay();
        renderMyOverlayIfOpen();
        closePhotoAddOverlay();
    }

    function saveCurrentCustomFood() {
        const customFoodList = readStorage(CUSTOM_FOOD_STORAGE_KEY, []);

        const targetFood = customFoodList.find(function(food) {
            return Number(food.id) === Number(currentFood.id);
        });

        if (!targetFood) return false;

        targetFood.image = currentFood.image || DEFAULT_IMAGE;
        targetFood.photos = currentFood.photos || [];
        targetFood.commentList = currentFood.commentList || [];
        targetFood.tags = currentFood.tags || [];
        targetFood.summary = currentFood.summary || targetFood.summary || '';
        targetFood.description = currentFood.summary || targetFood.description || '';
        targetFood.comments = (currentFood.commentList || []).length + savedComments.length;

        saveStorage(CUSTOM_FOOD_STORAGE_KEY, customFoodList);

        return true;
    }

    function editPhoto(photoId) {
        let targetPhoto = savedPhotos.find(function(photo) {
            return photo.id === photoId;
        });

        let photoSource = 'savedPhotos';
        let beforeSrc = targetPhoto ? targetPhoto.src : '';

        if (!targetPhoto) {
            targetPhoto = (currentFood.photos || []).find(function(photo, index) {
                if (typeof photo !== 'object' || photo === null) return false;

                const id = photo.id || `custom_photo_${currentFood.id}_${index}`;

                return id === photoId;
            });

            photoSource = 'customFood';
            beforeSrc = targetPhoto ? targetPhoto.src : '';
        }

        if (!targetPhoto || targetPhoto.userId !== LOGIN_USER_ID) {
            alert('내가 등록한 사진만 수정할 수 있어요.');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', function() {
            const file = input.files[0];

            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 등록할 수 있어요!');
                return;
            }

            const reader = new FileReader();

            reader.addEventListener('load', function(event) {
                const nextSrc = event.target.result;

                targetPhoto.src = nextSrc;
                targetPhoto.date = todayText();

                if (photoSource === 'savedPhotos') {
                    saveStorage(STORAGE.photos, savedPhotos);
                }

                if (photoSource === 'customFood') {
                    if (currentFood.image === beforeSrc) {
                        currentFood.image = nextSrc;
                    }

                    saveCurrentCustomFood();
                }

                renderDetail();
                renderPhotoOverlay();
                renderMyOverlayIfOpen();
            });

            reader.readAsDataURL(file);
        });

        input.click();
    }

    function deletePhoto(photoId) {
        const savedPhoto = savedPhotos.find(function(photo) {
            return photo.id === photoId;
        });

        if (savedPhoto) {
            if (savedPhoto.userId !== LOGIN_USER_ID) {
                alert('내가 등록한 사진만 삭제할 수 있어요.');
                return;
            }

            if (!confirm('이 사진을 삭제할까요?')) return;

            savedPhotos = savedPhotos.filter(function(photo) {
                return photo.id !== photoId;
            });

            saveStorage(STORAGE.photos, savedPhotos);

            renderPhotos();
            renderPhotoOverlay();
            renderMyOverlayIfOpen();
            return;
        }

        const customPhoto = (currentFood.photos || []).find(function(photo, index) {
            if (typeof photo !== 'object' || photo === null) return false;

            const id = photo.id || `custom_photo_${currentFood.id}_${index}`;

            return id === photoId;
        });

        if (!customPhoto) {
            alert('삭제할 수 없는 사진이에요.');
            return;
        }

        if (customPhoto.userId !== LOGIN_USER_ID) {
            alert('내가 등록한 사진만 삭제할 수 있어요.');
            return;
        }

        if (!confirm('이 사진을 삭제할까요?')) return;

        currentFood.photos = (currentFood.photos || []).filter(function(photo, index) {
            if (typeof photo !== 'object' || photo === null) return true;

            const id = photo.id || `custom_photo_${currentFood.id}_${index}`;

            return id !== photoId;
        });

        if (currentFood.image === customPhoto.src) {
            const nextPhoto = (currentFood.photos || [])[0];

            if (typeof nextPhoto === 'object' && nextPhoto !== null) {
                currentFood.image = nextPhoto.src || DEFAULT_IMAGE;
            } else {
                currentFood.image = nextPhoto || DEFAULT_IMAGE;
            }
        }

        saveCurrentCustomFood();

        renderDetail();
        renderPhotoOverlay();
        renderMyOverlayIfOpen();
    }

    function openPhotoViewer(src, alt) {
        el.photoViewerImage.src = src;
        el.photoViewerImage.alt = alt || '확대 사진';

        el.photoViewer.classList.remove('hidden');
        setOverlayOpenState();
    }

    function closePhotoViewer() {
        el.photoViewer.classList.add('hidden');
        el.photoViewerImage.src = '';
        setOverlayOpenState();
    }


    // ================================
    // 9. 코멘트 / 의견
    // ================================

    function getDefaultComments() {
        return currentFood.commentList || [];
    }

    function getAllComments() {
        return [...savedComments, ...getDefaultComments()];
    }

    function getCommentId(comment, index) {
        return comment.id || `default_comment_${currentFood.id}_${index}`;
    }

    function getCommentById(commentId) {
        const allComments = getAllComments();

        for (let i = 0; i < allComments.length; i++) {
            const comment = allComments[i];
            const id = getCommentId(comment, i);

            if (id === commentId) return comment;
        }

        return null;
    }

    function makeCommentDateText(comment) {
        return `${comment.date || ''}${comment.timePeriod ? ' · ' + comment.timePeriod : ''}`;
    }

    function makeCommentTagHTML(comment) {
        return (comment.tags || []).map(function (tag) {
            return `<span>${escapeHTML(tag)}</span>`;
        }).join('');
    }

    function makeCommentHTML(comment, index) {
        const commentId = getCommentId(comment, index);
        const replies = savedReplies[commentId] || [];
        const isMyComment = comment.userId === LOGIN_USER_ID && comment.userId !== '';

        const repliesHTML = replies.map(function (reply) {
            const isMyReply = reply.userId === LOGIN_USER_ID && reply.userId !== '';

            return `
                <div class="comment_reply_item" data-reply-id="${escapeHTML(reply.id)}">
                    <div class="comment_reply_top">
                        <span class="comment_reply_user">${escapeHTML(reply.user)}</span>
                        <span class="comment_reply_date">${escapeHTML(reply.date)}</span>
                    </div>

                    <p class="comment_reply_text">${escapeHTML(reply.text)}</p>

                    ${
                        isMyReply
                        ? `
                            <div class="comment_reply_btn_group">
                                <button type="button" class="comment_reply_edit_btn">수정</button>
                                <button type="button" class="comment_reply_delete_btn">삭제</button>
                            </div>
                        `
                        : ''
                    }
                </div>
            `;
        }).join('');

        return `
            <div class="comment_item" data-comment-id="${escapeHTML(commentId)}">
                <div class="comment_top">
                    <span class="comment_user">${escapeHTML(comment.user)}</span>
                    <span class="comment_date">${escapeHTML(makeCommentDateText(comment))}</span>
                </div>

                <p class="comment_text">${escapeHTML(comment.text)}</p>

                <div class="comment_bottom">
                    <div class="comment_tag_list">
                        ${makeCommentTagHTML(comment)}
                    </div>

                    <div class="comment_btn_group">
                        <button type="button" class="comment_reply_btn">의견 달기</button>

                        ${
                            replies.length > 0
                            ? `<button type="button" class="comment_reply_toggle_btn">의견 ${replies.length}개 보기</button>`
                            : ''
                        }

                        ${
                            isMyComment
                            ? `
                                <button type="button" class="comment_edit_btn">수정</button>
                                <button type="button" class="comment_delete_btn">삭제</button>
                            `
                            : ''
                        }
                    </div>
                </div>

                <div class="comment_reply_box hidden">
                    <textarea class="comment_reply_input" placeholder="이 코멘트에 대한 의견을 남겨보세요!"></textarea>
                    <button type="button" class="comment_reply_submit">의견 등록</button>
                </div>

                <div class="comment_reply_list hidden">
                    ${repliesHTML}
                </div>
            </div>
        `;
    }

    function createCommentPaginationIfNeeded() {
        if (!document.querySelector('#commentPagination')) {
            el.commentList.insertAdjacentHTML('afterend', `
                <div id="commentPagination" class="comment_pagination"></div>
            `);
        }

        if (!document.querySelector('#commentOverlayPagination')) {
            el.commentOverlayList.insertAdjacentHTML('afterend', `
                <div id="commentOverlayPagination" class="comment_pagination comment_overlay_pagination"></div>
            `);
        }
    }

    function getTotalCommentPage(totalCount) {
        return Math.max(1, Math.ceil(totalCount / COMMENT_PAGE_SIZE));
    }

    function makeCommentPaginationHTML(currentPage, totalPage, type) {
        if (totalPage <= 1) return '';

        let html = '';

        html += `
            <button 
                type="button" 
                class="comment_page_btn" 
                data-comment-page="${currentPage - 1}" 
                data-comment-page-type="${type}"
                ${currentPage === 1 ? 'disabled' : ''}
            >
                이전
            </button>
        `;

        for (let i = 1; i <= totalPage; i++) {
            html += `
                <button 
                    type="button" 
                    class="comment_page_btn ${currentPage === i ? 'active' : ''}" 
                    data-comment-page="${i}" 
                    data-comment-page-type="${type}"
                >
                    ${i}
                </button>
            `;
        }

        html += `
            <button 
                type="button" 
                class="comment_page_btn" 
                data-comment-page="${currentPage + 1}" 
                data-comment-page-type="${type}"
                ${currentPage === totalPage ? 'disabled' : ''}
            >
                다음
            </button>
        `;

        return html;
    }

    function renderComments() {
        createCommentPaginationIfNeeded();

        const comments = getAllComments();
        const totalPage = getTotalCommentPage(comments.length);

        if (currentCommentPage > totalPage) {
            currentCommentPage = totalPage;
        }

        const startIndex = (currentCommentPage - 1) * COMMENT_PAGE_SIZE;
        const endIndex = startIndex + COMMENT_PAGE_SIZE;
        const visibleComments = comments.slice(startIndex, endIndex);

        el.commentTotal.textContent = `${comments.length}개`;

        // 이제 더보기 버튼 대신 페이지네이션 사용
        if (el.commentMoreBtn) {
            el.commentMoreBtn.classList.add('hidden');
        }

        if (comments.length === 0) {
            el.commentList.innerHTML = `
                <div class="comment_item">
                    <p class="comment_text">아직 코멘트가 없어요. 첫 코멘트를 남겨보세요!</p>
                </div>
            `;

            document.querySelector('#commentPagination').innerHTML = '';
            return;
        }

        el.commentList.innerHTML = visibleComments.map(makeCommentHTML).join('');

        document.querySelector('#commentPagination').innerHTML =
            makeCommentPaginationHTML(currentCommentPage, totalPage, 'main');
    }

    function renderCommentOverlay() {
        createCommentPaginationIfNeeded();

        const comments = getAllComments();
        const totalPage = getTotalCommentPage(comments.length);

        if (currentOverlayCommentPage > totalPage) {
            currentOverlayCommentPage = totalPage;
        }

        const startIndex = (currentOverlayCommentPage - 1) * COMMENT_PAGE_SIZE;
        const endIndex = startIndex + COMMENT_PAGE_SIZE;
        const visibleComments = comments.slice(startIndex, endIndex);

        el.commentOverlayCount.textContent = `댓글 ${comments.length}`;

        if (comments.length === 0) {
            el.commentOverlayList.innerHTML = `
                <div class="comment_overlay_empty">아직 코멘트가 없어요.</div>
            `;

            document.querySelector('#commentOverlayPagination').innerHTML = '';
            return;
        }

        el.commentOverlayList.innerHTML = visibleComments.map(makeCommentHTML).join('');

        document.querySelector('#commentOverlayPagination').innerHTML =
            makeCommentPaginationHTML(currentOverlayCommentPage, totalPage, 'overlay');
    }

    function addComment(inputElement) {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('코멘트 작성은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        const text = inputElement.value.trim();

        if (!text) {
            alert('코멘트를 입력해주세요!');
            return;
        }

        savedComments.unshift({
            id: `user_comment_${Date.now()}`,
            userId: LOGIN_USER_ID,
            user: LOGIN_USER_NICKNAME,
            text: text,
            date: todayText(),
            timePeriod: selectedMealTime(inputElement),
            tags: []
        });

        saveStorage(STORAGE.comments, savedComments);

        inputElement.value = '';

        currentCommentPage = 1;
        currentOverlayCommentPage = 1;

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function editComment(commentId) {
        let targetComment = savedComments.find(function(comment) {
            return comment.id === commentId;
        });

        let commentSource = 'storage';

        if (!targetComment) {
            targetComment = (currentFood.commentList || []).find(function(comment) {
                return comment.id === commentId;
            });

            commentSource = 'customFood';
        }

        if (!targetComment || targetComment.userId !== LOGIN_USER_ID) {
            alert('내가 작성한 코멘트만 수정할 수 있어요.');
            return;
        }

        const nextText = prompt('코멘트를 수정해주세요.', targetComment.text);

        if (nextText === null) return;

        const cleanText = nextText.trim();

        if (!cleanText) {
            alert('빈 내용으로 수정할 수 없어요.');
            return;
        }

        targetComment.text = cleanText;

        if (commentSource === 'storage') {
            saveStorage(STORAGE.comments, savedComments);
        }

        if (commentSource === 'customFood') {
            saveCurrentCustomFood();
        }

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function deleteComment(commentId) {
        const savedComment = savedComments.find(function(comment) {
            return comment.id === commentId;
        });

        if (savedComment) {
            if (savedComment.userId !== LOGIN_USER_ID) {
                alert('내가 작성한 코멘트만 삭제할 수 있어요.');
                return;
            }

            if (!confirm('이 코멘트를 삭제할까요?')) return;

            savedComments = savedComments.filter(function(comment) {
                return comment.id !== commentId;
            });

            delete savedReplies[commentId];

            saveStorage(STORAGE.comments, savedComments);
            saveStorage(STORAGE.replies, savedReplies);

            renderComments();
            renderCommentOverlay();
            renderMyOverlayIfOpen();
            return;
        }

        const customComment = (currentFood.commentList || []).find(function(comment) {
            return comment.id === commentId;
        });

        if (!customComment) {
            alert('삭제할 수 없는 코멘트예요.');
            return;
        }

        if (customComment.userId !== LOGIN_USER_ID) {
            alert('내가 작성한 코멘트만 삭제할 수 있어요.');
            return;
        }

        if (!confirm('이 코멘트를 삭제할까요?')) return;

        currentFood.commentList = (currentFood.commentList || []).filter(function(comment) {
            return comment.id !== commentId;
        });

        delete savedReplies[commentId];

        saveCurrentCustomFood();
        saveStorage(STORAGE.replies, savedReplies);

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function addReply(commentId, inputElement) {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('의견 작성은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        const text = inputElement.value.trim();

        if (!text) {
            alert('의견을 입력해주세요!');
            return;
        }

        if (!savedReplies[commentId]) {
            savedReplies[commentId] = [];
        }

        savedReplies[commentId].unshift({
            id: `user_reply_${Date.now()}`,
            userId: LOGIN_USER_ID,
            user: LOGIN_USER_NICKNAME,
            text: text,
            date: todayText()
        });

        saveStorage(STORAGE.replies, savedReplies);

        inputElement.value = '';

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function editReply(commentId, replyId) {
        const replies = savedReplies[commentId] || [];
        const targetReply = replies.find(function (reply) {
            return reply.id === replyId;
        });

        if (!targetReply || targetReply.userId !== LOGIN_USER_ID) return;

        const nextText = prompt('의견을 수정해주세요.', targetReply.text);

        if (nextText === null) return;

        const cleanText = nextText.trim();

        if (!cleanText) {
            alert('빈 내용으로 수정할 수 없어요.');
            return;
        }

        targetReply.text = cleanText;

        saveStorage(STORAGE.replies, savedReplies);

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function deleteReply(commentId, replyId) {
        const replies = savedReplies[commentId] || [];
        const targetReply = replies.find(function (reply) {
            return reply.id === replyId;
        });

        if (!targetReply || targetReply.userId !== LOGIN_USER_ID) {
            alert('내가 작성한 의견만 삭제할 수 있어요.');
            return;
        }

        if (!confirm('이 의견을 삭제할까요?')) return;

        savedReplies[commentId] = replies.filter(function (reply) {
            return reply.id !== replyId;
        });

        if (savedReplies[commentId].length === 0) {
            delete savedReplies[commentId];
        }

        saveStorage(STORAGE.replies, savedReplies);

        renderComments();
        renderCommentOverlay();
        renderMyOverlayIfOpen();
    }

    function handleCommentClick(event) {
        const commentItem = event.target.closest('.comment_item');

        if (!commentItem) return;

        const commentId = commentItem.dataset.commentId;

        if (event.target.closest('.comment_edit_btn')) {
            editComment(commentId);
            return;
        }

        if (event.target.closest('.comment_delete_btn')) {
            deleteComment(commentId);
            return;
        }

        if (event.target.closest('.comment_reply_edit_btn')) {
            const replyItem = event.target.closest('.comment_reply_item');
            editReply(commentId, replyItem.dataset.replyId);
            return;
        }

        if (event.target.closest('.comment_reply_delete_btn')) {
            const replyItem = event.target.closest('.comment_reply_item');
            deleteReply(commentId, replyItem.dataset.replyId);
            return;
        }

        if (event.target.closest('.comment_reply_toggle_btn')) {
            const replyList = commentItem.querySelector('.comment_reply_list');
            const toggleBtn = event.target.closest('.comment_reply_toggle_btn');
            const count = replyList.querySelectorAll('.comment_reply_item').length;

            replyList.classList.toggle('hidden');

            toggleBtn.textContent = replyList.classList.contains('hidden')
                ? `의견 ${count}개 보기`
                : '의견 접기';

            return;
        }

        if (event.target.closest('.comment_reply_btn')) {
            const replyBox = commentItem.querySelector('.comment_reply_box');
            const replyInput = commentItem.querySelector('.comment_reply_input');

            replyBox.classList.toggle('hidden');

            if (!replyBox.classList.contains('hidden')) {
                replyInput.focus();
            }

            return;
        }

        if (event.target.closest('.comment_reply_submit')) {
            const replyInput = commentItem.querySelector('.comment_reply_input');
            addReply(commentId, replyInput);
        }
    }

    function openCommentOverlay() {
        currentOverlayCommentPage = 1;
        
        renderCommentOverlay();

        el.commentOverlayInput.value = '';
        el.commentOverlayTimeSelect.value = '';

        el.commentOverlay.classList.remove('hidden');
        el.commentOverlayList.scrollTop = 0;
        setOverlayOpenState();
    }

    function closeCommentOverlay() {
        el.commentOverlay.classList.add('hidden');
        setOverlayOpenState();
    }


    // ================================
    // 10. 태그
    // ================================

    function groupTags() {
        const tags = currentFood.tags || [];

        return {
            time: tags.filter(function (tag) {
                return timeTagOptions.includes(tag);
            }),
            situation: tags.filter(function (tag) {
                return situationTagOptions.includes(tag);
            }),
            custom: tags.filter(function (tag) {
                return !timeTagOptions.includes(tag) && !situationTagOptions.includes(tag);
            })
        };
    }

    function makeTagButtonHTML(tag) {
        const selectedClass = selectedTagSet.has(tag) ? 'is-selected' : '';

        return `
            <button 
                type="button" 
                class="tag_delete_chip is-active ${selectedClass}" 
                data-tag="${escapeHTML(tag)}"
            >
                ${escapeHTML(tag)}
            </button>
        `;
    }

    function renderTagOverlay() {
        const groups = groupTags();

        el.tagTimeList.innerHTML = groups.time.length
            ? groups.time.map(makeTagButtonHTML).join('')
            : `<p class="tag_overlay_empty">추가된 태그가 없어요.</p>`;

        el.tagSituationList.innerHTML = groups.situation.length
            ? groups.situation.map(makeTagButtonHTML).join('')
            : `<p class="tag_overlay_empty">추가된 태그가 없어요.</p>`;

        el.tagCustomList.innerHTML = groups.custom.length
            ? groups.custom.map(makeTagButtonHTML).join('')
            : `<p class="tag_overlay_empty">추가된 태그가 없어요.</p>`;
    }

    function openTagOverlay() {
        selectedTagSet.clear();
        renderTagOverlay();

        el.tagOverlay.classList.remove('hidden');
        setOverlayOpenState();
    }

    function closeTagOverlay() {
        selectedTagSet.clear();
        el.tagOverlay.classList.add('hidden');
        setOverlayOpenState();
    }

    function getCheckedTags(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(function (input) {
                return makeTag(input.value);
            })
            .filter(Boolean);
    }

    function getCustomTags() {
        const value = el.detailCustomTagsInput.value.trim();

        if (!value) return [];

        return value.split(',')
            .map(function (tag) {
                return makeTag(tag);
            })
            .filter(Boolean);
    }

    function resetTagForm() {
        document
            .querySelectorAll('input[name="detailTimeTags"], input[name="detailSituationTags"]')
            .forEach(function (input) {
                input.checked = false;
            });

        el.detailCustomTagsInput.value = '';
    }

    function addTags() {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('태그 추가는 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        const newTags = [
            ...getCheckedTags('detailTimeTags'),
            ...getCheckedTags('detailSituationTags'),
            ...getCustomTags()
        ];

        if (newTags.length === 0) {
            alert('추가할 태그를 선택하거나 입력해주세요!');
            return;
        }

        const actuallyAddedTags = [];

        newTags.forEach(function (tag) {
            if (!currentFood.tags.includes(tag)) {
                currentFood.tags.push(tag);
                actuallyAddedTags.push(tag);
            }
        });

        if (actuallyAddedTags.length > 0) {
            savedCustomTags = Array.from(new Set([
                ...savedCustomTags,
                ...actuallyAddedTags
            ]));

            savedMyTags = Array.from(new Set([
                ...savedMyTags,
                ...actuallyAddedTags
            ]));

            saveStorage(STORAGE.customTags, savedCustomTags);

            if (STORAGE.myTags) {
                saveStorage(STORAGE.myTags, savedMyTags);
            }
        }

        resetTagForm();
        renderDetail();
        renderTagOverlay();
        renderMyOverlayIfOpen();
    }

    function toggleTagSelection(tag) {
        if (selectedTagSet.has(tag)) {
            selectedTagSet.delete(tag);
        } else {
            selectedTagSet.add(tag);
        }

        renderTagOverlay();
    }

    function deleteSelectedTags() {
        if (selectedTagSet.size === 0) {
            alert('삭제할 태그를 선택해주세요!');
            return;
        }

        if (!confirm('선택한 태그를 삭제할까요?')) return;

        const deleteTags = Array.from(selectedTagSet);

        currentFood.tags = currentFood.tags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        savedCustomTags = savedCustomTags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        savedMyTags = savedMyTags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        saveStorage(STORAGE.customTags, savedCustomTags);

        if (STORAGE.myTags) {
            saveStorage(STORAGE.myTags, savedMyTags);
        }

        selectedTagSet.clear();

        renderDetail();
        renderTagOverlay();
        renderMyOverlayIfOpen();
    }


    // ================================
    // 11. 내 작성 정보 모아보기
    // ================================

    function createMyOverlayIfNeeded() {
        if ($('#myOverlay')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="my_overlay hidden" id="myOverlay">
                <div class="my_overlay_bg" id="myOverlayBg"></div>

                <div class="my_overlay_panel">
                    <div class="my_overlay_header">
                        <h2>내가 남긴 ${escapeHTML(currentFood.name)} 정보</h2>
                        <button type="button" class="my_overlay_close_btn" id="myOverlayCloseBtn">X</button>
                    </div>

                    <div class="my_overlay_content" id="myOverlayContent"></div>
                </div>
            </div>
        `);

        $('#myOverlayBg').addEventListener('click', closeMyOverlay);
        $('#myOverlayCloseBtn').addEventListener('click', closeMyOverlay);
        $('#myOverlayContent').addEventListener('click', handleMyOverlayClick);
    }

    function getMyComments() {
        return getAllComments().filter(function(comment) {
            return comment.userId === LOGIN_USER_ID;
        });
    }

    function getMyReplies() {
        const comments = getAllComments();
        const commentMap = {};

        comments.forEach(function (comment, index) {
            const id = getCommentId(comment, index);
            commentMap[id] = comment;
        });

        const result = [];

        Object.keys(savedReplies).forEach(function (commentId) {
            const replies = savedReplies[commentId] || [];

            replies.forEach(function (reply) {
                if (reply.userId !== LOGIN_USER_ID) return;

                result.push({
                    ...reply,
                    parentCommentId: commentId,
                    parentComment: commentMap[commentId] || null
                });
            });
        });

        return result;
    }

    function getMyPhotos() {
        const customFoodPhotos = (currentFood.photos || [])
            .map(function(photo, index) {
                if (typeof photo !== 'object' || photo === null) return null;

                return {
                    id: photo.id || `custom_photo_${currentFood.id}_${index}`,
                    src: photo.src || DEFAULT_IMAGE,
                    userId: photo.userId || '',
                    user: photo.user || '익명',
                    date: photo.date || '',
                    source: 'customFood'
                };
            })
            .filter(function(photo) {
                return photo && photo.userId === LOGIN_USER_ID;
            });

        const detailPhotos = savedPhotos.filter(function(photo) {
            return photo.userId === LOGIN_USER_ID;
        });

        return [
            ...detailPhotos,
            ...customFoodPhotos
        ];
    }

    function makeMyCommentHTML(comment) {
        return `
            <div class="my_activity_item" data-comment-id="${escapeHTML(comment.id)}">
                <div class="my_activity_top">
                    <strong>내 코멘트</strong>
                    <span>${escapeHTML(comment.date)} · ${escapeHTML(comment.timePeriod || '')}</span>
                </div>

                <p>${escapeHTML(comment.text)}</p>

                <div class="my_activity_btn_group">
                    <button type="button" class="my_edit_btn" data-action="edit-comment">수정</button>
                    <button type="button" class="my_delete_btn" data-action="delete-comment">삭제</button>
                </div>
            </div>
        `;
    }

    function makeMyReplyHTML(reply) {
        const parent = reply.parentComment;

        return `
            <div 
                class="my_activity_item my_reply_activity_item" 
                data-comment-id="${escapeHTML(reply.parentCommentId)}"
                data-reply-id="${escapeHTML(reply.id)}"
            >
                <div class="my_parent_comment_box">
                    <div class="my_activity_top">
                        <strong>${parent && parent.userId === LOGIN_USER_ID ? '내 코멘트' : '다른 사람 코멘트'}</strong>
                        <span>
                            ${parent ? escapeHTML(parent.date || '') : ''}
                            ${parent && parent.timePeriod ? ' · ' + escapeHTML(parent.timePeriod) : ''}
                        </span>
                    </div>

                    <div class="my_parent_comment_meta">
                        <span>${parent ? escapeHTML(parent.user || '익명') : '알 수 없음'}</span>
                    </div>

                    <p>${parent ? escapeHTML(parent.text) : '삭제되었거나 찾을 수 없는 코멘트'}</p>

                    <div class="my_activity_tags">
                        ${
                            parent && parent.tags
                            ? parent.tags.map(function (tag) {
                                return `<span>${escapeHTML(tag)}</span>`;
                            }).join('')
                            : ''
                        }
                    </div>
                </div>

                <div class="my_reply_box">
                    <div class="my_activity_top">
                        <strong>내 의견</strong>
                        <span>${escapeHTML(reply.date)}</span>
                    </div>

                    <p>${escapeHTML(reply.text)}</p>

                    <div class="my_activity_btn_group">
                        <button type="button" class="my_edit_btn" data-action="edit-reply">수정</button>
                        <button type="button" class="my_delete_btn" data-action="delete-reply">삭제</button>
                    </div>
                </div>
            </div>
        `;
    }

    function makeMyPhotoHTML(photo) {
        return `
            <div class="my_photo_item" data-photo-id="${escapeHTML(photo.id)}">
                <img
                    src="${photo.src}"
                    alt="${escapeHTML(currentFood.name)} 내가 등록한 사진"
                    onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                >

                <p>${escapeHTML(photo.date)}</p>

                <div class="my_activity_btn_group">
                    <button type="button" class="my_edit_btn" data-action="edit-photo">수정</button>
                    <button type="button" class="my_delete_btn" data-action="delete-photo">삭제</button>
                </div>
            </div>
        `;
    }

    function makeMyTagHTML(tag) {
        const selectedClass = selectedMyTagSet.has(tag) ? 'is-selected' : '';

        return `
            <button 
                type="button" 
                class="my_tag_chip ${selectedClass}" 
                data-tag="${escapeHTML(tag)}"
            >
                ${escapeHTML(tag)}
            </button>
        `;
    }

    function renderMyOverlay() {
        createMyOverlayIfNeeded();

        const myTags = savedMyTags;
        const myComments = getMyComments();
        const myReplies = getMyReplies();
        const myPhotos = getMyPhotos();

        $('#myOverlayContent').innerHTML = `
            <section class="my_activity_section">
                <div class="my_section_title_row">
                    <h3>내 태그 ${myTags.length}</h3>

                    ${
                        myTags.length > 0
                        ? `<button type="button" class="my_selected_delete_btn" data-action="delete-my-tags">선택 삭제</button>`
                        : ''
                    }
                </div>

                ${
                    myTags.length > 0
                    ? `<div class="my_tag_list">${myTags.map(makeMyTagHTML).join('')}</div>`
                    : `<p class="my_activity_empty_text">추가한 태그가 없어요.</p>`
                }
            </section>

            <section class="my_activity_section">
                <h3>내 코멘트 ${myComments.length}</h3>

                ${
                    myComments.length > 0
                    ? myComments.map(makeMyCommentHTML).join('')
                    : `<p class="my_activity_empty_text">작성한 코멘트가 없어요.</p>`
                }
            </section>

            <section class="my_activity_section">
                <h3>내 의견 ${myReplies.length}</h3>

                ${
                    myReplies.length > 0
                    ? myReplies.map(makeMyReplyHTML).join('')
                    : `<p class="my_activity_empty_text">작성한 의견이 없어요.</p>`
                }
            </section>

            <section class="my_activity_section">
                <h3>내 사진 ${myPhotos.length}</h3>

                ${
                    myPhotos.length > 0
                    ? `<div class="my_photo_grid">${myPhotos.map(makeMyPhotoHTML).join('')}</div>`
                    : `<p class="my_activity_empty_text">등록한 사진이 없어요.</p>`
                }
            </section>
        `;
    }

    function renderMyOverlayIfOpen() {
        const overlay = $('#myOverlay');

        if (overlay && !overlay.classList.contains('hidden')) {
            renderMyOverlay();
        }
    }

    function openMyOverlay() {
        if (!IS_LOGIN || !LOGIN_USER_ID) {
            alert('로그인이 필요한 기능이에요!');
            location.href = './login/login.html';
            return;
        }

        renderMyOverlay();

        $('#myOverlay').classList.remove('hidden');
        setOverlayOpenState();
    }

    function closeMyOverlay() {
        const overlay = $('#myOverlay');

        if (!overlay) return;

        overlay.classList.add('hidden');
        setOverlayOpenState();
    }

    function toggleMyTag(tag) {
        if (selectedMyTagSet.has(tag)) {
            selectedMyTagSet.delete(tag);
        } else {
            selectedMyTagSet.add(tag);
        }

        renderMyOverlay();
    }

    function deleteSelectedMyTags() {
        if (selectedMyTagSet.size === 0) {
            alert('삭제할 태그를 선택해주세요!');
            return;
        }

        if (!confirm('선택한 태그를 삭제할까요?')) return;

        const deleteTags = Array.from(selectedMyTagSet);

        currentFood.tags = currentFood.tags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        savedCustomTags = savedCustomTags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        savedMyTags = savedMyTags.filter(function (tag) {
            return !deleteTags.includes(tag);
        });

        saveStorage(STORAGE.customTags, savedCustomTags);

        if (STORAGE.myTags) {
            saveStorage(STORAGE.myTags, savedMyTags);
        }

        selectedMyTagSet.clear();

        renderDetail();
        renderTagOverlay();
        renderMyOverlay();
    }

    function handleMyOverlayClick(event) {
        const tagChip = event.target.closest('.my_tag_chip');

        if (tagChip) {
            toggleMyTag(tagChip.dataset.tag);
            return;
        }

        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const action = button.dataset.action;
        const activityItem = button.closest('.my_activity_item');
        const photoItem = button.closest('.my_photo_item');

        if (action === 'delete-my-tags') {
            deleteSelectedMyTags();
            return;
        }

        if (action === 'edit-comment') {
            editComment(activityItem.dataset.commentId);
            return;
        }

        if (action === 'delete-comment') {
            deleteComment(activityItem.dataset.commentId);
            return;
        }

        if (action === 'edit-reply') {
            editReply(activityItem.dataset.commentId, activityItem.dataset.replyId);
            return;
        }

        if (action === 'delete-reply') {
            deleteReply(activityItem.dataset.commentId, activityItem.dataset.replyId);
            return;
        }

        if (action === 'edit-photo') {
            editPhoto(photoItem.dataset.photoId);
            return;
        }

        if (action === 'delete-photo') {
            deletePhoto(photoItem.dataset.photoId);
        }
    }


    // ================================
    // 12. 이벤트 연결
    // ================================

    function connectEvents() {
        el.likeBtn.addEventListener('click', handleLikeClick);

        el.myBtn.addEventListener('click', openMyOverlay);

        el.commentSubmitBtn.addEventListener('click', function () {
            addComment(el.commentInput);
        });

        el.commentInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                addComment(el.commentInput);
            }
        });

        el.commentList.addEventListener('click', handleCommentClick);
        el.commentOverlayList.addEventListener('click', handleCommentClick);

        el.commentMoveBtn.addEventListener('click', function () {
            el.commentSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            setTimeout(function () {
                el.commentInput.focus();
            }, 400);
        });

        el.commentMoreBtn.addEventListener('click', openCommentOverlay);
        el.commentOverlayCloseBtn.addEventListener('click', closeCommentOverlay);
        el.commentOverlayBg.addEventListener('click', closeCommentOverlay);

        el.commentOverlaySubmitBtn.addEventListener('click', function () {
            addComment(el.commentOverlayInput);
        });

        el.commentOverlayInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                addComment(el.commentOverlayInput);
            }
        });

        el.photoBtn.addEventListener('click', openPhotoAddOverlay);
        el.photoMoreBtn.addEventListener('click', openPhotoOverlay);
        el.photoOverlayCloseBtn.addEventListener('click', closePhotoOverlay);
        el.photoOverlayBg.addEventListener('click', closePhotoOverlay);

        el.photoFileInput.addEventListener('change', handlePhotoFileChange);
        el.photoAddSubmitBtn.addEventListener('click', submitPhoto);
        el.photoAddCloseBtn.addEventListener('click', closePhotoAddOverlay);
        el.photoAddOverlayBg.addEventListener('click', closePhotoAddOverlay);

        el.photoGrid.addEventListener('click', handlePhotoGridClick);
        el.photoOverlayGrid.addEventListener('click', handlePhotoGridClick);
        el.photoOverlayGrid.addEventListener('scroll', handlePhotoOverlayScroll);

        el.photoViewerCloseBtn.addEventListener('click', closePhotoViewer);
        el.photoViewerBg.addEventListener('click', closePhotoViewer);
        el.photoViewerImage.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        el.tagMoreBtn.addEventListener('click', openTagOverlay);
        el.tagOverlayCloseBtn.addEventListener('click', closeTagOverlay);
        el.tagOverlayBg.addEventListener('click', closeTagOverlay);
        el.tagAddSubmitBtn.addEventListener('click', addTags);
        el.tagDeleteBtn.addEventListener('click', deleteSelectedTags);

        el.tagOverlay.addEventListener('click', function (event) {
            const tagButton = event.target.closest('.tag_delete_chip');

            if (!tagButton) return;

            toggleTagSelection(tagButton.dataset.tag);
        });

        el.backBtn.addEventListener('click', function () {
            if (document.referrer) {
                history.back();
                return;
            }

            location.href = './wiki.html';
        });

        el.shareBtn.addEventListener('click', shareCurrentPage);

        document.addEventListener('keydown', handleEscape);

        document.addEventListener('click', function(event) {
            const pageButton = event.target.closest('.comment_page_btn');

            if (!pageButton || pageButton.disabled) return;

            const pageType = pageButton.dataset.commentPageType;
            const nextPage = Number(pageButton.dataset.commentPage);

            if (pageType === 'main') {
                currentCommentPage = nextPage;
                renderComments();

                el.commentList.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                return;
            }

            if (pageType === 'overlay') {
                currentOverlayCommentPage = nextPage;
                renderCommentOverlay();

                el.commentOverlayList.scrollTop = 0;
            }
        });
    }

    function handlePhotoGridClick(event) {
        const addButton = event.target.closest('#photoAddBtn');

        if (addButton) {
            openPhotoAddOverlay();
            return;
        }

        const deleteButton = event.target.closest('.photo_delete_btn');

        if (deleteButton) {
            const photoItem = deleteButton.closest('[data-photo-id]');
            deletePhoto(photoItem.dataset.photoId);
            return;
        }

        const image = event.target.closest('img');

        if (image) {
            openPhotoViewer(image.src, image.alt);
        }
    }

    function handlePhotoOverlayScroll() {
        const isNearBottom =
            el.photoOverlayGrid.scrollTop +
            el.photoOverlayGrid.clientHeight >=
            el.photoOverlayGrid.scrollHeight - 80;

        if (isNearBottom) {
            loadMorePhotos();
        }
    }

    function shareCurrentPage() {
        const currentUrl = location.href;

        if (navigator.share) {
            navigator.share({
                title: `오메추! ${currentFood.name}`,
                text: `${currentFood.name} 메뉴를 확인해보세요!`,
                url: currentUrl
            });

            return;
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(currentUrl);
            alert('링크가 복사됐어요!');
            return;
        }

        alert(currentUrl);
    }

    function handleEscape(event) {
        if (event.key !== 'Escape') return;

        const myOverlay = $('#myOverlay');

        if (myOverlay && !myOverlay.classList.contains('hidden')) {
            closeMyOverlay();
            return;
        }

        if (!el.photoViewer.classList.contains('hidden')) {
            closePhotoViewer();
            return;
        }

        if (!el.commentOverlay.classList.contains('hidden')) {
            closeCommentOverlay();
            return;
        }

        if (!el.photoAddOverlay.classList.contains('hidden')) {
            closePhotoAddOverlay();
            return;
        }

        if (!el.photoOverlay.classList.contains('hidden')) {
            closePhotoOverlay();
            return;
        }

        if (!el.tagOverlay.classList.contains('hidden')) {
            closeTagOverlay();
        }
    }


    // ================================
    // 13. 실행
    // ================================

    function init() {
        addedHitsCount += 1;
        saveNumber(STORAGE.hits, addedHitsCount);

        renderDetail();
        connectEvents();
    }

    init();
})();