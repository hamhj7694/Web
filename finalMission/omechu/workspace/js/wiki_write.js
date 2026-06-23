// ================================
// wiki_write.js
// 위키 작성 페이지 기능
// 로그인 체크 / 이미지 미리보기 + 압축 / 자동 저장 / 중복 음식 취합 등록
// ================================


// ================================
// 0. 로그인 여부 확인
// ================================
const isLogin = localStorage.getItem('omechu_is_login') === 'true';
const loginUserNo = localStorage.getItem('omechu_user_no');

if (!isLogin || !loginUserNo) {
    alert('로그인이 필요한 페이지예요!');
    location.href = './login/login.html';
    throw new Error('로그인이 필요한 페이지입니다.');
}

// ================================
// 1. DOM 가져오기
// ================================

const foodNameInput = document.querySelector('#foodNameInput');
const foodCategorySelect = document.querySelector('#foodCategorySelect');
const foodCommentInput = document.querySelector('#foodCommentInput');
const foodCustomTagsInput = document.querySelector('#foodCustomTagsInput');

const foodImageInput = document.querySelector('#foodImageInput');
const imagePreviewBox = document.querySelector('#imagePreviewBox');
const imagePreview = document.querySelector('#imagePreview');
const fileNameText = document.querySelector('#fileNameText');
const wikiWriteForm = document.querySelector('#wikiWriteForm');
const cancelBtn = document.querySelector('.cancel_btn');

const WIKI_CREATE_API_URL = '../backend/api/wiki/create.php';
const PHOTO_ADD_API_URL = '../backend/api/wiki/photo_add.php';
const COMMENT_ADD_API_URL = '../backend/api/wiki/comment_add.php';
// ================================
// 2. 기본 설정
// ================================

const WRITE_FORM_STORAGE_KEY = `omechu_wiki_write_form_${loginUserNo}`;

// 이미지 최대 용량 기준
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// 이미지 최대 가로/세로 크기
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;

// 압축 품질
const IMAGE_QUALITY = 0.8;

// 선택된 이미지 base64 데이터
let selectedImageData = '';
let selectedImageFile = null;

// ================================
// 3. 기본 음식 인덱스
// wiki.js / wiki_detail.js의 기본 음식과 맞춰야 함
// ================================



// ================================
// 4. 공통 유틸
// ================================

function makeHashTag(value) {
    const cleanValue = String(value || '').trim();

    if (!cleanValue) return '';

    return cleanValue.startsWith('#') ? cleanValue : `#${cleanValue}`;
}

// ================================
// 5. 이미지 미리보기 + 자동 압축
// ================================

function clearImageState() {
    selectedImageData = '';
    selectedImageFile = null;

    if (foodImageInput) {
        foodImageInput.value = '';
    }

    if (imagePreview) {
        imagePreview.src = '';
    }

    if (imagePreviewBox) {
        imagePreviewBox.classList.add('hidden');
    }

    if (fileNameText) {
        fileNameText.textContent = '선택된 이미지가 없어요';
    }
}

function handleImageChange() {
    const file = foodImageInput.files[0];

    if (!file) {
        clearImageState();
        return;
    }

    selectedImageFile = file;
    
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 등록할 수 있어요!');
        clearImageState();
        return;
    }

    if (fileNameText) {
        fileNameText.textContent = file.name;
    }

    resizeImage(file);
}

function resizeImage(file) {
    const reader = new FileReader();

    reader.addEventListener('load', function(event) {
        const img = new Image();

        img.addEventListener('load', function() {
            let width = img.width;
            let height = img.height;

            const ratio = Math.min(
                MAX_IMAGE_WIDTH / width,
                MAX_IMAGE_HEIGHT / height,
                1
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = width;
            canvas.height = height;

            // 투명 PNG가 검게 변하지 않도록 흰 배경 처리
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0, width, height);

            selectedImageData = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);

            if (imagePreview) {
                imagePreview.src = selectedImageData;
            }

            if (imagePreviewBox) {
                imagePreviewBox.classList.remove('hidden');
            }

            if (file.size > MAX_IMAGE_SIZE) {
                console.log('이미지 용량이 커서 자동으로 압축했어요.');
            }

            saveWriteFormData();
        });

        img.src = event.target.result;
    });

    reader.readAsDataURL(file);
}

if (foodImageInput && imagePreviewBox && imagePreview) {
    foodImageInput.addEventListener('change', handleImageChange);
}


