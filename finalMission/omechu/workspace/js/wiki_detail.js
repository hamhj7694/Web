(function() {
    // ================================
    // 1. 기본 설정
    // ================================

    const MAX_VISIBLE_PHOTO_COUNT = 5;
    const MAX_VISIBLE_COMMENT_COUNT = 5;
    const PHOTO_OVERLAY_PAGE_SIZE = 12;
    const DEFAULT_IMAGE = '../assets/food/default.png';

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';
    const LOGIN_USER_NICKNAME = localStorage.getItem('omechu_user_nickname') || '익명';


    // ================================
    // 2. 테스트 데이터
    // ================================

    function makeTestPhotos(imagePath) {
        return [imagePath, imagePath, imagePath, imagePath, imagePath, imagePath];
    }

    function makeTestComments(foodName) {
        return [
            {
                user: '맛잘알',
                text: `${foodName}은 오늘 메뉴로 실패 확률이 낮아요.`,
                date: '2026.06.18',
                timePeriod: '점심',
                tags: ['#추천', '#든든함']
            },
            {
                user: '혼밥러',
                text: '혼자 먹기에도 부담 없는 메뉴예요.',
                date: '2026.06.17',
                timePeriod: '저녁',
                tags: ['#혼밥', '#가성비']
            },
            {
                user: '오메추러버',
                text: `고민될 때 ${foodName} 고르면 꽤 안정적이에요.`,
                date: '2026.06.16',
                timePeriod: '야식',
                tags: ['#안정픽', '#점심']
            },
            {
                user: '든든파',
                text: '양도 괜찮고 든든해서 만족도가 높아요.',
                date: '2026.06.15',
                timePeriod: '점심',
                tags: ['#든든함']
            },
            {
                user: '밥도둑',
                text: '밥이랑 같이 먹으면 진짜 잘 어울려요.',
                date: '2026.06.14',
                timePeriod: '아침',
                tags: ['#밥도둑', '#한식']
            },
            {
                user: '메뉴탐험가',
                text: '오늘 뭐 먹지 고민될 때 추천할 만한 메뉴예요.',
                date: '2026.06.13',
                timePeriod: '저녁',
                tags: ['#오메추', '#추천']
            }
        ];
    }

    const foodList = [
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
    // 3. 현재 음식 찾기
    // ================================

    const foodId = Number(new URLSearchParams(location.search).get('id'));
    const currentFood = foodList.find(function(food) {
        return food.id === foodId;
    });

    if (!currentFood) {
        alert('존재하지 않는 메뉴입니다.');
        location.href = './wiki.html';
        return;
    }


    // ================================
    // 4. DOM 가져오기
    // ================================

    const $ = function(selector) {
        return document.querySelector(selector);
    };

    const el = {
        detailImage: $('#detailImage'),
        foodName: $('#foodName'),
        likeCount: $('#likeCount'),
        hitsCount: $('#hitsCount'),
        tagList: $('#tagList'),
        tagMoreBtn: $('#tagMoreBtn'),
        summaryText: $('#summaryText'),

        likeBtn: $('#likeBtn'),
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
    // 5. 저장 key / 상태값
    // ================================

    const STORAGE = {
        comments: `omechu_food_${foodId}_comments`,
        replies: `omechu_food_${foodId}_replies`,
        photos: `omechu_food_${foodId}_photos`,
        hits: `omechu_wiki_food_${foodId}_hits`,
        myLike: IS_LOGIN && LOGIN_USER_ID
            ? `omechu_wiki_detail_my_like_${foodId}_${LOGIN_USER_ID}`
            : ''
    };

    let addedLikeCount = 0;
    let addedHitsCount = Number(localStorage.getItem(STORAGE.hits)) || 0;

    let hasMyLiked = STORAGE.myLike
        ? localStorage.getItem(STORAGE.myLike) === 'true'
        : false;

    let savedComments = readStorage(STORAGE.comments, []);
    let savedReplies = readStorage(STORAGE.replies, {});
    let savedPhotos = readStorage(STORAGE.photos, []);
    let selectedPhotoData = '';

    let photoOverlayVisibleCount = PHOTO_OVERLAY_PAGE_SIZE;
    let isPhotoOverlayLoading = false;

    const selectedDeleteTags = new Set();

    const timeTagOptions = ['#아침', '#점심', '#저녁', '#야식'];
    const situationTagOptions = ['#혼밥', '#데이트', '#친목', '#회식', '#해장', '#배달'];


    // ================================
    // 6. 공통 유틸
    // ================================

    function readStorage(key, fallbackValue) {
        const data = localStorage.getItem(key);

        if (!data) {
            return fallbackValue;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error(`${key} 데이터를 불러오지 못했습니다.`, error);
            return fallbackValue;
        }
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
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

    function setOverlayOpenState() {
        const isAnyOverlayOpen =
            (el.photoOverlay && !el.photoOverlay.classList.contains('hidden')) ||
            (el.photoViewer && !el.photoViewer.classList.contains('hidden')) ||
            (el.photoAddOverlay && !el.photoAddOverlay.classList.contains('hidden')) ||
            (el.commentOverlay && !el.commentOverlay.classList.contains('hidden')) ||
            (el.tagOverlay && !el.tagOverlay.classList.contains('hidden'));

        document.body.classList.toggle('overlay_open', isAnyOverlayOpen);
    }


    // ================================
    // 7. 초기 렌더링
    // ================================

    function increaseHitCount() {
        addedHitsCount += 1;
        localStorage.setItem(STORAGE.hits, String(addedHitsCount));
    }

    function renderDetail() {
        document.title = `오메추! ${currentFood.name}`;

        el.foodName.textContent = currentFood.name;

        el.detailImage.src = currentFood.image;
        el.detailImage.alt = currentFood.name;
        el.detailImage.onerror = function() {
            el.detailImage.onerror = null;
            el.detailImage.src = DEFAULT_IMAGE;
        };

        el.tagList.innerHTML = currentFood.tags.slice(0, 3).map(function(tag) {
            return `<span>${tag}</span>`;
        }).join('');

        el.summaryText.innerHTML = currentFood.summary.replaceAll('\n', '<br>');

        renderLike();
        renderPhotos();
        renderComments();
    }


    // ================================
    // 8. 추천
    // ================================

    function renderLike() {
        const icon = el.likeBtn.querySelector('.action_icon');
        const text = el.likeBtn.querySelector('span:last-child');

        if (IS_LOGIN && hasMyLiked) {
            el.likeBtn.classList.add('is-liked');
            icon.textContent = '🧡';
            text.textContent = '추천 더하기!';
        } else {
            el.likeBtn.classList.remove('is-liked');
            icon.textContent = '♡';
            text.textContent = '추천하기';
        }

        el.likeCount.textContent = `🧡추천 ${currentFood.likes + addedLikeCount}`;
        el.hitsCount.textContent = `👀조회 ${currentFood.hits + addedHitsCount}`;
    }

    function handleLikeClick() {
        if (!IS_LOGIN || !LOGIN_USER_ID) return;

        if (hasMyLiked) {
            alert('이미 추천한 메뉴예요!');
            return;
        }

        addedLikeCount += 1;

        hasMyLiked = true;
        localStorage.setItem(STORAGE.myLike, 'true');

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

            setTimeout(function() {
                particle.remove();
            }, 800);
        }
    }


    // ================================
    // 9. 사진
    // ================================

    function getDefaultPhotos() {
        return (currentFood.photos || []).map(function(photo, index) {
            return {
                id: `default_photo_${currentFood.id}_${index}`,
                src: photo,
                userId: '',
                user: '오메추',
                isDefault: true
            };
        });
    }

    function getAllPhotos() {
        return [...savedPhotos, ...getDefaultPhotos()];
    }

    function renderPhotos() {
        const photos = getAllPhotos();
        const visiblePhotos = photos.slice(0, MAX_VISIBLE_PHOTO_COUNT);

        el.photoCount.textContent = `사진 ${photos.length}`;
        el.photoMoreBtn.classList.toggle('hidden', photos.length <= MAX_VISIBLE_PHOTO_COUNT);

        el.photoGrid.innerHTML = visiblePhotos.map(makePhotoHTML).join('') + `
            <button type="button" class="photo_add" id="photoAddBtn">
                + 사진 추가
            </button>
        `;
    }

    function makePhotoHTML(photo) {
        const isMyPhoto = photo.userId && photo.userId === LOGIN_USER_ID;

        return `
            <div class="photo_item" data-photo-id="${photo.id}">
                <img
                    src="${photo.src}"
                    alt="${currentFood.name} 사진"
                    decoding="async"
                    onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                >

                ${
                    isMyPhoto
                    ? `<button type="button" class="photo_delete_btn">삭제</button>`
                    : ''
                }
            </div>
        `;
    }

    function openPhotoOverlay() {
        photoOverlayVisibleCount = PHOTO_OVERLAY_PAGE_SIZE;
        isPhotoOverlayLoading = false;

        renderPhotoOverlay();

        el.photoOverlay.classList.remove('hidden');
        el.photoOverlayGrid.scrollTop = 0;

        setOverlayOpenState();
    }

    function closePhotoOverlay() {
        el.photoOverlay.classList.add('hidden');
        setOverlayOpenState();
    }

    function renderPhotoOverlay() {
        const photos = getAllPhotos();
        const visiblePhotos = photos.slice(0, photoOverlayVisibleCount);

        el.photoOverlayCount.textContent = `사진 ${photos.length}`;

        if (photos.length === 0) {
            el.photoOverlayGrid.innerHTML = `
                <div class="photo_overlay_empty">
                    등록된 사진이 없어요.
                </div>
            `;
            return;
        }

        let html = visiblePhotos.map(function(photo) {
            return makePhotoOverlayHTML(photo);
        }).join('');

        if (visiblePhotos.length < photos.length) {
            html += `
                <div class="photo_overlay_loading">
                    아래로 스크롤하면 더 볼 수 있어요
                </div>
            `;
        }

        el.photoOverlayGrid.innerHTML = html;
    }

    function makePhotoOverlayHTML(photo) {
        const isMyPhoto = photo.userId && photo.userId === LOGIN_USER_ID;

        return `
            <div class="photo_overlay_item" data-photo-id="${photo.id}">
                <img
                    src="${photo.src}"
                    alt="${currentFood.name} 사진"
                    decoding="async"
                    onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                >

                ${
                    isMyPhoto
                    ? `<button type="button" class="photo_delete_btn">삭제</button>`
                    : ''
                }
            </div>
        `;
    }

    function loadMoreOverlayPhotos() {
        const photos = getAllPhotos();

        if (photoOverlayVisibleCount >= photos.length || isPhotoOverlayLoading) {
            return;
        }

        isPhotoOverlayLoading = true;

        setTimeout(function() {
            photoOverlayVisibleCount += PHOTO_OVERLAY_PAGE_SIZE;
            renderPhotoOverlay();
            isPhotoOverlayLoading = false;
        }, 250);
    }

    function openPhotoAddOverlay() {
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

        if (el.photoFileInput) el.photoFileInput.value = '';
        if (el.photoFileName) el.photoFileName.textContent = '선택된 사진이 없어요.';
        if (el.photoPreviewImage) el.photoPreviewImage.src = '';
        if (el.photoPreviewBox) el.photoPreviewBox.classList.add('hidden');
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

        reader.addEventListener('load', function(event) {
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

        if (!el.photoOverlay.classList.contains('hidden')) {
            renderPhotoOverlay();
        }

        closePhotoAddOverlay();
    }

    function deletePhoto(photoId) {
        const targetPhoto = savedPhotos.find(function(photo) {
            return photo.id === photoId;
        });

        if (!targetPhoto) {
            alert('삭제할 수 없는 사진이에요.');
            return;
        }

        if (targetPhoto.userId !== LOGIN_USER_ID) {
            alert('내가 등록한 사진만 삭제할 수 있어요.');
            return;
        }

        if (!confirm('이 사진을 삭제할까요?')) return;

        savedPhotos = savedPhotos.filter(function(photo) {
            return photo.id !== photoId;
        });

        saveStorage(STORAGE.photos, savedPhotos);

        renderPhotos();

        if (!el.photoOverlay.classList.contains('hidden')) {
            renderPhotoOverlay();
        }
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
        el.photoViewerImage.alt = '확대 사진';

        setOverlayOpenState();
    }


    // ================================
    // 10. 코멘트 / 의견
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

    function makeCommentTagHTML(comment) {
        const tags = comment.tags || [];

        return tags.map(function(tag) {
            return `<span>${tag}</span>`;
        }).join('');
    }

    function makeCommentDateText(comment) {
        return `${comment.date} · ${comment.timePeriod || currentMealTime()}`;
    }

    function makeCommentHTML(comment, index) {
        const commentId = getCommentId(comment, index);
        const replies = savedReplies[commentId] || [];
        const isMyComment = comment.userId && comment.userId === LOGIN_USER_ID;

        const replyToggleHTML = replies.length > 0
            ? `<button type="button" class="comment_reply_toggle_btn">의견 ${replies.length}개 보기</button>`
            : '';

        const replyHTML = replies.map(function(reply) {
            const isMyReply = reply.userId && reply.userId === LOGIN_USER_ID;

            return `
                <div class="comment_reply_item" data-reply-id="${reply.id}">
                    <div class="comment_reply_top">
                        <span class="comment_reply_user">${reply.user}</span>
                        <span class="comment_reply_date">${reply.date}</span>
                    </div>

                    <p class="comment_reply_text">${reply.text}</p>

                    ${
                        isMyReply
                        ? `<button type="button" class="comment_reply_delete_btn">삭제</button>`
                        : ''
                    }
                </div>
            `;
        }).join('');

        return `
            <div class="comment_item" data-comment-id="${commentId}">
                <div class="comment_top">
                    <span class="comment_user">${comment.user}</span>
                    <span class="comment_date">${makeCommentDateText(comment)}</span>
                </div>

                <p class="comment_text">${comment.text}</p>

                <div class="comment_bottom">
                    <div class="comment_tag_list">
                        ${makeCommentTagHTML(comment)}
                    </div>

                    <div class="comment_btn_group">
                        <button type="button" class="comment_reply_btn">
                            의견 달기
                        </button>

                        ${replyToggleHTML}

                        ${
                            isMyComment
                            ? `<button type="button" class="comment_delete_btn">삭제</button>`
                            : ''
                        }
                    </div>
                </div>

                <div class="comment_reply_box hidden">
                    <textarea 
                        class="comment_reply_input" 
                        placeholder="이 코멘트에 대한 의견을 남겨보세요!"
                    ></textarea>

                    <button type="button" class="comment_reply_submit">
                        의견 등록
                    </button>
                </div>

                <div class="comment_reply_list hidden">
                    ${replyHTML}
                </div>
            </div>
        `;
    }

    function renderComments() {
        const comments = getAllComments();
        const visibleComments = comments.slice(0, MAX_VISIBLE_COMMENT_COUNT);

        el.commentTotal.textContent = `댓글 ${comments.length}`;
        el.commentMoreBtn.classList.toggle('hidden', comments.length <= MAX_VISIBLE_COMMENT_COUNT);

        if (comments.length === 0) {
            el.commentList.innerHTML = `
                <div class="comment_item">
                    <div class="comment_top">
                        <span class="comment_user">오메추</span>
                        <span class="comment_date">방금 전</span>
                    </div>

                    <p class="comment_text">
                        아직 코멘트가 없어요. 첫 코멘트를 남겨보세요!
                    </p>
                </div>
            `;
            return;
        }

        el.commentList.innerHTML = visibleComments.map(makeCommentHTML).join('');
    }

    function renderCommentOverlay() {
        const comments = getAllComments();

        el.commentOverlayCount.textContent = `댓글 ${comments.length}`;

        if (comments.length === 0) {
            el.commentOverlayList.innerHTML = `
                <div class="comment_overlay_empty">
                    아직 코멘트가 없어요.
                </div>
            `;
            return;
        }

        el.commentOverlayList.innerHTML = comments.map(makeCommentHTML).join('');
    }

    function addComment(inputElement) {
        const text = inputElement.value.trim();

        if (text === '') {
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
            tags: ['#새코멘트']
        });

        saveStorage(STORAGE.comments, savedComments);

        inputElement.value = '';

        renderComments();

        if (!el.commentOverlay.classList.contains('hidden')) {
            renderCommentOverlay();
        }
    }

    function addReply(commentId, inputElement) {
        const text = inputElement.value.trim();

        if (text === '') {
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

        if (!el.commentOverlay.classList.contains('hidden')) {
            renderCommentOverlay();
        }
    }

    function deleteComment(commentId) {
        const targetComment = savedComments.find(function(comment) {
            return comment.id === commentId;
        });

        if (!targetComment) {
            alert('삭제할 수 없는 코멘트예요.');
            return;
        }

        if (targetComment.userId !== LOGIN_USER_ID) {
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

        if (!el.commentOverlay.classList.contains('hidden')) {
            renderCommentOverlay();
        }
    }

    function deleteReply(commentId, replyId) {
        const replies = savedReplies[commentId] || [];

        const targetReply = replies.find(function(reply) {
            return reply.id === replyId;
        });

        if (!targetReply) {
            alert('삭제할 수 없는 의견이에요.');
            return;
        }

        if (targetReply.userId !== LOGIN_USER_ID) {
            alert('내가 작성한 의견만 삭제할 수 있어요.');
            return;
        }

        if (!confirm('이 의견을 삭제할까요?')) return;

        savedReplies[commentId] = replies.filter(function(reply) {
            return reply.id !== replyId;
        });

        if (savedReplies[commentId].length === 0) {
            delete savedReplies[commentId];
        }

        saveStorage(STORAGE.replies, savedReplies);

        renderComments();

        if (!el.commentOverlay.classList.contains('hidden')) {
            renderCommentOverlay();
        }
    }

    function handleCommentListClick(event) {
        const commentItem = event.target.closest('.comment_item');

        if (!commentItem) return;

        const commentId = commentItem.dataset.commentId;

        if (event.target.closest('.comment_delete_btn')) {
            deleteComment(commentId);
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
        renderCommentOverlay();

        if (el.commentOverlayInput) el.commentOverlayInput.value = '';
        if (el.commentOverlayTimeSelect) el.commentOverlayTimeSelect.value = '';

        el.commentOverlay.classList.remove('hidden');
        el.commentOverlayList.scrollTop = 0;

        setOverlayOpenState();
    }

    function closeCommentOverlay() {
        el.commentOverlay.classList.add('hidden');
        setOverlayOpenState();
    }


    // ================================
    // 11. 태그
    // ================================

    function groupTags() {
        const tags = currentFood.tags || [];

        return {
            time: tags.filter(function(tag) {
                return timeTagOptions.includes(tag);
            }),
            situation: tags.filter(function(tag) {
                return situationTagOptions.includes(tag);
            }),
            custom: tags.filter(function(tag) {
                return !timeTagOptions.includes(tag) && !situationTagOptions.includes(tag);
            })
        };
    }

    function makeTagOverlayHTML(tags) {
        if (tags.length === 0) {
            return `<p class="tag_overlay_empty">추가된 태그가 없어요.</p>`;
        }

        return tags.map(function(tag) {
            const selectedClass = selectedDeleteTags.has(tag) ? 'is-selected' : '';

            return `
                <button 
                    type="button" 
                    class="tag_delete_chip is-active ${selectedClass}" 
                    data-tag="${tag}"
                >
                    ${tag}
                </button>
            `;
        }).join('');
    }

    function renderTagOverlay() {
        const groups = groupTags();

        el.tagTimeList.innerHTML = makeTagOverlayHTML(groups.time);
        el.tagSituationList.innerHTML = makeTagOverlayHTML(groups.situation);
        el.tagCustomList.innerHTML = makeTagOverlayHTML(groups.custom);
    }

    function openTagOverlay() {
        renderTagOverlay();

        el.tagOverlay.classList.remove('hidden');
        setOverlayOpenState();
    }

    function closeTagOverlay() {
        el.tagOverlay.classList.add('hidden');
        selectedDeleteTags.clear();

        setOverlayOpenState();
    }

    function getCheckedTags(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(function(input) {
                return `#${input.value}`;
            });
    }

    function getCustomTags() {
        const value = el.detailCustomTagsInput.value.trim();

        if (value === '') return [];

        return value
            .split(',')
            .map(function(tag) {
                return tag.trim();
            })
            .filter(Boolean)
            .map(function(tag) {
                return tag.startsWith('#') ? tag : `#${tag}`;
            });
    }

    function resetTagForm() {
        document
            .querySelectorAll('input[name="detailTimeTags"], input[name="detailSituationTags"]')
            .forEach(function(input) {
                input.checked = false;
            });

        el.detailCustomTagsInput.value = '';
    }

    function addTags() {
        const newTags = [
            ...getCheckedTags('detailTimeTags'),
            ...getCheckedTags('detailSituationTags'),
            ...getCustomTags()
        ];

        if (newTags.length === 0) {
            alert('추가할 태그를 선택하거나 입력해주세요!');
            return;
        }

        newTags.forEach(function(tag) {
            if (!currentFood.tags.includes(tag)) {
                currentFood.tags.push(tag);
            }
        });

        resetTagForm();
        renderDetail();
        renderTagOverlay();
    }

    function deleteSelectedTags() {
        if (selectedDeleteTags.size === 0) {
            alert('삭제할 태그를 선택해주세요!');
            return;
        }

        const confirmText = prompt('선택한 태그를 삭제하려면 "삭제"라고 입력해주세요.');

        if (confirmText !== '삭제') {
            alert('삭제가 취소됐어요.');
            return;
        }

        currentFood.tags = currentFood.tags.filter(function(tag) {
            return !selectedDeleteTags.has(tag);
        });

        selectedDeleteTags.clear();

        renderDetail();
        renderTagOverlay();
    }

    function toggleDeleteTag(tag) {
        if (selectedDeleteTags.has(tag)) {
            selectedDeleteTags.delete(tag);
        } else {
            selectedDeleteTags.add(tag);
        }

        renderTagOverlay();
    }


    // ================================
    // 12. 이벤트 연결
    // ================================

    el.likeBtn.addEventListener('click', handleLikeClick);

    el.commentSubmitBtn.addEventListener('click', function() {
        addComment(el.commentInput);
    });

    el.commentInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            addComment(el.commentInput);
        }
    });

    if (el.commentOverlaySubmitBtn && el.commentOverlayInput) {
        el.commentOverlaySubmitBtn.addEventListener('click', function() {
            addComment(el.commentOverlayInput);
        });

        el.commentOverlayInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                addComment(el.commentOverlayInput);
            }
        });
    }

    el.commentList.addEventListener('click', handleCommentListClick);
    el.commentOverlayList.addEventListener('click', handleCommentListClick);

    el.commentMoveBtn.addEventListener('click', function() {
        el.commentSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        setTimeout(function() {
            el.commentInput.focus();
        }, 400);
    });

    el.commentMoreBtn.addEventListener('click', openCommentOverlay);
    el.commentOverlayCloseBtn.addEventListener('click', closeCommentOverlay);
    el.commentOverlayBg.addEventListener('click', closeCommentOverlay);

    el.photoBtn.addEventListener('click', openPhotoAddOverlay);
    el.photoMoreBtn.addEventListener('click', openPhotoOverlay);
    el.photoOverlayCloseBtn.addEventListener('click', closePhotoOverlay);
    el.photoOverlayBg.addEventListener('click', closePhotoOverlay);

    el.photoAddCloseBtn.addEventListener('click', closePhotoAddOverlay);
    el.photoAddOverlayBg.addEventListener('click', closePhotoAddOverlay);

    if (el.photoFileInput) {
        el.photoFileInput.addEventListener('change', handlePhotoFileChange);
    }

    if (el.photoAddSubmitBtn) {
        el.photoAddSubmitBtn.addEventListener('click', submitPhoto);
    }

    el.photoGrid.addEventListener('click', function(event) {
        const addBtn = event.target.closest('#photoAddBtn');

        if (addBtn) {
            openPhotoAddOverlay();
            return;
        }

        const deleteBtn = event.target.closest('.photo_delete_btn');

        if (deleteBtn) {
            const photoItem = deleteBtn.closest('[data-photo-id]');
            deletePhoto(photoItem.dataset.photoId);
            return;
        }

        const image = event.target.closest('img');

        if (image) {
            openPhotoViewer(image.src, image.alt);
        }
    });

    el.photoOverlayGrid.addEventListener('click', function(event) {
        const deleteBtn = event.target.closest('.photo_delete_btn');

        if (deleteBtn) {
            const photoItem = deleteBtn.closest('[data-photo-id]');
            deletePhoto(photoItem.dataset.photoId);
            return;
        }

        const image = event.target.closest('img');

        if (image) {
            openPhotoViewer(image.src, image.alt);
        }
    });

    el.photoOverlayGrid.addEventListener('scroll', function() {
        const isNearBottom =
            el.photoOverlayGrid.scrollTop +
            el.photoOverlayGrid.clientHeight >=
            el.photoOverlayGrid.scrollHeight - 80;

        if (isNearBottom) {
            loadMoreOverlayPhotos();
        }
    });

    el.photoViewerCloseBtn.addEventListener('click', closePhotoViewer);
    el.photoViewerBg.addEventListener('click', closePhotoViewer);

    el.photoViewerImage.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    el.tagMoreBtn.addEventListener('click', openTagOverlay);
    el.tagOverlayCloseBtn.addEventListener('click', closeTagOverlay);
    el.tagOverlayBg.addEventListener('click', closeTagOverlay);
    el.tagAddSubmitBtn.addEventListener('click', addTags);
    el.tagDeleteBtn.addEventListener('click', deleteSelectedTags);

    el.tagOverlay.addEventListener('click', function(event) {
        const tagButton = event.target.closest('.tag_delete_chip');

        if (!tagButton) return;

        toggleDeleteTag(tagButton.dataset.tag);
    });

    el.backBtn.addEventListener('click', function() {
        if (document.referrer) {
            history.back();
            return;
        }

        location.href = './wiki.html';
    });

    el.shareBtn.addEventListener('click', function() {
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
    });

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;

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
    });


    // ================================
    // 13. 실행
    // ================================

    increaseHitCount();
    renderDetail();
})();