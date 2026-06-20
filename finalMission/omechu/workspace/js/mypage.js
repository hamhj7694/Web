// ================================
// mypage.js
// 마이페이지 기능
// 현재 HTML 기준:
// 1. 로그인 유저 정보 표시
// 2. 내가 참여한 음식 목록 표시
// 3. 내가 추천한 음식 목록 표시
// 4. 계정 정보 변경
// 5. 로그아웃 / 계정 탈퇴
// ================================

(function () {
    // ================================
    // 1. 기본 음식 데이터
    // wiki.js / wiki_detail.js와 id를 맞춰야 함
    // ================================

    const DEFAULT_IMAGE = '../assets/food/default.png';
    const CUSTOM_FOOD_STORAGE_KEY = 'omechu_wiki_custom_foods';

    const defaultFoodList = [
        {
            id: 1,
            name: '제육볶음',
            category: '한식',
            image: '../assets/food/jeyuk.png',
            likes: 842
        },
        {
            id: 2,
            name: '김치찌개',
            category: '한식',
            image: '../assets/food/kimchi.png',
            likes: 812
        },
        {
            id: 3,
            name: '치킨',
            category: '야식',
            image: '../assets/food/chicken.png',
            likes: 1052
        },
        {
            id: 4,
            name: '짜장면',
            category: '중식',
            image: '../assets/food/jajang.png',
            likes: 765
        },
        {
            id: 5,
            name: '마라탕',
            category: '중식',
            image: '../assets/food/maratang.png',
            likes: 998
        },
        {
            id: 6,
            name: '초밥',
            category: '일식',
            image: '../assets/food/sushi.png',
            likes: 691
        },
        {
            id: 7,
            name: '파스타',
            category: '양식',
            image: '../assets/food/pasta.png',
            likes: 634
        },
        {
            id: 8,
            name: '떡볶이',
            category: '분식',
            image: '../assets/food/tteokbokki.png',
            likes: 913
        },
        {
            id: 9,
            name: '라면',
            category: '분식',
            image: '../assets/food/ramen.png',
            likes: 720
        },
        {
            id: 10,
            name: '샐러드',
            category: '기타',
            image: '../assets/food/salad.png',
            likes: 356
        },
        {
            id: 11,
            name: '돈까스',
            category: '일식',
            image: '../assets/food/donkatsu.png',
            likes: 678
        },
        {
            id: 12,
            name: '피자',
            category: '양식',
            image: '../assets/food/pizza.png',
            likes: 884
        }
    ];


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
    // 2-1. 페이지네이션 설정
    // 내가 참여한 음식: 5개씩
    // 내가 추천한 음식: 10개씩
    // ================================

    const JOINED_FOOD_PAGE_SIZE = 5;
    const LIKED_FOOD_PAGE_SIZE = 10;

    let joinedFoodCurrentPage = 1;
    let likedFoodCurrentPage = 1;

    // ================================
    // 3. 로그인 확인
    // ================================

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';
    const LOGIN_USER_NICKNAME = localStorage.getItem('omechu_user_nickname') || '사용자';

    if (!IS_LOGIN || !LOGIN_USER_ID) {
        alert('로그인이 필요한 페이지예요!');
        location.href = './login/login.html';
        return;
    }

    let currentUser = getCurrentUser();

    if (!currentUser) {
        alert('회원 정보를 찾을 수 없어요. 다시 로그인해주세요.');
        clearLoginInfo();
        location.href = './login/login.html';
        return;
    }


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
            console.error(`${key} 데이터를 읽는 중 오류가 발생했습니다.`, error);
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

    function escapeHTML(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function getSavedUsers() {
        return readJSON('omechu_users', []);
    }

    function getCurrentUser() {
        const users = getSavedUsers();

        return users.find(function (user) {
            return user.id === LOGIN_USER_ID;
        });
    }

    function clearLoginInfo() {
        localStorage.removeItem('omechu_is_login');
        localStorage.removeItem('omechu_user_id');
        localStorage.removeItem('omechu_user_nickname');
    }

    function setOverlayOpen(isOpen) {
        document.body.classList.toggle('overlay_open', isOpen);
    }

    function uniqueList(list) {
        return Array.from(new Set(list.filter(Boolean)));
    }

    function getTotalPage(list, pageSize) {
        return Math.ceil(list.length / pageSize);
    }

    function getPagedList(list, currentPage, pageSize) {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return list.slice(startIndex, endIndex);
    }

    function renderPagination(type, currentPage, totalPage) {
        if (totalPage <= 1) {
            return '';
        }

        return `
            <div class="my_pagination" data-page-type="${type}">
                <button 
                    type="button" 
                    class="my_page_btn" 
                    data-page-type="${type}" 
                    data-page-action="prev"
                    ${currentPage <= 1 ? 'disabled' : ''}
                >
                    이전
                </button>

                <strong>${currentPage} / ${totalPage}</strong>

                <button 
                    type="button" 
                    class="my_page_btn" 
                    data-page-type="${type}" 
                    data-page-action="next"
                    ${currentPage >= totalPage ? 'disabled' : ''}
                >
                    다음
                </button>
            </div>
        `;
    }

    function handlePaginationClick(button) {
        const pageType = button.dataset.pageType;
        const pageAction = button.dataset.pageAction;

        if (pageType === 'joined') {
            if (pageAction === 'prev') {
                joinedFoodCurrentPage = Math.max(1, joinedFoodCurrentPage - 1);
            }

            if (pageAction === 'next') {
                joinedFoodCurrentPage += 1;
            }

            renderMyPage();
            return;
        }

        if (pageType === 'liked') {
            if (pageAction === 'prev') {
                likedFoodCurrentPage = Math.max(1, likedFoodCurrentPage - 1);
            }

            if (pageAction === 'next') {
                likedFoodCurrentPage += 1;
            }

            renderMyPage();
        }
    }

    // ================================
    // 5. localStorage key
    // ================================

    function getCommentKey(foodId) {
        return `omechu_food_${foodId}_comments`;
    }

    function getReplyKey(foodId) {
        return `omechu_food_${foodId}_replies`;
    }

    function getPhotoKey(foodId) {
        return `omechu_food_${foodId}_photos`;
    }

    function getFoodTagsKey(foodId) {
        return `omechu_food_${foodId}_tags`;
    }

    function getMyTagsKey(foodId) {
        return `omechu_food_${foodId}_my_tags_${LOGIN_USER_ID}`;
    }

    function getTotalLikeKey(foodId) {
        return `omechu_wiki_food_${foodId}_like_count`;
    }

    function getMyLikeKey(foodId) {
        return `omechu_wiki_food_${foodId}_my_like_count_${LOGIN_USER_ID}`;
    }


    // ================================
    // 6. 음식 목록 만들기
    // 기본 음식 + 커스텀 음식
    // ================================

    function getCustomFoodList() {
        return readJSON(CUSTOM_FOOD_STORAGE_KEY, []);
    }

    function saveCustomFoodList(foodList) {
        saveJSON(CUSTOM_FOOD_STORAGE_KEY, foodList);
    }

    function getAllFoodList() {
        const customFoodList = getCustomFoodList();

        const normalizedCustomFoods = customFoodList.map(function (food) {
            return {
                ...food,
                isCustomFood: true,
                image: food.image || DEFAULT_IMAGE,
                likes: Number(food.likes || 0)
            };
        });

        const normalizedDefaultFoods = defaultFoodList.map(function (food) {
            return {
                ...food,
                isCustomFood: false,
                image: food.image || DEFAULT_IMAGE,
                likes: Number(food.likes || 0)
            };
        });

        return [
            ...normalizedCustomFoods,
            ...normalizedDefaultFoods
        ];
    }


    // ================================
    // 7. 음식별 내 활동 수집
    // ================================

    function getStorageComments(foodId) {
        return readJSON(getCommentKey(foodId), []);
    }

    function getCustomFoodComments(food) {
        if (!Array.isArray(food.commentList)) {
            return [];
        }

        return food.commentList;
    }

    function getAllComments(food) {
        return [
            ...getStorageComments(food.id),
            ...getCustomFoodComments(food)
        ];
    }

    function getStoragePhotos(foodId) {
        return readJSON(getPhotoKey(foodId), []);
    }

    function getCustomFoodPhotos(food) {
        if (!Array.isArray(food.photos)) {
            return [];
        }

        return food.photos.filter(function (photo) {
            return typeof photo === 'object' && photo !== null;
        });
    }

    function getAllPhotos(food) {
        return [
            ...getStoragePhotos(food.id),
            ...getCustomFoodPhotos(food)
        ];
    }

    function getMyReplyCount(foodId) {
        const savedReplies = readJSON(getReplyKey(foodId), {});
        let count = 0;

        Object.keys(savedReplies).forEach(function (commentId) {
            const replyList = Array.isArray(savedReplies[commentId])
                ? savedReplies[commentId]
                : [];

            replyList.forEach(function (reply) {
                if (reply.userId === LOGIN_USER_ID) {
                    count += 1;
                }
            });
        });

        return count;
    }

    function getMyTags(food) {
        const savedMyTags = readJSON(getMyTagsKey(food.id), []);

        const myCommentTags = [];

        getAllComments(food).forEach(function (comment) {
            if (comment.userId !== LOGIN_USER_ID) {
                return;
            }

            if (Array.isArray(comment.tags)) {
                myCommentTags.push(...comment.tags);
            }
        });

        return uniqueList([
            ...savedMyTags,
            ...myCommentTags
        ]);
    }

    function getMyFoodActivity(food) {
        const allComments = getAllComments(food);
        const allPhotos = getAllPhotos(food);

        const myComments = allComments.filter(function (comment) {
            return comment.userId === LOGIN_USER_ID;
        });

        const myPhotos = allPhotos.filter(function (photo) {
            return photo.userId === LOGIN_USER_ID;
        });

        const myReplyCount = getMyReplyCount(food.id);
        const myTags = getMyTags(food);

        const myLikeCount = readNumber(getMyLikeKey(food.id));
        const addedLikeCount = readNumber(getTotalLikeKey(food.id));
        const totalLikeCount = Number(food.likes || 0) + addedLikeCount;

        return {
            foodId: food.id,
            foodName: food.name || '이름 없는 음식',
            foodCategory: food.category || '기타',
            foodImage: food.image || DEFAULT_IMAGE,

            commentCount: myComments.length,
            replyCount: myReplyCount,
            photoCount: myPhotos.length,
            tagCount: myTags.length,

            myLikeCount: myLikeCount,
            totalLikeCount: totalLikeCount
        };
    }

    function getMyActivityData() {
        const allFoods = getAllFoodList();

        const allActivities = allFoods.map(function (food) {
            return getMyFoodActivity(food);
        });

        const joinedFoods = allActivities.filter(function (activity) {
            return (
                activity.commentCount > 0 ||
                activity.replyCount > 0 ||
                activity.photoCount > 0 ||
                activity.tagCount > 0
            );
        });

        const likedFoods = allActivities.filter(function (activity) {
            return activity.myLikeCount > 0;
        });

        return {
            joinedFoods: joinedFoods,
            likedFoods: likedFoods
        };
    }


    // ================================
    // 8. 화면 출력
    // ================================

    function renderProfile() {
        currentUser = getCurrentUser();

        if (!currentUser) {
            el.myNickname.textContent = LOGIN_USER_NICKNAME;
            el.myUserId.textContent = `ID: ${LOGIN_USER_ID}`;
            return;
        }

        el.myNickname.textContent = currentUser.nickname || LOGIN_USER_NICKNAME;
        el.myUserId.textContent = `ID: ${currentUser.id}`;

        if (el.editNickname) {
            el.editNickname.value = currentUser.nickname || '';
        }
    }

    function renderMyPage() {
        renderProfile();

        const data = getMyActivityData();

        el.myJoinFoodCount.textContent = data.joinedFoods.length;
        el.myLikedFoodCount.textContent = data.likedFoods.length;

        renderJoinedFoods(data.joinedFoods);
        renderLikedFoods(data.likedFoods);
    }

    function renderJoinedFoods(joinedFoods) {
        if (joinedFoods.length === 0) {
            joinedFoodCurrentPage = 1;

            el.myJoinedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 참여한 음식이 없어요.<br>
                    태그, 코멘트, 사진을 추가해보세요!
                </p>
            `;
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

        const foodHTML = pagedFoods.map(function (food) {
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
                            사진 ${food.photoCount}개 · 
                            태그 ${food.tagCount}개
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

        el.myJoinedFoodList.innerHTML = `
            ${foodHTML}
            ${renderPagination('joined', joinedFoodCurrentPage, totalPage)}
        `;
    }

    function renderLikedFoods(likedFoods) {
        if (likedFoods.length === 0) {
            likedFoodCurrentPage = 1;

            el.myLikedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 추천한 음식이 없어요.<br>
                    마음에 드는 음식에 추천을 눌러보세요!
                </p>
            `;
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

        const foodHTML = pagedFoods.map(function (food) {
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

        el.myLikedFoodList.innerHTML = `
            ${foodHTML}
            ${renderPagination('liked', likedFoodCurrentPage, totalPage)}
        `;
    }

    // ================================
    // 9. 계정 정보 변경
    // ================================

    function openAccountOverlay() {
        renderProfile();

        el.currentPw.value = '';
        el.editPw.value = '';
        el.editPwCheck.value = '';

        el.accountOverlay.classList.remove('hidden');
        setOverlayOpen(true);
    }

    function closeAccountOverlay() {
        el.accountOverlay.classList.add('hidden');
        setOverlayOpen(false);
    }

    function handleAccountEditSubmit(event) {
        event.preventDefault();

        const newNickname = el.editNickname.value.trim();
        const currentPw = el.currentPw.value.trim();
        const newPw = el.editPw.value.trim();
        const newPwCheck = el.editPwCheck.value.trim();

        if (newNickname === '') {
            alert('닉네임을 입력해주세요!');
            el.editNickname.focus();
            return;
        }

        if (currentPw === '') {
            alert('현재 비밀번호를 입력해주세요!');
            el.currentPw.focus();
            return;
        }

        if (currentPw !== currentUser.password) {
            alert('현재 비밀번호가 일치하지 않아요!');
            el.currentPw.focus();
            return;
        }

        if (newPw !== '' || newPwCheck !== '') {
            if (newPw.length < 4) {
                alert('새 비밀번호는 4자 이상 입력해주세요!');
                el.editPw.focus();
                return;
            }

            if (newPw !== newPwCheck) {
                alert('새 비밀번호가 서로 달라요!');
                el.editPwCheck.focus();
                return;
            }
        }

        const users = getSavedUsers();

        const userIndex = users.findIndex(function (user) {
            return user.id === LOGIN_USER_ID;
        });

        if (userIndex === -1) {
            alert('회원 정보를 찾을 수 없어요.');
            return;
        }

        users[userIndex].nickname = newNickname;

        if (newPw !== '') {
            users[userIndex].password = newPw;
        }

        saveJSON('omechu_users', users);
        localStorage.setItem('omechu_user_nickname', newNickname);

        currentUser = users[userIndex];

        alert('계정 정보가 변경됐어요.');

        closeAccountOverlay();
        renderMyPage();
    }


    // ================================
    // 10. 계정 탈퇴
    // ================================

    function openDeleteOverlay() {
        el.deletePwInput.value = '';

        el.deleteOverlay.classList.remove('hidden');
        setOverlayOpen(true);
    }

    function closeDeleteOverlay() {
        el.deleteOverlay.classList.add('hidden');
        setOverlayOpen(false);
    }

    function handleDeleteAccount() {
        const password = el.deletePwInput.value.trim();

        if (password === '') {
            alert('현재 비밀번호를 입력해주세요.');
            el.deletePwInput.focus();
            return;
        }

        if (password !== currentUser.password) {
            alert('비밀번호가 일치하지 않아요.');
            el.deletePwInput.focus();
            return;
        }

        const confirmDelete = confirm('정말 계정을 탈퇴할까요?');

        if (!confirmDelete) {
            return;
        }

        deleteCurrentUser();
        clearLoginInfo();

        alert('계정 탈퇴가 완료됐어요.');

        location.href = '../index.html';
    }

    function deleteCurrentUser() {
        let users = getSavedUsers();

        users = users.filter(function (user) {
            return user.id !== LOGIN_USER_ID;
        });

        saveJSON('omechu_users', users);

        removeMyLoginBasedRecords();
    }

    function removeMyLoginBasedRecords() {
        const allFoods = getAllFoodList();

        allFoods.forEach(function (food) {
            removeMyLikeRecord(food.id);
            removeMyTagsRecord(food.id);
        });

        removeMyDataFromStoredLists();
        removeMyDataFromCustomFoods();
    }

    function removeMyLikeRecord(foodId) {
        localStorage.removeItem(getMyLikeKey(foodId));

        // 예전 코드에서 쓰던 key가 남아 있을 수 있으므로 같이 정리
        localStorage.removeItem(`omechu_wiki_food_${foodId}_my_like_${LOGIN_USER_ID}`);
        localStorage.removeItem(`omechu_wiki_detail_my_like_${foodId}_${LOGIN_USER_ID}`);
    }

    function removeMyTagsRecord(foodId) {
        localStorage.removeItem(getMyTagsKey(foodId));
    }

    function removeMyDataFromStoredLists() {
        const allFoods = getAllFoodList();

        allFoods.forEach(function (food) {
            const foodId = food.id;

            const comments = readJSON(getCommentKey(foodId), []);
            const photos = readJSON(getPhotoKey(foodId), []);
            const replies = readJSON(getReplyKey(foodId), {});

            const nextComments = comments.filter(function (comment) {
                return comment.userId !== LOGIN_USER_ID;
            });

            const nextPhotos = photos.filter(function (photo) {
                return photo.userId !== LOGIN_USER_ID;
            });

            Object.keys(replies).forEach(function (commentId) {
                const replyList = Array.isArray(replies[commentId])
                    ? replies[commentId]
                    : [];

                replies[commentId] = replyList.filter(function (reply) {
                    return reply.userId !== LOGIN_USER_ID;
                });

                if (replies[commentId].length === 0) {
                    delete replies[commentId];
                }
            });

            saveJSON(getCommentKey(foodId), nextComments);
            saveJSON(getPhotoKey(foodId), nextPhotos);
            saveJSON(getReplyKey(foodId), replies);
        });
    }

    function removeMyDataFromCustomFoods() {
        const customFoodList = getCustomFoodList();

        const nextCustomFoodList = customFoodList.map(function (food) {
            const nextCommentList = Array.isArray(food.commentList)
                ? food.commentList.filter(function (comment) {
                    return comment.userId !== LOGIN_USER_ID;
                })
                : [];

            const nextPhotos = Array.isArray(food.photos)
                ? food.photos.filter(function (photo) {
                    return !(photo && photo.userId === LOGIN_USER_ID);
                })
                : [];

            return {
                ...food,
                commentList: nextCommentList,
                photos: nextPhotos,
                comments: nextCommentList.length,
                image: nextPhotos[0] && nextPhotos[0].src
                    ? nextPhotos[0].src
                    : (food.image || DEFAULT_IMAGE)
            };
        });

        saveCustomFoodList(nextCustomFoodList);
    }

    // ================================
    // 10-1. 음식별 내 작성내용 삭제
    // 태그 / 사진 / 코멘트 / 의견(대댓글)
    // ================================

    function deleteMyActivityByFoodId(foodId) {
        const targetFood = getAllFoodList().find(function (food) {
            return String(food.id) === String(foodId);
        });

        if (!targetFood) {
            alert('음식 정보를 찾을 수 없어요.');
            return;
        }

        const confirmDelete = confirm(
            `"${targetFood.name}"에 작성한 내 태그, 사진, 코멘트, 의견을 모두 삭제할까요?`
        );

        if (!confirmDelete) {
            return;
        }

        removeMyCommentsByFoodId(foodId);
        removeMyRepliesByFoodId(foodId);
        removeMyPhotosByFoodId(foodId);
        removeMyTagsByFoodId(foodId);
        removeMyActivityFromCustomFood(foodId);

        alert('내 작성내용이 삭제됐어요.');

        renderMyPage();
    }

    function removeMyCommentsByFoodId(foodId) {
        const comments = readJSON(getCommentKey(foodId), []);

        const nextComments = comments.filter(function (comment) {
            return comment.userId !== LOGIN_USER_ID;
        });

        saveJSON(getCommentKey(foodId), nextComments);
    }

    function removeMyRepliesByFoodId(foodId) {
        const replies = readJSON(getReplyKey(foodId), {});

        Object.keys(replies).forEach(function (commentId) {
            const replyList = Array.isArray(replies[commentId])
                ? replies[commentId]
                : [];

            replies[commentId] = replyList.filter(function (reply) {
                return reply.userId !== LOGIN_USER_ID;
            });

            if (replies[commentId].length === 0) {
                delete replies[commentId];
            }
        });

        saveJSON(getReplyKey(foodId), replies);
    }

    function removeMyPhotosByFoodId(foodId) {
        const photos = readJSON(getPhotoKey(foodId), []);

        const nextPhotos = photos.filter(function (photo) {
            return photo.userId !== LOGIN_USER_ID;
        });

        saveJSON(getPhotoKey(foodId), nextPhotos);
    }

    function removeMyTagsByFoodId(foodId) {
        const myTags = readJSON(getMyTagsKey(foodId), []);
        const foodTags = readJSON(getFoodTagsKey(foodId), []);

        if (myTags.length > 0) {
            const nextFoodTags = foodTags.filter(function (tag) {
                return !myTags.includes(tag);
            });

            saveJSON(getFoodTagsKey(foodId), nextFoodTags);
        }

        localStorage.removeItem(getMyTagsKey(foodId));
    }

    function removeMyActivityFromCustomFood(foodId) {
        const customFoodList = getCustomFoodList();

        const nextCustomFoodList = customFoodList.map(function (food) {
            if (String(food.id) !== String(foodId)) {
                return food;
            }

            const myCommentTags = [];

            const nextCommentList = Array.isArray(food.commentList)
                ? food.commentList.filter(function (comment) {
                    if (comment.userId === LOGIN_USER_ID && Array.isArray(comment.tags)) {
                        myCommentTags.push(...comment.tags);
                    }

                    return comment.userId !== LOGIN_USER_ID;
                })
                : [];

            const nextPhotos = Array.isArray(food.photos)
                ? food.photos.filter(function (photo) {
                    return !(photo && photo.userId === LOGIN_USER_ID);
                })
                : [];

            const nextTags = Array.isArray(food.tags)
                ? food.tags.filter(function (tag) {
                    return !myCommentTags.includes(tag);
                })
                : [];

            return {
                ...food,
                tags: nextTags,
                photos: nextPhotos,
                commentList: nextCommentList,
                comments: nextCommentList.length,
                image: nextPhotos[0] && nextPhotos[0].src
                    ? nextPhotos[0].src
                    : (food.image || DEFAULT_IMAGE)
            };
        });

        saveCustomFoodList(nextCustomFoodList);
    }

    // ================================
    // 10-2. 음식별 내 추천 모두 삭제
    // 내 추천 수 초기화 + 전체 추천 수 차감
    // ================================

    function addMyLikeByFoodId(foodId) {
        const targetFood = getAllFoodList().find(function (food) {
            return String(food.id) === String(foodId);
        });

        if (!targetFood) {
            alert('음식 정보를 찾을 수 없어요.');
            return;
        }

        const currentMyLikeCount = readNumber(getMyLikeKey(foodId));
        const currentTotalAddedLike = readNumber(getTotalLikeKey(foodId));

        saveNumber(getMyLikeKey(foodId), currentMyLikeCount + 1);
        saveNumber(getTotalLikeKey(foodId), currentTotalAddedLike + 1);

        renderMyPage();
    }
    
    function deleteMyLikeByFoodId(foodId) {
        const targetFood = getAllFoodList().find(function (food) {
            return String(food.id) === String(foodId);
        });

        if (!targetFood) {
            alert('음식 정보를 찾을 수 없어요.');
            return;
        }

        const myLikeCount = readNumber(getMyLikeKey(foodId));

        if (myLikeCount <= 0) {
            alert('삭제할 추천 기록이 없어요.');
            renderMyPage();
            return;
        }

        const confirmDelete = confirm(
            `"${targetFood.name}"에 누른 내 추천 ${myLikeCount}회를 모두 삭제할까요?`
        );

        if (!confirmDelete) {
            return;
        }

        const currentTotalAddedLike = readNumber(getTotalLikeKey(foodId));
        const nextTotalAddedLike = Math.max(0, currentTotalAddedLike - myLikeCount);

        saveNumber(getTotalLikeKey(foodId), nextTotalAddedLike);
        localStorage.removeItem(getMyLikeKey(foodId));

        // 예전 코드에서 쓰던 key가 남아 있을 수 있으므로 같이 정리
        localStorage.removeItem(`omechu_wiki_food_${foodId}_my_like_${LOGIN_USER_ID}`);
        localStorage.removeItem(`omechu_wiki_detail_my_like_${foodId}_${LOGIN_USER_ID}`);

        alert('내 추천 기록이 삭제됐어요.');

        renderMyPage();
    }

    // ================================
    // 11. 로그아웃
    // ================================

    function handleLogout() {
        const confirmLogout = confirm('로그아웃할까요?');

        if (!confirmLogout) {
            return;
        }

        clearLoginInfo();

        alert('로그아웃됐어요.');

        location.href = '../index.html';
    }


    // ================================
    // 12. 상세 페이지 이동
    // ================================

    function moveToDetailByCard(card) {
        if (!card) {
            return;
        }

        const foodId = card.dataset.foodId;

        if (!foodId) {
            return;
        }

        location.href = `./wiki_detail.html?id=${foodId}`;
    }

    function handleLikedFoodClick(event) {
        const pageButton = event.target.closest('.my_page_btn');

        if (pageButton) {
            handlePaginationClick(pageButton);
            return;
        }

        const detailButton = event.target.closest('.go_detail_btn');
        const deleteButton = event.target.closest('.delete_my_like_btn');
        const addLikeButton = event.target.closest('.add_like_btn');

        const card = event.target.closest('.my_food_card');

        if (!card) {
            return;
        }

        if (detailButton) {
            moveToDetailByCard(card);
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

    function handleLikedFoodClick(event) {
        const detailButton = event.target.closest('.go_detail_btn');
        const deleteButton = event.target.closest('.delete_my_like_btn');
        const addLikeButton = event.target.closest('.add_like_btn');

        const card = event.target.closest('.my_food_card');

        if (!card) {
            return;
        }

        if (detailButton) {
            moveToDetailByCard(card);
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
    // 13. 이벤트 연결
    // ================================

    el.logoutBtn.addEventListener('click', handleLogout);

    el.editAccountBtn.addEventListener('click', openAccountOverlay);
    el.accountOverlayCloseBtn.addEventListener('click', closeAccountOverlay);
    el.accountOverlayBg.addEventListener('click', closeAccountOverlay);
    el.accountEditForm.addEventListener('submit', handleAccountEditSubmit);

    el.deleteAccountBtn.addEventListener('click', openDeleteOverlay);
    el.deleteOverlayCloseBtn.addEventListener('click', closeDeleteOverlay);
    el.deleteOverlayBg.addEventListener('click', closeDeleteOverlay);
    el.deleteConfirmBtn.addEventListener('click', handleDeleteAccount);

    el.myJoinedFoodList.addEventListener('click', handleJoinedFoodClick);
    el.myLikedFoodList.addEventListener('click', handleLikedFoodClick);

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
            return;
        }

        if (!el.accountOverlay.classList.contains('hidden')) {
            closeAccountOverlay();
            return;
        }

        if (!el.deleteOverlay.classList.contains('hidden')) {
            closeDeleteOverlay();
        }
    });


    // ================================
    // 14. 실행
    // ================================

    renderMyPage();
})();