// ================================
// 6. 태그 수집
// ================================

function getCheckedValues(name) {
    const checkedInputs = document.querySelectorAll(`input[name="${name}"]:checked`);

    return Array.from(checkedInputs).map(function(input) {
        return input.value;
    });
}

function getSelectedTagValues(name) {
    return getCheckedValues(name)
        .map(function(tag) {
            return makeHashTag(tag);
        })
        .filter(Boolean);
}

function getCustomTagValues() {
    if (!foodCustomTagsInput) return [];

    const value = foodCustomTagsInput.value.trim();

    if (!value) return [];

    return value
        .split(',')
        .map(function(tag) {
            return makeHashTag(tag);
        })
        .filter(Boolean);
}

function getAllWriteTags(category) {
    const tags = [
        makeHashTag(category),
        ...getSelectedTagValues('timeTags'),
        ...getSelectedTagValues('situationTags'),
        ...getCustomTagValues()
    ];

    return Array.from(new Set(tags)).filter(Boolean);
}


// ================================
// 7. 작성값 자동 저장 / 복원
// ================================

function saveWriteFormData() {
    const formData = {
        foodName: foodNameInput ? foodNameInput.value.trim() : '',
        category: foodCategorySelect ? foodCategorySelect.value : '',
        comment: foodCommentInput ? foodCommentInput.value.trim() : '',
        customTags: foodCustomTagsInput ? foodCustomTagsInput.value.trim() : '',
        timeTags: getCheckedValues('timeTags'),
        situationTags: getCheckedValues('situationTags')

        // 이미지 base64는 용량이 클 수 있어서 자동 저장하지 않음
        // 새로고침하면 이미지는 다시 선택하도록 유지
    };

    localStorage.setItem(WRITE_FORM_STORAGE_KEY, JSON.stringify(formData));
}

function restoreWriteFormData() {
    const savedData = localStorage.getItem(WRITE_FORM_STORAGE_KEY);

    if (!savedData) return;

    try {
        const formData = JSON.parse(savedData);

        if (foodNameInput) {
            foodNameInput.value = formData.foodName || '';
        }

        if (foodCategorySelect) {
            foodCategorySelect.value = formData.category || '';
        }

        if (foodCommentInput) {
            foodCommentInput.value = formData.comment || '';
        }

        if (foodCustomTagsInput) {
            foodCustomTagsInput.value = formData.customTags || '';
        }

        restoreCheckedTags('timeTags', formData.timeTags);
        restoreCheckedTags('situationTags', formData.situationTags);

    } catch (error) {
        console.error('작성값을 불러오는 중 오류가 발생했습니다.', error);
    }
}

function restoreCheckedTags(name, savedTags) {
    if (!Array.isArray(savedTags)) return;

    const inputs = document.querySelectorAll(`input[name="${name}"]`);

    inputs.forEach(function(input) {
        input.checked = savedTags.includes(input.value);
    });
}

function connectAutoSaveEvents() {
    const writeFormInputs = [
        foodNameInput,
        foodCategorySelect,
        foodCommentInput,
        foodCustomTagsInput
    ];

    writeFormInputs.forEach(function(input) {
        if (!input) return;

        input.addEventListener('input', saveWriteFormData);
        input.addEventListener('change', saveWriteFormData);
    });

    const writeFormTagInputs = document.querySelectorAll('input[name="timeTags"], input[name="situationTags"]');

    writeFormTagInputs.forEach(function(input) {
        input.addEventListener('change', saveWriteFormData);
    });
}


// ================================
// 8. 폼 초기화
// ================================

function resetWriteForm() {
    if (foodNameInput) foodNameInput.value = '';
    if (foodCategorySelect) foodCategorySelect.value = '';
    if (foodCommentInput) foodCommentInput.value = '';
    if (foodCustomTagsInput) foodCustomTagsInput.value = '';

    document
        .querySelectorAll('input[name="timeTags"], input[name="situationTags"]')
        .forEach(function(input) {
            input.checked = false;
        });

    clearImageState();
}

// ================================
// 10. 위키 등록 처리
// ================================

function saveWikiFoodToDB(foodData) {
    return fetch(WIKI_CREATE_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(foodData)
    })
        .then(function(response) {
            return response.json();
        });
}

