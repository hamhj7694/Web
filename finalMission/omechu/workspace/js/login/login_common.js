// ================================
// 로그인 공통 UI / 권한 제어
// ================================

(function() {
    const isLogin = localStorage.getItem('omechu_is_login') === 'true';
    const loginUserNickname = localStorage.getItem('omechu_user_nickname');

    // ================================
    // 1. 현재 페이지 위치에 맞는 경로 반환
    // ================================

    function getAuthPath(type) {
        const path = location.pathname;

        const isLoginPage = path.includes('/page/login/');
        const isPageFolder = path.includes('/page/') && !isLoginPage;

        if (type === 'login') {
            if (isLoginPage) return './login.html';
            if (isPageFolder) return './login/login.html';
            return './page/login/login.html';
        }

        if (type === 'mypage') {
            if (isLoginPage) return '../mypage.html';
            if (isPageFolder) return './mypage.html';
            return './page/mypage.html';
        }

        if (type === 'wikiWrite') {
            if (isLoginPage) return '../wiki_write.html';
            if (isPageFolder) return './wiki_write.html';
            return './page/wiki_write.html';
        }

        if (type === 'home') {
            if (isLoginPage) return '../../index.html';
            if (isPageFolder) return '../index.html';
            return './index.html';
        }

        return './index.html';
    }

    function goLogin(message) {
        alert(message);
        location.href = getAuthPath('login');
    }


    // ================================
    // 2. 헤더 로그인 버튼 변경
    // ================================

    const loginLink = document.querySelector('.login-link');

    if (loginLink) {
        if (isLogin) {
            loginLink.href = getAuthPath('mypage');

            if (loginUserNickname) {
                loginLink.textContent = `👤 ${loginUserNickname}님`;
            } else {
                loginLink.textContent = '👤 마이페이지';
            }
        } else {
            loginLink.href = getAuthPath('login');
            loginLink.textContent = '👤 로그인';
        }
    }


    // ================================
    // 3. 마이페이지 nav 권한 처리
    // ================================

    const myPageLinks = document.querySelectorAll('a.my');

    myPageLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            if (isLogin) {
                return;
            }

            event.preventDefault();

            goLogin('로그인이 필요한 페이지예요!');
        });
    });


    // ================================
    // 4. 위키 작성 버튼 권한 처리
    // ================================

    document.addEventListener('click', function(event) {
        const wikiWriteButton = event.target.closest('.wiki_write');

        if (!wikiWriteButton) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!isLogin) {
            goLogin('로그인이 필요한 기능이에요!');
            return;
        }

        location.href = getAuthPath('wikiWrite');
    }, true);


    // ================================
    // 4-2. 비로그인 상태일 때 작성 영역 UI 변경
    // ================================
    // 주의: wiki_detail.js가 먼저 DOM 요소를 찾고 이벤트를 걸 수 있도록
    // DOMContentLoaded 이후에 화면만 교체

    if (!isLogin) {
        document.addEventListener('DOMContentLoaded', function() {
            renderGuestOnlyAreas();
        });
    }

    function renderGuestOnlyAreas() {
        // 태그 추가 영역 변경
        const tagAddBox = document.querySelector('.tag_add_box');

        if (tagAddBox) {
            tagAddBox.innerHTML = `
                <div class="login_required_box">
                    <p>로그인 하면 태그를 추가할 수 있어요!</p>
                    <button type="button" class="login_required_btn">
                        로그인 하기
                    </button>
                </div>
            `;
        }

        // 상세 페이지 기본 코멘트 작성 영역 변경
        const commentWriteBox = document.querySelector('.comment_write:not(.comment_overlay_write)');

        if (commentWriteBox) {
            commentWriteBox.innerHTML = `
                <div class="login_required_box">
                    <p>로그인 하면 코멘트를 남길 수 있어요!</p>
                    <button type="button" class="login_required_btn">
                        로그인 하기
                    </button>
                </div>
            `;
        }

        // 코멘트 오버레이 안 작성 영역 변경
        const commentOverlayWriteBox = document.querySelector('.comment_overlay_write');

        if (commentOverlayWriteBox) {
            commentOverlayWriteBox.innerHTML = `
                <div class="login_required_box">
                    <p>로그인 하면 코멘트를 남길 수 있어요!</p>
                    <button type="button" class="login_required_btn">
                        로그인 하기
                    </button>
                </div>
            `;
        }

        // 사진 추가 오버레이 안쪽 영역 변경
        const photoAddPanel = document.querySelector('.photo_add_panel');

        if (photoAddPanel) {
            // 이미 로그인 유도 박스가 있으면 중복 생성 방지
            const existingLoginBox = photoAddPanel.querySelector('.login_required_box');

            if (!existingLoginBox) {
                const photoAddDesc = photoAddPanel.querySelector('.photo_add_desc');
                const photoAddUploadBox = photoAddPanel.querySelector('.photo_add_upload_box');
                const photoPreviewBox = photoAddPanel.querySelector('#photoPreviewBox');
                const photoAddSubmitBtn = photoAddPanel.querySelector('#photoAddSubmitBtn');

                if (photoAddDesc) {
                    photoAddDesc.remove();
                }

                if (photoAddUploadBox) {
                    photoAddUploadBox.remove();
                }

                if (photoPreviewBox) {
                    photoPreviewBox.remove();
                }

                if (photoAddSubmitBtn) {
                    photoAddSubmitBtn.remove();
                }

                const photoAddHeader = photoAddPanel.querySelector('.photo_add_header');

                if (photoAddHeader) {
                    photoAddHeader.insertAdjacentHTML('afterend', `
                        <div class="login_required_box">
                            <p>로그인 하면 사진을 추가할 수 있어요!</p>
                            <button type="button" class="login_required_btn">
                                로그인 하기
                            </button>
                        </div>
                    `);
                }
            }
        }
    }

    // 비로그인 상태에서는 코멘트 시간 선택 숨기기
    const commentTimeSelect = document.querySelector('#commentTimeSelect');
    const commentOverlayTimeSelect = document.querySelector('#commentOverlayTimeSelect');

    if (commentTimeSelect) {
        commentTimeSelect.classList.add('hidden');
    }

    if (commentOverlayTimeSelect) {
        commentOverlayTimeSelect.classList.add('hidden');
    }
    // ================================
    // 5. 추천 / 하트 기능 로그인 필요 처리
    // ================================

    document.addEventListener('click', function(event) {
        const likeButton = event.target.closest(
            `
            .heart,
            .recommend_btn,
            .like_btn,
            .food_like_btn,
            .wiki_like_btn,
            #likeBtn
            `
        );

        if (!likeButton) {
            return;
        }

        if (isLogin) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        goLogin('추천은 로그인 후 이용할 수 있어요!');
    }, true);


    // ================================
    // 6. 사진 / 코멘트 / 대댓글 / 태그 등록 로그인 필요 처리
    // ================================
    // 오버레이 열기 버튼은 막지 않음.
    // 실제 등록/작성/추가/삭제 버튼만 막음.

    document.addEventListener('click', function(event) {
        const loginRequiredActionButton = event.target.closest(
            `
            #photoAddSubmitBtn,
            #commentSubmitBtn,
            #commentOverlaySubmitBtn,
            #replySubmitBtn,
            .reply_submit_btn,
            .reply_write_btn,
            .comment_reply_btn,
            .comment_reply_submit,
            #tagAddSubmitBtn,
            #tagDeleteBtn
            `
        );

        if (!loginRequiredActionButton) {
            return;
        }

        if (isLogin) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const message = getLoginRequiredMessage(loginRequiredActionButton);

        goLogin(message);
    }, true);


    // ================================
    // 7. 입력창 클릭 시 로그인 필요 처리
    // ================================
    // 비로그인 상태에서 textarea/input에 먼저 쓰는 것도 방지하고 싶을 때 사용.
    // 오버레이는 열리지만, 입력하려고 하면 로그인으로 보냄.

    document.addEventListener('focusin', function(event) {
        const loginRequiredInput = event.target.closest(
            `
            #commentInput,
            #commentOverlayInput,
            #replyInput,
            .reply_input,
            .comment_reply_input,
            #detailCustomTagsInput,
            #photoFileInput
            `
        );

        if (!loginRequiredInput) {
            return;
        }

        if (isLogin) {
            return;
        }

        event.preventDefault();

        const message = getLoginRequiredMessage(loginRequiredInput);

        goLogin(message);
    });

    // ================================
    // 7-2. 로그인 유도 버튼 클릭 처리
    // ================================
    // 나중에 JS로 생성된 .login_required_btn도 모두 작동하게 처리

    document.addEventListener('click', function(event) {
        const loginRequiredBtn = event.target.closest('.login_required_btn');

        if (!loginRequiredBtn) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        location.href = getAuthPath('login');
    });

    // ================================
    // 8. 기능별 안내 문구
    // ================================

    function getLoginRequiredMessage(target) {
        if (
            target.matches('#photoAddSubmitBtn') ||
            target.matches('#photoFileInput')
        ) {
            return '사진 추가는 로그인 후 이용할 수 있어요!';
        }

        if (
            target.matches('#commentSubmitBtn') ||
            target.matches('#commentOverlaySubmitBtn') ||
            target.matches('#commentInput') ||
            target.matches('#commentOverlayInput')
        ) {
            return '코멘트 작성은 로그인 후 이용할 수 있어요!';
        }

        if (
            target.matches('#replySubmitBtn') ||
            target.matches('.reply_submit_btn') ||
            target.matches('.reply_write_btn') ||
            target.matches('.comment_reply_btn') ||
            target.matches('.comment_reply_submit') ||
            target.matches('#replyInput') ||
            target.matches('.reply_input') ||
            target.matches('.comment_reply_input')
        ) {
            return '의견 작성은 로그인 후 이용할 수 있어요!';
        }

        if (
            target.matches('#tagAddSubmitBtn') ||
            target.matches('#tagDeleteBtn') ||
            target.matches('#detailCustomTagsInput')
        ) {
            return '태그 추가/삭제는 로그인 후 이용할 수 있어요!';
        }

        return '로그인이 필요한 기능이에요!';
    }

})();