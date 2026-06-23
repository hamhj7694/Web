// ================================
// mypage.js
// 마이페이지 기능
// 글로벌 DB 기준 내 활동 / 내 추천 / 계정 관리
// ================================

document.addEventListener('DOMContentLoaded', function () {
    // ================================
    // 1. API / 기본값
    // ================================

    const DEFAULT_IMAGE = '../assets/food/default.png';

    const MY_ACTIVITY_API_URL = '../backend/api/wiki/my_activity.php';
    const WIKI_LIKE_API_URL = '../backend/api/wiki/like.php';
    const WIKI_DELETE_MY_LIKE_API_URL = '../backend/api/wiki/delete_my_like.php';
    const WIKI_DELETE_MY_ACTIVITY_API_URL = '../backend/api/wiki/delete_my_activity.php';
    
    const UPDATE_ACCOUNT_API_URL = '../backend/api/auth/update_account.php';
    const DELETE_ACCOUNT_API_URL = '../backend/api/auth/delete_account.php';
    const LOGOUT_API_URL = '../backend/api/auth/logout.php';

    // ================================
    // 2. DOM
    // ================================

    const $ = function (selector) {
        return document.querySelector(selector);
    };

    const el = {
        myNickname: $('#myNickname'),
        myUserId: $('#myUserId'),

        myJoinFoodCount: $('#myJoinFoodCount'),
        myLikedFoodCount: $('#myLikedFoodCount'),

        myJoinedFoodList: $('#myJoinedFoodList'),
        myLikedFoodList: $('#myLikedFoodList'),

        joinedFoodPagination: $('#joinedFoodPagination'),
        joinedFoodPrevBtn: $('#joinedFoodPrevBtn'),
        joinedFoodPageInfo: $('#joinedFoodPageInfo'),
        joinedFoodNextBtn: $('#joinedFoodNextBtn'),

        likedFoodPagination: $('#likedFoodPagination'),
        likedFoodPrevBtn: $('#likedFoodPrevBtn'),
        likedFoodPageInfo: $('#likedFoodPageInfo'),
        likedFoodNextBtn: $('#likedFoodNextBtn'),

        logoutBtn: $('#logoutBtn'),
        editAccountBtn: $('#editAccountBtn'),
        deleteAccountBtn: $('#deleteAccountBtn'),

        accountOverlay: $('#accountOverlay'),
        accountOverlayBg: $('#accountOverlayBg'),
        accountOverlayCloseBtn: $('#accountOverlayCloseBtn'),
        accountEditForm: $('#accountEditForm'),
        editNickname: $('#editNickname'),
        currentPw: $('#currentPw'),
        editPw: $('#editPw'),
        editPwCheck: $('#editPwCheck'),

        deleteOverlay: $('#deleteOverlay'),
        deleteOverlayBg: $('#deleteOverlayBg'),
        deleteOverlayCloseBtn: $('#deleteOverlayCloseBtn'),
        deletePwInput: $('#deletePwInput'),
        deleteConfirmBtn: $('#deleteConfirmBtn')
    };

    // ================================
    // 3. 로그인 상태
    // ================================

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_NO = localStorage.getItem('omechu_user_no') || '';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';
    const LOGIN_USER_NICKNAME = localStorage.getItem('omechu_user_nickname') || '사용자';

    if (!IS_LOGIN || !LOGIN_USER_NO) {
        alert('로그인이 필요한 페이지예요!');
        location.href = './login/login.html';
        return;
    }

    let currentUser = {
        no: LOGIN_USER_NO,
        id: LOGIN_USER_ID,
        nickname: LOGIN_USER_NICKNAME
    };

    // ================================
    // 4. 상태값
    // ================================

    const JOINED_FOOD_PAGE_SIZE = 5;
    const LIKED_FOOD_PAGE_SIZE = 10;

    let joinedFoodCurrentPage = 1;
    let likedFoodCurrentPage = 1;

    let joinedFoods = [];
    let likedFoods = [];

    // ================================
    // 5. 공통 유틸
    // ================================

    function escapeHTML(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

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
            path.startsWith('./') ||
            path.startsWith('/')
        ) {
            return path;
        }

        return `../${path}`;
    }

    function clearLoginInfo() {
        localStorage.removeItem('omechu_is_login');
        localStorage.removeItem('omechu_user_no');
        localStorage.removeItem('omechu_user_id');
        localStorage.removeItem('omechu_user_nickname');
    }

    function setOverlayOpen(isOpen) {
        document.body.classList.toggle('overlay_open', isOpen);
    }

    function getTotalPage(list, pageSize) {
        return Math.max(1, Math.ceil(list.length / pageSize));
    }

    function getPagedList(list, currentPage, pageSize) {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return list.slice(startIndex, endIndex);
    }

    function getCurrentUser() {
        return {
            no: LOGIN_USER_NO,
            id: LOGIN_USER_ID,
            nickname: localStorage.getItem('omechu_user_nickname') || LOGIN_USER_NICKNAME
        };
    }

    function normalizeActivityFood(food) {
        return {
            foodId: Number(food.foodId || 0),
            foodName: food.foodName || '이름 없는 음식',
            foodCategory: food.foodCategory || '기타',
            foodImage: normalizeImagePath(food.foodImage || ''),

            commentCount: Number(food.commentCount || 0),
            replyCount: Number(food.replyCount || 0),
            photoCount: Number(food.photoCount || 0),
            tagCount: Number(food.tagCount || 0),

            myLikeCount: Number(food.myLikeCount || 0),
            totalLikeCount: Number(food.totalLikeCount || 0)
        };
    }

    // ================================
    // 6. 내 활동 DB 불러오기
    // ================================

    function loadMyActivity() {
        return fetch(MY_ACTIVITY_API_URL, {
            method: 'GET',
            credentials: 'include'
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '마이페이지 정보를 불러오지 못했어요.');
                    joinedFoods = [];
                    likedFoods = [];
                    return;
                }

                joinedFoods = Array.isArray(data.joinedFoods)
                    ? data.joinedFoods.map(normalizeActivityFood)
                    : [];

                likedFoods = Array.isArray(data.likedFoods)
                    ? data.likedFoods.map(normalizeActivityFood)
                    : [];
            })
            .catch(function(error) {
                console.error('마이페이지 활동 정보 불러오기 실패:', error);
                joinedFoods = [];
                likedFoods = [];
            });
    }

    function refreshMyPage() {
        return loadMyActivity().then(function() {
            renderMyPage();
        });
    }

    // ================================
    // 7. 페이지네이션
    // ================================

    function updatePagination(type, currentPage, totalPage) {
        let pagination = null;
        let prevBtn = null;
        let pageInfo = null;
        let nextBtn = null;

        if (type === 'joined') {
            pagination = el.joinedFoodPagination;
            prevBtn = el.joinedFoodPrevBtn;
            pageInfo = el.joinedFoodPageInfo;
            nextBtn = el.joinedFoodNextBtn;
        }

        if (type === 'liked') {
            pagination = el.likedFoodPagination;
            prevBtn = el.likedFoodPrevBtn;
            pageInfo = el.likedFoodPageInfo;
            nextBtn = el.likedFoodNextBtn;
        }

        if (!pagination || !prevBtn || !pageInfo || !nextBtn) {
            return;
        }

        if (totalPage <= 1) {
            pagination.style.display = 'none';
            pageInfo.textContent = '1 / 1';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `${currentPage} / ${totalPage}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPage;
    }

    function handlePaginationClick(button) {
        const pageType = button.dataset.pageType;
        const pageAction = button.dataset.pageAction;

        if (pageType === 'joined') {
            const totalPage = getTotalPage(joinedFoods, JOINED_FOOD_PAGE_SIZE);

            if (pageAction === 'prev') {
                joinedFoodCurrentPage = Math.max(1, joinedFoodCurrentPage - 1);
            }

            if (pageAction === 'next') {
                joinedFoodCurrentPage = Math.min(totalPage, joinedFoodCurrentPage + 1);
            }

            renderMyPage();
            return;
        }

        if (pageType === 'liked') {
            const totalPage = getTotalPage(likedFoods, LIKED_FOOD_PAGE_SIZE);

            if (pageAction === 'prev') {
                likedFoodCurrentPage = Math.max(1, likedFoodCurrentPage - 1);
            }

            if (pageAction === 'next') {
                likedFoodCurrentPage = Math.min(totalPage, likedFoodCurrentPage + 1);
            }

            renderMyPage();
        }
    }

    // ================================
    // 8. 화면 출력
    // ================================

    function renderProfile() {
        currentUser = getCurrentUser();

        if (el.myNickname) {
            el.myNickname.textContent = currentUser.nickname || LOGIN_USER_NICKNAME;
        }

        if (el.myUserId) {
            el.myUserId.textContent = `ID: ${currentUser.id}`;
        }

        if (el.editNickname) {
            el.editNickname.value = currentUser.nickname || '';
        }
    }

    function renderMyPage() {
        renderProfile();

        if (el.myJoinFoodCount) {
            el.myJoinFoodCount.textContent = joinedFoods.length;
        }

        if (el.myLikedFoodCount) {
            el.myLikedFoodCount.textContent = likedFoods.length;
        }

        renderJoinedFoods();
        renderLikedFoods();
    }

    function renderJoinedFoods() {
        if (!el.myJoinedFoodList) {
            return;
        }

        if (joinedFoods.length === 0) {
            joinedFoodCurrentPage = 1;

            el.myJoinedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 참여한 음식이 없어요.<br>
                    코멘트, 의견, 사진을 추가해보세요!
                </p>
            `;

            updatePagination('joined', 1, 1);
            return;
        }

        const totalPage = getTotalPage(joinedFoods, JOINED_FOOD_PAGE_SIZE);

        if (joinedFoodCurrentPage > totalPage) {
            joinedFoodCurrentPage = totalPage;
        }

        const pagedFoods = getPagedList(
            joinedFoods,
            joinedFoodCurrentPage,
            JOINED_FOOD_PAGE_SIZE
        );

        el.myJoinedFoodList.innerHTML = pagedFoods.map(function(food) {
            return `
                <div class="my_food_card" data-food-id="${food.foodId}">
                    <img 
                        class="my_food_img" 
                        src="${escapeHTML(food.foodImage)}" 
                        alt="${escapeHTML(food.foodName)}"
                        onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'"
                    >

                    <div class="my_food_info">
                        <h3>${escapeHTML(food.foodName)}</h3>
                        <p>
                            코멘트 ${food.commentCount}개 · 
                            의견 ${food.replyCount}개<br>
                            사진 ${food.photoCount}개
                        </p>
                    </div>

                    <div class="my_btns1">
                        <button type="button" class="my_food_btn go_detail_btn">
                            위키가기
                        </button>
                        <button type="button" class="my_food_btn2 delete_my_activity_btn">
                            내 작성내용 모두 삭제
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        updatePagination('joined', joinedFoodCurrentPage, totalPage);
    }

    function renderLikedFoods() {
        if (!el.myLikedFoodList) {
            return;
        }

        if (likedFoods.length === 0) {
            likedFoodCurrentPage = 1;

            el.myLikedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 추천한 음식이 없어요.<br>
                    마음에 드는 음식에 추천을 눌러보세요!
                </p>
            `;

            updatePagination('liked', 1, 1);
            return;
        }

        const totalPage = getTotalPage(likedFoods, LIKED_FOOD_PAGE_SIZE);

        if (likedFoodCurrentPage > totalPage) {
            likedFoodCurrentPage = totalPage;
        }

        const pagedFoods = getPagedList(
            likedFoods,
            likedFoodCurrentPage,
            LIKED_FOOD_PAGE_SIZE
        );

        el.myLikedFoodList.innerHTML = pagedFoods.map(function(food) {
            return `
                <div class="my_food_card" data-food-id="${food.foodId}">
                    <div class="my_like_top">
                        <div class="my_food_info">
                            <h3>${escapeHTML(food.foodName)}</h3>
                            <p>
                                전체 추천 ${food.totalLikeCount}회<br>
                                내 추천 수 ${food.myLikeCount}회
                            </p>
                        </div>

                        <button type="button" class="my_like_circle_btn add_like_btn" aria-label="추천 더하기">
                            🧡
                        </button>
                    </div>

                    <div class="my_btns2">
                        <button type="button" class="my_food_btn go_detail_btn">
                            위키가기
                        </button>
                        
                        <button type="button" class="my_food_btn2 delete_my_like_btn">
                            내 추천 모두 삭제
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        updatePagination('liked', likedFoodCurrentPage, totalPage);
    }

    // ================================
    // 9. 계정 정보 변경
    // ================================

    function openAccountOverlay() {
        renderProfile();

        if (el.currentPw) el.currentPw.value = '';
        if (el.editPw) el.editPw.value = '';
        if (el.editPwCheck) el.editPwCheck.value = '';

        if (el.accountOverlay) {
            el.accountOverlay.classList.remove('hidden');
        }

        setOverlayOpen(true);
    }

    function closeAccountOverlay() {
        if (el.accountOverlay) {
            el.accountOverlay.classList.add('hidden');
        }

        setOverlayOpen(false);
    }

    function handleAccountEditSubmit(event) {
        event.preventDefault();

        const newNickname = el.editNickname ? el.editNickname.value.trim() : '';
        const currentPw = el.currentPw ? el.currentPw.value.trim() : '';
        const newPw = el.editPw ? el.editPw.value.trim() : '';
        const newPwCheck = el.editPwCheck ? el.editPwCheck.value.trim() : '';

        if (newNickname === '') {
            alert('닉네임을 입력해주세요!');
            if (el.editNickname) el.editNickname.focus();
            return;
        }

        if (currentPw === '') {
            alert('현재 비밀번호를 입력해주세요!');
            if (el.currentPw) el.currentPw.focus();
            return;
        }

        if (newPw !== '' || newPwCheck !== '') {
            if (newPw.length < 4) {
                alert('새 비밀번호는 4자 이상 입력해주세요!');
                if (el.editPw) el.editPw.focus();
                return;
            }

            if (newPw !== newPwCheck) {
                alert('새 비밀번호가 서로 달라요!');
                if (el.editPwCheck) el.editPwCheck.focus();
                return;
            }
        }

        fetch(UPDATE_ACCOUNT_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname: newNickname,
                current_password: currentPw,
                new_password: newPw
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '계정 정보 변경에 실패했어요.');
                    return;
                }

                localStorage.setItem('omechu_user_nickname', data.user.nickname);

                currentUser = {
                    no: data.user.no,
                    id: data.user.login_id,
                    nickname: data.user.nickname
                };

                alert(data.message || '계정 정보가 변경됐어요.');

                closeAccountOverlay();
                renderMyPage();
            })
            .catch(function(error) {
                console.error('계정 정보 변경 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    // ================================
    // 10. 계정 탈퇴
    // ================================

    function openDeleteOverlay() {
        if (el.deletePwInput) {
            el.deletePwInput.value = '';
        }

        if (el.deleteOverlay) {
            el.deleteOverlay.classList.remove('hidden');
        }

        setOverlayOpen(true);
    }

    function closeDeleteOverlay() {
        if (el.deleteOverlay) {
            el.deleteOverlay.classList.add('hidden');
        }

        setOverlayOpen(false);
    }

    function handleDeleteAccount() {
        const password = el.deletePwInput ? el.deletePwInput.value.trim() : '';

        if (password === '') {
            alert('현재 비밀번호를 입력해주세요.');
            if (el.deletePwInput) el.deletePwInput.focus();
            return;
        }

        const confirmDelete = confirm('정말 계정을 탈퇴할까요?');

        if (!confirmDelete) {
            return;
        }

        fetch(DELETE_ACCOUNT_API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (!data.success) {
                    alert(data.message || '계정 탈퇴에 실패했어요.');
                    return;
                }

                clearLoginInfo();

                alert(data.message || '계정 탈퇴가 완료됐어요.');

                location.href = '../index.html';
            })
            .catch(function(error) {
                console.error('계정 탈퇴 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    // ================================
    // 11. 추천 처리
    // ================================

    function deleteMyActivityByFoodId(foodId) {
        const targetFood = joinedFoods.find(function(food) {
            return String(food.foodId) === String(foodId);
        });

        if (!targetFood) {
            alert('음식 정보를 찾을 수 없어요.');
            return;
        }

        const confirmDelete = confirm(
            `"${targetFood.foodName}"에 작성한 내 코멘트, 의견, 사진을 모두 삭제할까요?\n\n태그는 작성자 정보를 저장하지 않아서 삭제 대상에서 제외돼요.`
        );

        if (!confirmDelete) {
            return;
        }

        fetch(WIKI_DELETE_MY_ACTIVITY_API_URL, {
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
                    alert(data.message || '내 작성내용 삭제에 실패했어요.');
                    return;
                }

                const deleted = data.deleted || {};

                alert(
                    `내 작성내용이 삭제됐어요.\n` +
                    `코멘트 ${Number(deleted.comments || 0)}개\n` +
                    `의견 ${Number(deleted.replies || 0)}개\n` +
                    `사진 ${Number(deleted.photos || 0)}개`
                );

                refreshMyPage();
            })
            .catch(function(error) {
                console.error('내 작성내용 삭제 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function addMyLikeByFoodId(foodId) {
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

                refreshMyPage();
            })
            .catch(function(error) {
                console.error('추천 추가 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    function deleteMyLikeByFoodId(foodId) {
        const targetFood = likedFoods.find(function(food) {
            return String(food.foodId) === String(foodId);
        });

        if (!targetFood) {
            alert('음식 정보를 찾을 수 없어요.');
            return;
        }

        const myLikeCount = Number(targetFood.myLikeCount || 0);

        if (myLikeCount <= 0) {
            alert('삭제할 추천 기록이 없어요.');
            refreshMyPage();
            return;
        }

        const confirmDelete = confirm(
            `"${targetFood.foodName}"에 누른 내 추천 ${myLikeCount}회를 모두 삭제할까요?`
        );

        if (!confirmDelete) {
            return;
        }

        fetch(WIKI_DELETE_MY_LIKE_API_URL, {
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
                    alert(data.message || '내 추천 삭제에 실패했어요.');
                    return;
                }

                alert(data.message || '내 추천 기록이 삭제됐어요.');

                refreshMyPage();
            })
            .catch(function(error) {
                console.error('내 추천 삭제 실패:', error);
                alert('서버와 통신 중 오류가 발생했어요.');
            });
    }

    // ================================
    // 12. 로그아웃
    // ================================

    function handleLogout() {
        const confirmLogout = confirm('로그아웃할까요?');

        if (!confirmLogout) {
            return;
        }

        fetch(LOGOUT_API_URL, {
            method: 'POST',
            credentials: 'include'
        })
            .then(function(response) {
                return response.json();
            })
            .then(function() {
                clearLoginInfo();
                location.href = '../index.html';
            })
            .catch(function(error) {
                console.error('로그아웃 실패:', error);
                clearLoginInfo();
                location.href = '../index.html';
            });
    }

    // ================================
    // 13. 상세 페이지 이동 / 클릭 처리
    // ================================

    function moveToDetailByFoodId(foodId) {
        if (!foodId) {
            return;
        }

        location.href = `./wiki_detail.html?id=${foodId}`;
    }

    function handleJoinedFoodClick(event) {
        const detailButton = event.target.closest('.go_detail_btn');
        const deleteButton = event.target.closest('.delete_my_activity_btn');

        const card = event.target.closest('.my_food_card');

        if (!card) {
            return;
        }

        if (detailButton) {
            moveToDetailByFoodId(card.dataset.foodId);
            return;
        }

        if (deleteButton) {
            deleteMyActivityByFoodId(card.dataset.foodId);
        }
    }

    function handleLikedFoodClick(event) {
        const detailButton = event.target.closest('.go_detail_btn');
        const deleteButton = event.target.closest('.delete_my_like_btn');
        const addLikeButton = event.target.closest('.add_like_btn');

        const card = event.target.closest('.my_food_card');

        if (!card) {
            return;
        }

        if (detailButton) {
            moveToDetailByFoodId(card.dataset.foodId);
            return;
        }

        if (deleteButton) {
            deleteMyLikeByFoodId(card.dataset.foodId);
            return;
        }

        if (addLikeButton) {
            addMyLikeByFoodId(card.dataset.foodId);
        }
    }

    // ================================
    // 14. 이벤트 연결
    // ================================

    function connectEvents() {
        if (el.logoutBtn) {
            el.logoutBtn.addEventListener('click', handleLogout);
        }

        if (el.editAccountBtn) {
            el.editAccountBtn.addEventListener('click', openAccountOverlay);
        }

        if (el.accountOverlayCloseBtn) {
            el.accountOverlayCloseBtn.addEventListener('click', closeAccountOverlay);
        }

        if (el.accountOverlayBg) {
            el.accountOverlayBg.addEventListener('click', closeAccountOverlay);
        }

        if (el.accountEditForm) {
            el.accountEditForm.addEventListener('submit', handleAccountEditSubmit);
        }

        if (el.deleteAccountBtn) {
            el.deleteAccountBtn.addEventListener('click', openDeleteOverlay);
        }

        if (el.deleteOverlayCloseBtn) {
            el.deleteOverlayCloseBtn.addEventListener('click', closeDeleteOverlay);
        }

        if (el.deleteOverlayBg) {
            el.deleteOverlayBg.addEventListener('click', closeDeleteOverlay);
        }

        if (el.deleteConfirmBtn) {
            el.deleteConfirmBtn.addEventListener('click', handleDeleteAccount);
        }

        if (el.myJoinedFoodList) {
            el.myJoinedFoodList.addEventListener('click', handleJoinedFoodClick);
        }

        if (el.myLikedFoodList) {
            el.myLikedFoodList.addEventListener('click', handleLikedFoodClick);
        }

        if (el.joinedFoodPrevBtn) {
            el.joinedFoodPrevBtn.addEventListener('click', function () {
                handlePaginationClick(el.joinedFoodPrevBtn);
            });
        }

        if (el.joinedFoodNextBtn) {
            el.joinedFoodNextBtn.addEventListener('click', function () {
                handlePaginationClick(el.joinedFoodNextBtn);
            });
        }

        if (el.likedFoodPrevBtn) {
            el.likedFoodPrevBtn.addEventListener('click', function () {
                handlePaginationClick(el.likedFoodPrevBtn);
            });
        }

        if (el.likedFoodNextBtn) {
            el.likedFoodNextBtn.addEventListener('click', function () {
                handlePaginationClick(el.likedFoodNextBtn);
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (el.accountOverlay && !el.accountOverlay.classList.contains('hidden')) {
                closeAccountOverlay();
                return;
            }

            if (el.deleteOverlay && !el.deleteOverlay.classList.contains('hidden')) {
                closeDeleteOverlay();
            }
        });
    }

    // ================================
    // 15. 실행
    // ================================

    connectEvents();

    refreshMyPage();

});