function uploadWikiFoodPhoto(foodId) {
    if (!selectedImageFile) {
        return Promise.resolve({
            success: false,
            message: '업로드할 사진이 없어요.'
        });
    }

    const formData = new FormData();

    formData.append('food_id', foodId);
    formData.append('image', selectedImageFile);

    return fetch(PHOTO_ADD_API_URL, {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
        .then(function(response) {
            return response.json();
        });
}

function addWikiFoodComment(foodId, comment, tags) {
    if (!comment || !comment.trim()) {
        return Promise.resolve({
            success: true,
            skipped: true
        });
    }

    return fetch(COMMENT_ADD_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            food_id: foodId,
            content: comment.trim(),
            meal_time: '',
            tags: tags || []
        })
    })
        .then(function(response) {
            return response.json();
        });
}

function submitWikiWriteForm(event) {
    event.preventDefault();

    const foodName = foodNameInput ? foodNameInput.value.trim() : '';
    const category = foodCategorySelect ? foodCategorySelect.value : '';
    const comment = foodCommentInput ? foodCommentInput.value.trim() : '';

    if (!foodName) {
        alert('음식 이름을 입력해주세요!');
        if (foodNameInput) foodNameInput.focus();
        return;
    }

    if (!category) {
        alert('카테고리를 선택해주세요!');
        if (foodCategorySelect) foodCategorySelect.focus();
        return;
    }

    if (!selectedImageFile) {
        alert('사진을 등록해주세요! 사진이 있어야 푸드 위키를 게시할 수 있어요.');
        if (foodImageInput) foodImageInput.focus();
        return;
    }

    const tags = getAllWriteTags(category);
    const times = getCheckedValues('timeTags');
    const situations = getCheckedValues('situationTags');

    const foodData = {
        name: foodName,
        category: category,
        description: comment,
        summary: comment,
        tags: tags,
        situations: situations,
        times: times,
        image: ''
    };

    if (wikiWriteForm) {
        const submitButton = wikiWriteForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '등록 중...';
        }
    }

    saveWikiFoodToDB(foodData)
        .then(function(data) {
            if (!data.success) {
                alert(data.message || '푸드 위키 등록에 실패했어요.');
                return;
            }

            const foodId = data.food && data.food.id ? data.food.id : '';

            if (!foodId) {
                localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
                resetWriteForm();

                alert(data.message || '푸드 위키가 등록됐어요!');
                location.href = './wiki.html';
                return;
            }

            Promise.all([
                uploadWikiFoodPhoto(foodId),
                addWikiFoodComment(foodId, comment, tags)
            ])
                .then(function(results) {
                    const photoData = results[0];
                    const commentData = results[1];

                    let warningMessages = [];

                    if (!photoData.success) {
                        warningMessages.push(
                            '사진 저장에 실패했어요.\n' + (photoData.message || '')
                        );
                    }

                    if (!commentData.success) {
                        warningMessages.push(
                            '코멘트 등록에 실패했어요.\n' + (commentData.message || '')
                        );
                    }

                    if (warningMessages.length > 0) {
                        alert(
                            '음식은 등록됐지만 일부 정보 저장에 실패했어요.\n\n' +
                            warningMessages.join('\n\n')
                        );
                    } else {
                        alert(data.message || '푸드 위키가 등록됐어요!');
                    }

                    localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
                    resetWriteForm();

                    location.href = `./wiki_detail.html?id=${foodId}`;
                })
                .catch(function(error) {
                    console.error('추가 정보 저장 실패:', error);

                    alert('음식은 등록됐지만 사진 또는 코멘트 저장 중 오류가 발생했어요.');

                    localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
                    resetWriteForm();

                    location.href = `./wiki_detail.html?id=${foodId}`;
                });
        })
        .catch(function(error) {
            console.error('푸드 위키 등록 실패:', error);
            alert('서버와 통신 중 오류가 발생했어요.');
        })
        .finally(function() {
            if (wikiWriteForm) {
                const submitButton = wikiWriteForm.querySelector('button[type="submit"]');

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '등록하기';
                }
            }
        });
}


// ================================
// 11. 취소 버튼
// ================================

if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
        const isCancel = confirm('작성 페이지를 나갈까요? 작성 중인 내용은 자동 저장돼요.');

        if (!isCancel) return;

        history.back();
    });
}


// ================================
// 12. 이벤트 연결 / 실행
// ================================

connectAutoSaveEvents();
restoreWriteFormData();

if (wikiWriteForm) {
    wikiWriteForm.addEventListener('submit', submitWikiWriteForm);
}