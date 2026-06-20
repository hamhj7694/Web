// ================================
// wiki_write.js
// 위키 작성 페이지 기능
// 로그인 체크 / 이미지 미리보기 + 압축 / 자동 저장 / 중복 음식 취합 등록
// ================================


// ================================
// 0. 로그인 여부 확인
// ================================

const isLogin = localStorage.getItem('omechu_is_login') === 'true';
const loginUserId = localStorage.getItem('omechu_user_id');
const loginUserNickname = localStorage.getItem('omechu_user_nickname') || '익명';

if (!isLogin || !loginUserId) {
    alert('로그인이 필요한 페이지예요!');
    location.href = './login/login.html';
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


// ================================
// 2. 기본 설정
// ================================

const CUSTOM_FOOD_STORAGE_KEY = 'omechu_wiki_custom_foods';
const WRITE_FORM_STORAGE_KEY = `omechu_wiki_write_form_${loginUserId}`;

// 이미지 최대 용량 기준
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// 이미지 최대 가로/세로 크기
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;

// 압축 품질
const IMAGE_QUALITY = 0.8;

// 선택된 이미지 base64 데이터
let selectedImageData = '';


// ================================
// 3. 기본 음식 인덱스
// wiki.js / wiki_detail.js의 기본 음식과 맞춰야 함
// ================================

const DEFAULT_FOOD_INDEX = [
    { id: 1, name: '제육볶음', category: '한식' },
    { id: 2, name: '김치찌개', category: '한식' },
    { id: 3, name: '치킨', category: '야식' },
    { id: 4, name: '짜장면', category: '중식' },
    { id: 5, name: '마라탕', category: '중식' },
    { id: 6, name: '초밥', category: '일식' },
    { id: 7, name: '파스타', category: '양식' },
    { id: 8, name: '떡볶이', category: '분식' },
    { id: 9, name: '라면', category: '분식' },
    { id: 10, name: '샐러드', category: '기타' },
    { id: 11, name: '돈까스', category: '일식' },
    { id: 12, name: '피자', category: '양식' }
];


// ================================
// 4. 공통 유틸
// ================================

function readStorage(key, fallbackValue) {
    const savedData = localStorage.getItem(key);

    if (!savedData) return fallbackValue;

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error(`${key} 데이터를 불러오지 못했습니다.`, error);
        return fallbackValue;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function readCustomFoodList() {
    return readStorage(CUSTOM_FOOD_STORAGE_KEY, []);
}

function saveCustomFoodList(foodList) {
    saveStorage(CUSTOM_FOOD_STORAGE_KEY, foodList);
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

function makeHashTag(value) {
    const cleanValue = String(value || '').trim();

    if (!cleanValue) return '';

    return cleanValue.startsWith('#') ? cleanValue : `#${cleanValue}`;
}

function normalizeFoodName(name) {
    return String(name || '')
        .trim()
        .replace(/\s+/g, '')
        .toLowerCase();
}

function isSameFood(aName, aCategory, bName, bCategory) {
    return normalizeFoodName(aName) === normalizeFoodName(bName) &&
        String(aCategory || '').trim() === String(bCategory || '').trim();
}

function findDefaultFood(foodName, category) {
    return DEFAULT_FOOD_INDEX.find(function(food) {
        return isSameFood(food.name, food.category, foodName, category);
    });
}

function findCustomFood(customFoodList, foodName, category) {
    return customFoodList.find(function(food) {
        return isSameFood(food.name, food.category, foodName, category);
    });
}


// ================================
// 5. 이미지 미리보기 + 자동 압축
// ================================

function clearImageState() {
    selectedImageData = '';

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
// 9. 중복 음식 취합 처리
// ================================

function makeNewComment(comment, tags) {
    return {
        id: `user_comment_${Date.now()}`,
        userId: loginUserId,
        user: loginUserNickname,
        text: comment,
        date: todayText(),
        timePeriod: currentMealTime(),
        tags: tags.slice(0, 3)
    };
}

function makeNewPhoto() {
    return {
        id: `user_photo_${Date.now()}`,
        src: selectedImageData,
        userId: loginUserId,
        user: loginUserNickname,
        date: todayText()
    };
}

function mergeIntoCustomFood(customFood, comment, tags) {
    const newComment = makeNewComment(comment, tags);

    customFood.tags = Array.from(new Set([
        ...(customFood.tags || []),
        ...tags
    ]));

    customFood.photos = [
        makeNewPhoto(),
        ...(customFood.photos || [])
    ];

    customFood.commentList = [
        newComment,
        ...(customFood.commentList || [])
    ];

    customFood.comments = Number(customFood.comments || 0) + 1;

    customFood.description = comment;
    customFood.summary = comment;

    // 대표 이미지는 최신 사진으로 갱신
    customFood.image = selectedImageData;
}

function mergeIntoDefaultFood(defaultFoodId, comment, tags) {
    const photoStorageKey = `omechu_food_${defaultFoodId}_photos`;
    const commentStorageKey = `omechu_food_${defaultFoodId}_comments`;
    const tagStorageKey = `omechu_food_${defaultFoodId}_tags`;
    const myTagStorageKey = `omechu_food_${defaultFoodId}_my_tags_${loginUserId}`;

    const savedPhotos = readStorage(photoStorageKey, []);
    const savedComments = readStorage(commentStorageKey, []);
    const savedTags = readStorage(tagStorageKey, []);
    const savedMyTags = readStorage(myTagStorageKey, []);

    savedPhotos.unshift(makeNewPhoto());
    savedComments.unshift(makeNewComment(comment, tags));

    const nextTags = Array.from(new Set([
        ...savedTags,
        ...tags
    ]));

    const nextMyTags = Array.from(new Set([
        ...savedMyTags,
        ...tags
    ]));

    saveStorage(photoStorageKey, savedPhotos);
    saveStorage(commentStorageKey, savedComments);
    saveStorage(tagStorageKey, nextTags);
    saveStorage(myTagStorageKey, nextMyTags);
}


// ================================
// 10. 위키 등록 처리
// ================================

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

    if (!comment) {
        alert('코멘트를 입력해주세요!');
        if (foodCommentInput) foodCommentInput.focus();
        return;
    }

    // 요청사항 1. 사진이 없으면 등록 불가
    if (!selectedImageData) {
        alert('사진을 등록해주세요! 사진이 없으면 위키를 등록할 수 없어요.');
        if (foodImageInput) foodImageInput.focus();
        return;
    }

    const tags = getAllWriteTags(category);
    const customFoodList = readCustomFoodList();

    // 요청사항 2-1. 커스텀 음식 중 같은 이름 + 같은 카테고리면 취합
    const sameCustomFood = findCustomFood(customFoodList, foodName, category);

    if (sameCustomFood) {
        mergeIntoCustomFood(sameCustomFood, comment, tags);

        saveCustomFoodList(customFoodList);

        localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
        resetWriteForm();

        alert('이미 있는 메뉴라서 기존 위키에 합쳐졌어요!');

        location.href = `./wiki_detail.html?id=${sameCustomFood.id}`;
        return;
    }

    // 요청사항 2-2. 기본 음식 중 같은 이름 + 같은 카테고리면 기존 상세로 취합
    const sameDefaultFood = findDefaultFood(foodName, category);

    if (sameDefaultFood) {
        mergeIntoDefaultFood(sameDefaultFood.id, comment, tags);

        localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
        resetWriteForm();

        alert('이미 있는 메뉴라서 기존 위키에 합쳐졌어요!');

        location.href = `./wiki_detail.html?id=${sameDefaultFood.id}`;
        return;
    }

    // 완전히 새로운 음식이면 새 위키 생성
    const newFoodId = Date.now();
    const newComment = makeNewComment(comment, tags);

    const newFood = {
        id: newFoodId,
        name: foodName,
        category: category,
        image: selectedImageData,

        // wiki.js 목록용
        description: comment,
        tags: tags,
        likes: 0,
        comments: 1,
        hits: 0,

        // wiki_detail.js 상세용
        summary: comment,
        photos: [makeNewPhoto()],
        commentList: [newComment]
    };

    customFoodList.unshift(newFood);
    saveCustomFoodList(customFoodList);

    localStorage.removeItem(WRITE_FORM_STORAGE_KEY);
    resetWriteForm();

    alert('위키가 등록됐어요!');

    location.href = `./wiki_detail.html?id=${newFoodId}`;
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