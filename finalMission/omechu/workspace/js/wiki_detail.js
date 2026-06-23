(async function () {
    // ================================
    // 1. 기본 설정
    // ================================

    const DEFAULT_IMAGE = '../assets/home/char_main.png';
    const WIKI_DETAIL_API_URL = '../backend/api/wiki/detail.php';
    const WIKI_LIKE_API_URL = '../backend/api/wiki/like.php';

    const COMMENT_LIST_API_URL = '../backend/api/wiki/comment_list.php';
    const COMMENT_ADD_API_URL = '../backend/api/wiki/comment_add.php';
    const COMMENT_DELETE_API_URL = '../backend/api/wiki/comment_delete.php';

    const COMMENT_EDIT_API_URL = '../backend/api/wiki/comment_edit.php';
    const REPLY_ADD_API_URL = '../backend/api/wiki/reply_add.php';
    const REPLY_EDIT_API_URL = '../backend/api/wiki/reply_edit.php';
    const REPLY_DELETE_API_URL = '../backend/api/wiki/reply_delete.php';

    const PHOTO_LIST_API_URL = '../backend/api/wiki/photo_list.php';
    const PHOTO_ADD_API_URL = '../backend/api/wiki/photo_add.php';
    const PHOTO_DELETE_API_URL = '../backend/api/wiki/photo_delete.php';

    const TAG_UPDATE_API_URL = '../backend/api/wiki/tag_update.php';

    const MAX_VISIBLE_PHOTO_COUNT = 5;
    const COMMENT_PAGE_SIZE = 10;
    const PHOTO_OVERLAY_PAGE_SIZE = 12;

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_NO = localStorage.getItem('omechu_user_no') || '';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';
    const LOGIN_USER_NICKNAME = localStorage.getItem('omechu_user_nickname') || '익명';
    const IS_ADMIN = localStorage.getItem('omechu_is_admin') === 'true';
    
    const $ = function (selector) {
        return document.querySelector(selector);
    };

    const foodId = Number(new URLSearchParams(location.search).get('id')) || 1;

    // ================================
    // 2. DB 음식 상세 불러오기
    // ================================

    let currentFood = null;

    function normalizeFoodFromDB(food) {
        return {
            id: Number(food.id),
            name: food.name || '이름 없는 음식',
            category: food.category || '기타',
            image: food.image || DEFAULT_IMAGE,
            summary:
                food.summary ||
                food.description ||
                '오늘 메뉴로 괜찮은 선택이에요.',
            description:
                food.description ||
                food.summary ||
                '',
            tags: Array.isArray(food.tags) ? food.tags : [],
            situations: Array.isArray(food.situations) ? food.situations : [],
            times: Array.isArray(food.times) ? food.times : [],
            likes: Number(food.likes || 0),
            myLikeCount: Number(food.myLikeCount || 0),
            hits: Number(food.hits || 0),
            photos: [],
            commentList: [],
            comments: Number(food.comments || 0),
            photosCount: Number(food.photos || 0),
            createdBy: Number(food.createdBy || 0),
            createdAt: food.createdAt || '',
            isMine: food.isMine === true
        };
    }

    async function loadCurrentFoodFromDB() {
        try {
            const response = await fetch(`${WIKI_DETAIL_API_URL}?id=${foodId}`, {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();

            if (!data.success || !data.food) {
                alert(data.message || '존재하지 않는 메뉴입니다.');
                location.href = './wiki.html';
                return null;
            }

            return normalizeFoodFromDB(data.food);

        } catch (error) {
            console.error('음식 상세 불러오기 실패:', error);
            alert('음식 상세 정보를 불러오지 못했어요.');
            location.href = './wiki.html';
            return null;
        }
    }

    currentFood = await loadCurrentFoodFromDB();

    if (!currentFood) {
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

    let myLikeCount = Number(currentFood.myLikeCount || 0);

    let savedComments = [];
    let savedReplies = {};
    let savedPhotos = [];

    let selectedPhotoData = '';
    let selectedPhotoFile = null;
    let photoOverlayVisibleCount = PHOTO_OVERLAY_PAGE_SIZE;

    let currentCommentPage = 1;
    let currentOverlayCommentPage = 1;

    const selectedTagSet = new Set();

    const timeTagOptions = ['#아침', '#점심', '#저녁', '#야식'];
    const situationTagOptions = ['#혼밥', '#데이트', '#친목', '#회식', '#해장', '#배달'];

    currentFood.tags = Array.from(new Set(currentFood.tags || []));

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

        if (!cleanValue) {
            return '';
        }

        return cleanValue.startsWith('#') ? cleanValue : `#${cleanValue}`;
    }

    function isMyData(data) {
        if (!IS_LOGIN || !LOGIN_USER_NO || !data) {
            return false;
        }

        if (data.isMine === true) {
            return true;
        }

        if (data.userNo && String(data.userNo) === String(LOGIN_USER_NO)) {
            return true;
        }

        if (data.userId && String(data.userId) === String(LOGIN_USER_ID)) {
            return true;
        }

        return false;
    }

    function canManageData(data) {
        return IS_ADMIN || isMyData(data);
    }

    function selectedMealTime(inputElement) {
        if (!inputElement) {
            return '';
        }

        if (inputElement === el.commentOverlayInput && el.commentOverlayTimeSelect) {
            return el.commentOverlayTimeSelect.value || '';
        }

        if (el.commentTimeSelect) {
            return el.commentTimeSelect.value || '';
        }

        return '';
    }
    
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
        const totalLike = Number(currentFood.likes || 0);

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

        el.hitsCount.textContent = `| 👀조회 ${Number(currentFood.hits || 0)}`;
    }

    function handleLikeClick() {
        if (!IS_LOGIN || !LOGIN_USER_NO) {
            alert('추천은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        el.likeBtn.disabled = true;

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
                myLikeCount = currentFood.myLikeCount;

                renderLike();
                createHeartParticles(el.likeBtn);
            })
            .catch(function(error) {
                console.error('추천 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            })
            .finally(function() {
                el.likeBtn.disabled = false;
            });
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

    function normalizePhotoFromDB(photo) {
        return {
            id: String(photo.id),
            src: photo.src || photo.image || DEFAULT_IMAGE,
            userNo: String(photo.userNo || ''),
            userId: photo.userId || '',
            user: photo.user || '익명',
            date: photo.date || photo.createdAt || '',
            isDefault: false,
            source: 'db',
            isMine: photo.isMine === true
        };
    }

    function loadPhotosFromDB() {
        return fetch(`${PHOTO_LIST_API_URL}?food_id=${foodId}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '사진 목록을 불러오지 못했어요.');
                    savedPhotos = [];
                    return;
                }

                savedPhotos = Array.isArray(data.photos)
                    ? data.photos.map(normalizePhotoFromDB)
                    : [];

                if (currentFood) {
                    currentFood.photos = savedPhotos;
                    currentFood.image = savedPhotos[0] && savedPhotos[0].src
                        ? savedPhotos[0].src
                        : currentFood.image;
                }
            })
            .catch(function(error) {
                console.error('사진 목록 불러오기 실패:', error);
                savedPhotos = [];
            });
    }

    function refreshPhotosFromDB() {
        return loadPhotosFromDB().then(function() {
            renderPhotos();
            renderPhotoOverlay();
            renderMyOverlayIfOpen();
        });
    }

    function normalizeFoodPhoto(photo, index) {
        if (typeof photo === 'object' && photo !== null) {
            return {
                id: photo.id || `custom_photo_${currentFood.id}_${index}`,
                src: photo.src || DEFAULT_IMAGE,
                userNo: photo.userNo || '',
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
        return [];
    }

    function getAllPhotos() {
        return savedPhotos;
    }

    function makePhotoHTML(photo) {
        const canManage = canManageData(photo);

        return `
            <div class="photo_item" data-photo-id="${escapeHTML(photo.id)}">
                <img
                    src="${photo.src}"
                    alt="${escapeHTML(currentFood.name)} 사진"
                    decoding="async"
                    onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                >

                ${
                    canManageData(photo)
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
                        isMyData(photo)
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
        if (!IS_LOGIN || !LOGIN_USER_NO) {
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
        selectedPhotoFile = null;

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

        selectedPhotoFile = file;

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
        if (!IS_LOGIN || !LOGIN_USER_NO) {
            alert('사진 추가는 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        if (!selectedPhotoFile) {
            alert('추가할 사진을 선택해주세요!');
            return;
        }

        const formData = new FormData();

        formData.append('food_id', currentFood.id);
        formData.append('image', selectedPhotoFile);

        el.photoAddSubmitBtn.disabled = true;
        el.photoAddSubmitBtn.textContent = '등록 중...';

        fetch(PHOTO_ADD_API_URL, {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '사진 등록에 실패했어요.');
                    return;
                }

                if (data.thumbnail) {
                    currentFood.image = data.thumbnail;
                    el.detailImage.src = data.thumbnail;
                }

                resetPhotoAddForm();
                closePhotoAddOverlay();

                refreshPhotosFromDB();
            })
            .catch(function(error) {
                console.error('사진 등록 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            })
            .finally(function() {
                el.photoAddSubmitBtn.disabled = false;
                el.photoAddSubmitBtn.textContent = '사진 등록';
            });
    }

    function deletePhoto(photoId) {
        const targetPhoto = savedPhotos.find(function(photo) {
            return String(photo.id) === String(photoId);
        });

        if (!targetPhoto) {
            alert('삭제할 사진을 찾을 수 없어요.');
            return;
        }

        if (!canManageData(targetPhoto)) {
            alert('삭제 권한이 없어요.');
            return;
        }

        if (!confirm('이 사진을 삭제할까요?')) {
            return;
        }

        fetch(PHOTO_DELETE_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photo_id: photoId
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '사진 삭제에 실패했어요.');
                    return;
                }

                currentFood.image = data.thumbnail || DEFAULT_IMAGE;
                el.detailImage.src = currentFood.image;

                refreshPhotosFromDB();
            })
            .catch(function(error) {
                console.error('사진 삭제 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
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
        return [];
    }

    function getAllComments() {
        return savedComments;
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
        const canManageComment = canManageData(comment);

        const repliesHTML = replies.map(function (reply) {
            const canManageReply = canManageData(reply);

            return `
                <div class="comment_reply_item" data-reply-id="${escapeHTML(reply.id)}">
                    <div class="comment_reply_top">
                        <span class="comment_reply_user">${escapeHTML(reply.user)}</span>
                        <span class="comment_reply_date">${escapeHTML(reply.date)}</span>
                    </div>

                    <p class="comment_reply_text">${escapeHTML(reply.text)}</p>

                    ${
                        isMyData(reply) || canManageData(reply)
                        ? `
                            <div class="comment_reply_btn_group">
                                ${
                                    isMyData(reply)
                                    ? `<button type="button" class="comment_reply_edit_btn">수정</button>`
                                    : ''
                                }

                                ${
                                    canManageData(reply)
                                    ? `<button type="button" class="comment_reply_delete_btn">삭제</button>`
                                    : ''
                                }
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
                            isMyData(comment)
                            ? `<button type="button" class="comment_edit_btn">수정</button>`
                            : ''
                        }

                        ${
                            canManageData(comment)
                            ? `<button type="button" class="comment_delete_btn">삭제</button>`
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
        if (!IS_LOGIN || !LOGIN_USER_NO) {
            alert('코멘트 작성은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        const text = inputElement.value.trim();

        if (!text) {
            alert('코멘트를 입력해주세요!');
            return;
        }

        const mealTime = selectedMealTime(inputElement);

        const submitData = {
            food_id: foodId,
            content: text,
            meal_time: mealTime,
            tags: []
        };

        fetch(COMMENT_ADD_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submitData)
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '코멘트 등록에 실패했어요.');
                    return;
                }

                inputElement.value = '';

                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('코멘트 등록 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function editComment(commentId) {
        const targetComment = savedComments.find(function(comment) {
            return String(comment.id) === String(commentId);
        });

        if (!targetComment || !isMyData(targetComment)) {
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

        fetch(COMMENT_EDIT_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_id: commentId,
                content: cleanText
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '코멘트 수정에 실패했어요.');
                    return;
                }

                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('코멘트 수정 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function deleteComment(commentId) {
        const targetComment = savedComments.find(function(comment) {
            return String(comment.id) === String(commentId);
        });

        if (!targetComment) {
            alert('삭제할 코멘트를 찾을 수 없어요.');
            return;
        }

        if (!canManageData(targetComment)) {
            alert('삭제 권한이 없어요.');
            return;
        }

        if (!confirm('이 코멘트를 삭제할까요?')) {
            return;
        }

        fetch(COMMENT_DELETE_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_id: commentId
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '코멘트 삭제에 실패했어요.');
                    return;
                }

                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('코멘트 삭제 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function addReply(commentId, inputElement) {
        if (!IS_LOGIN || !LOGIN_USER_NO) {
            alert('의견 작성은 로그인 후 이용할 수 있어요!');
            location.href = './login/login.html';
            return;
        }

        const text = inputElement.value.trim();

        if (!text) {
            alert('의견을 입력해주세요!');
            return;
        }

        fetch(REPLY_ADD_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_id: commentId,
                content: text
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '의견 등록에 실패했어요.');
                    return;
                }

                inputElement.value = '';
                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('의견 등록 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function editReply(commentId, replyId) {
        const replies = savedReplies[String(commentId)] || [];
        const targetReply = replies.find(function(reply) {
            return String(reply.id) === String(replyId);
        });

        if (!targetReply || !canManageData(targetReply)) {
            alert('삭제 권한이 없어요.');
            return;
        }

        const nextText = prompt('의견을 수정해주세요.', targetReply.text);

        if (nextText === null) return;

        const cleanText = nextText.trim();

        if (!cleanText) {
            alert('빈 내용으로 수정할 수 없어요.');
            return;
        }

        fetch(REPLY_EDIT_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_id: commentId,
                reply_id: replyId,
                content: cleanText
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '의견 수정에 실패했어요.');
                    return;
                }

                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('의견 수정 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function deleteReply(commentId, replyId) {
        const replies = savedReplies[String(commentId)] || [];
        const targetReply = replies.find(function(reply) {
            return String(reply.id) === String(replyId);
        });

        if (!targetReply || !canManageData(targetReply)) {
            alert('삭제 권한이 없어요.');
            return;
        }

        if (!confirm('이 의견을 삭제할까요?')) {
            return;
        }

        fetch(REPLY_DELETE_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_id: commentId,
                reply_id: replyId
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '의견 삭제에 실패했어요.');
                    return;
                }

                refreshCommentsFromDB();
            })
            .catch(function(error) {
                console.error('의견 삭제 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
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

    function normalizeReplyFromDB(reply) {
        return {
            id: reply.id || `reply_${Date.now()}`,
            userNo: reply.userNo || '',
            userId: reply.userId || '',
            user: reply.user || '익명',
            text: reply.text || '',
            date: reply.date || '',
            timePeriod: reply.timePeriod || '',
            tags: Array.isArray(reply.tags) ? reply.tags : []
        };
    }

    function normalizeCommentFromDB(comment) {
        return {
            id: String(comment.id),
            userNo: String(comment.userNo || ''),
            userId: comment.userId || '',
            user: comment.user || '익명',
            text: comment.text || '',
            date: comment.date || '',
            timePeriod: comment.timePeriod || comment.mealTime || '',
            tags: Array.isArray(comment.tags) ? comment.tags : [],
            replies: Array.isArray(comment.replies) ? comment.replies.map(normalizeReplyFromDB) : [],
            isMine: comment.isMine === true
        };
    }

    function loadCommentsFromDB() {
        return fetch(`${COMMENT_LIST_API_URL}?food_id=${foodId}`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '코멘트 목록을 불러오지 못했어요.');
                    savedComments = [];
                    savedReplies = {};
                    return;
                }

                savedComments = Array.isArray(data.comments)
                    ? data.comments.map(normalizeCommentFromDB)
                    : [];

                savedReplies = {};

                savedComments.forEach(function(comment) {
                    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
                        savedReplies[String(comment.id)] = comment.replies;
                    }
                });

                if (currentFood) {
                    currentFood.comments = savedComments.length;
                }
            })
            .catch(function(error) {
                console.error('코멘트 목록 불러오기 실패:', error);
                savedComments = [];
                savedReplies = {};
            });
    }

    function refreshCommentsFromDB() {
        return loadCommentsFromDB().then(function() {
            currentCommentPage = 1;
            currentOverlayCommentPage = 1;

            renderComments();
            renderCommentOverlay();
            renderMyOverlayIfOpen();
        });
    }

    // ================================
    // 10. 태그
    // ================================

    function splitTagsByType(tagList) {
        const times = [];
        const situations = [];
        const customTags = [];

        tagList.forEach(function(tag) {
            if (timeTagOptions.includes(tag)) {
                times.push(tag.replace(/^#/, ''));
                return;
            }

            if (situationTagOptions.includes(tag)) {
                situations.push(tag.replace(/^#/, ''));
                return;
            }

            customTags.push(tag);
        });

        return {
            tags: tagList,
            times: Array.from(new Set(times)),
            situations: Array.from(new Set(situations)),
            customTags: Array.from(new Set(customTags))
        };
    }

    function saveTagsToDB() {
        const grouped = splitTagsByType(currentFood.tags || []);

        return fetch(TAG_UPDATE_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                food_id: currentFood.id,
                tags: grouped.tags,
                times: grouped.times,
                situations: grouped.situations
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '태그 저장에 실패했어요.');
                    return false;
                }

                currentFood.tags = Array.isArray(data.tags) ? data.tags : currentFood.tags;
                currentFood.times = Array.isArray(data.times) ? data.times : currentFood.times;
                currentFood.situations = Array.isArray(data.situations) ? data.situations : currentFood.situations;

                return true;
            })
            .catch(function(error) {
                console.error('태그 저장 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
                return false;
            });
    }
    
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
        if (!IS_LOGIN || !LOGIN_USER_NO) {
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

        let isChanged = false;

        newTags.forEach(function(tag) {
            if (!currentFood.tags.includes(tag)) {
                currentFood.tags.push(tag);
                isChanged = true;
            }
        });

        if (!isChanged) {
            alert('이미 추가된 태그예요.');
            return;
        }

        saveTagsToDB().then(function(success) {
            if (!success) {
                return;
            }

            resetTagForm();
            renderDetail();
            renderTagOverlay();
            renderMyOverlayIfOpen();

            alert('태그가 추가됐어요.');
        });
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

        if (!confirm('선택한 태그를 삭제할까요?')) {
            return;
        }

        const deleteTags = Array.from(selectedTagSet);

        currentFood.tags = currentFood.tags.filter(function(tag) {
            return !deleteTags.includes(tag);
        });

        saveTagsToDB().then(function(success) {
            if (!success) {
                return;
            }

            selectedTagSet.clear();

            renderDetail();
            renderTagOverlay();
            renderMyOverlayIfOpen();

            alert('태그가 삭제됐어요.');
        });
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
            return isMyData(comment);
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
                if (!isMyData(reply)) return;

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
        return savedPhotos.filter(function(photo) {
            return isMyData(photo);
        });
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
                        <strong>${parent && isMyData(parent) ? '내 코멘트' : '다른 사람 코멘트'}</strong>
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
                    <button type="button" class="my_delete_btn" data-action="delete-photo">삭제</button>
                </div>
            </div>
        `;
    }

    function renderMyOverlay() {
        createMyOverlayIfNeeded();

        const myComments = getMyComments();
        const myReplies = getMyReplies();
        const myPhotos = getMyPhotos();

        $('#myOverlayContent').innerHTML = `

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
        if (!IS_LOGIN || !LOGIN_USER_NO) {
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

    function handleMyOverlayClick(event) {
        const button = event.target.closest('button[data-action]');

        if (!button) return;

        const action = button.dataset.action;
        const activityItem = button.closest('.my_activity_item');
        const photoItem = button.closest('.my_photo_item');

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
        Promise.all([
            loadCommentsFromDB(),
            loadPhotosFromDB()
        ]).then(function() {
            renderDetail();
            connectEvents();
        });
    }

    init();
})();