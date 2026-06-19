// ================================
// mypage.js
// 마이페이지 기능
// 프로필 / 로그아웃 / 계정 수정 / 탈퇴 / 내 활동 출력
// ================================

(function() {
    // ================================
    // 1. 음식 기본 데이터
    // ================================
    // wiki.js / wiki_detail.js와 id를 맞춰야 함

    const foodList = [
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

    const $ = function(selector) {
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
    // 3. 로그인 확인
    // ================================

    const IS_LOGIN = localStorage.getItem('omechu_is_login') === 'true';
    const LOGIN_USER_ID = localStorage.getItem('omechu_user_id') || '';

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
    // 4. 공통 localStorage 유틸
    // ================================

    function readJSON(key, fallbackValue) {
        const data = localStorage.getItem(key);

        if (!data) {
            return fallbackValue;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error(`${key} 데이터를 읽는 중 오류가 발생했습니다.`, error);
            return fallbackValue;
        }
    }

    function saveJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getSavedUsers() {
        return readJSON('omechu_users', []);
    }

    function getCurrentUser() {
        const users = getSavedUsers();

        return users.find(function(user) {
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


    // ================================
    // 5. 음식별 저장 key
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

    function getWikiListMyLikeKey(foodId) {
        return `omechu_wiki_food_${foodId}_my_like_${LOGIN_USER_ID}`;
    }

    function getWikiDetailMyLikeKey(foodId) {
        return `omechu_wiki_detail_my_like_${foodId}_${LOGIN_USER_ID}`;
    }

    function getWikiListLikeCountKey(foodId) {
        return `omechu_wiki_food_${foodId}_like_count`;
    }


    // ================================
    // 6. 내 활동 데이터 만들기
    // ================================

    function getMyFoodActivity(food) {
        const savedComments = readJSON(getCommentKey(food.id), []);
        const savedReplies = readJSON(getReplyKey(food.id), {});
        const savedPhotos = readJSON(getPhotoKey(food.id), []);

        const myComments = savedComments.filter(function(comment) {
            return comment.userId === LOGIN_USER_ID;
        });

        let myReplyCount = 0;

        Object.keys(savedReplies).forEach(function(commentId) {
            const replies = savedReplies[commentId] || [];

            replies.forEach(function(reply) {
                if (reply.userId === LOGIN_USER_ID) {
                    myReplyCount += 1;
                }
            });
        });

        const myPhotos = savedPhotos.filter(function(photo) {
            return photo.userId === LOGIN_USER_ID;
        });

        const likedFromWikiList = localStorage.getItem(getWikiListMyLikeKey(food.id)) === 'true';
        const likedFromDetail = localStorage.getItem(getWikiDetailMyLikeKey(food.id)) === 'true';
        const isLiked = likedFromWikiList || likedFromDetail;

        const addedLikeCount = Number(localStorage.getItem(getWikiListLikeCountKey(food.id))) || 0;

        return {
            foodId: food.id,
            foodName: food.name,
            foodImage: food.image,
            foodCategory: food.category,

            commentCount: myComments.length,
            replyCount: myReplyCount,
            photoCount: myPhotos.length,

            isLiked: isLiked,
            likedCount: isLiked ? 1 : 0,

            totalLikeCount: food.likes + addedLikeCount
        };
    }

    function getMyActivities() {
        return foodList.map(function(food) {
            return getMyFoodActivity(food);
        });
    }

    function getJoinedFoods() {
        return getMyActivities().filter(function(activity) {
            return (
                activity.commentCount > 0 ||
                activity.replyCount > 0 ||
                activity.photoCount > 0
            );
        });
    }

    function getLikedFoods() {
        return getMyActivities().filter(function(activity) {
            return activity.isLiked;
        });
    }


    // ================================
    // 7. 화면 출력
    // ================================

    function renderProfile() {
        currentUser = getCurrentUser();

        el.myNickname.textContent = currentUser.nickname || '사용자';
        el.myUserId.textContent = `ID: ${currentUser.id}`;

        el.editNickname.value = currentUser.nickname || '';
    }

    function renderMyPage() {
        renderProfile();

        const joinedFoods = getJoinedFoods();
        const likedFoods = getLikedFoods();

        el.myJoinFoodCount.textContent = joinedFoods.length;
        el.myLikedFoodCount.textContent = likedFoods.length;

        renderJoinedFoods(joinedFoods);
        renderLikedFoods(likedFoods);
    }

    function renderJoinedFoods(joinedFoods) {
        if (joinedFoods.length === 0) {
            el.myJoinedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 참여한 음식이 없어요.<br>
                    태그, 코멘트, 사진을 추가해보세요!
                </p>
            `;
            return;
        }

        el.myJoinedFoodList.innerHTML = joinedFoods.map(function(food) {
            return `
                <div class="my_food_card" data-food-id="${food.foodId}">
                    <img 
                        class="my_food_img" 
                        src="${food.foodImage}" 
                        alt="${food.foodName}"
                        onerror="this.onerror=null; this.src='../assets/home/char_main.png'"
                    >

                    <div class="my_food_info">
                        <h3>${food.foodName}</h3>
                        <p>
                            코멘트 ${food.commentCount}개 · 
                            의견 ${food.replyCount}개 · 
                            사진 ${food.photoCount}개
                        </p>
                    </div>

                    <button type="button" class="my_food_btn go_detail_btn">
                        보기
                    </button>
                </div>
            `;
        }).join('');
    }

    function renderLikedFoods(likedFoods) {
        if (likedFoods.length === 0) {
            el.myLikedFoodList.innerHTML = `
                <p class="my_empty_text">
                    아직 추천한 음식이 없어요.<br>
                    마음에 드는 음식에 추천을 눌러보세요!
                </p>
            `;
            return;
        }

        el.myLikedFoodList.innerHTML = likedFoods.map(function(food) {
            return `
                <div class="my_food_card" data-food-id="${food.foodId}">
                    <img 
                        class="my_food_img" 
                        src="${food.foodImage}" 
                        alt="${food.foodName}"
                        onerror="this.onerror=null; this.src='../assets/home/char_main.png'"
                    >

                    <div class="my_food_info">
                        <h3>${food.foodName}</h3>
                        <p>
                            내가 추천한 음식<br>
                            현재 추천 ${food.totalLikeCount}회
                        </p>
                    </div>

                    <button type="button" class="my_food_btn go_detail_btn">
                        보기
                    </button>
                </div>
            `;
        }).join('');
    }


    // ================================
    // 8. 계정 변경
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

        const userIndex = users.findIndex(function(user) {
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
    // 9. 계정 탈퇴
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

        users = users.filter(function(user) {
            return user.id !== LOGIN_USER_ID;
        });

        saveJSON('omechu_users', users);

        removeMyLikeRecords();
        removeMyWrittenRecords();
    }

    function removeMyLikeRecords() {
        foodList.forEach(function(food) {
            localStorage.removeItem(getWikiListMyLikeKey(food.id));
            localStorage.removeItem(getWikiDetailMyLikeKey(food.id));
        });
    }

    function removeMyWrittenRecords() {
        foodList.forEach(function(food) {
            const comments = readJSON(getCommentKey(food.id), []);
            const replies = readJSON(getReplyKey(food.id), {});
            const photos = readJSON(getPhotoKey(food.id), []);

            const filteredComments = comments.filter(function(comment) {
                return comment.userId !== LOGIN_USER_ID;
            });

            const filteredPhotos = photos.filter(function(photo) {
                return photo.userId !== LOGIN_USER_ID;
            });

            Object.keys(replies).forEach(function(commentId) {
                replies[commentId] = replies[commentId].filter(function(reply) {
                    return reply.userId !== LOGIN_USER_ID;
                });

                if (replies[commentId].length === 0) {
                    delete replies[commentId];
                }
            });

            saveJSON(getCommentKey(food.id), filteredComments);
            saveJSON(getReplyKey(food.id), replies);
            saveJSON(getPhotoKey(food.id), filteredPhotos);
        });
    }


    // ================================
    // 10. 로그아웃
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
    // 11. 이벤트 연결
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

    el.myJoinedFoodList.addEventListener('click', function(event) {
        const detailButton = event.target.closest('.go_detail_btn');

        if (!detailButton) {
            return;
        }

        const card = detailButton.closest('.my_food_card');
        const foodId = card.dataset.foodId;

        location.href = `./wiki_detail.html?id=${foodId}`;
    });

    el.myLikedFoodList.addEventListener('click', function(event) {
        const detailButton = event.target.closest('.go_detail_btn');

        if (!detailButton) {
            return;
        }

        const card = detailButton.closest('.my_food_card');
        const foodId = card.dataset.foodId;

        location.href = `./wiki_detail.html?id=${foodId}`;
    });

    document.addEventListener('keydown', function(event) {
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
    // 12. 실행
    // ================================

    renderMyPage();
})();