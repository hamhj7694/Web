// ================================
// 0. 로그인 여부 확인
// ================================

const isLogin = localStorage.getItem('omechu_is_login') === 'true';
const loginUserId = localStorage.getItem('omechu_user_id');

if (!isLogin || !loginUserId) {
    alert('로그인이 필요한 페이지예요!');
    location.href = './login/login.html';
}

// ================================
// 이미지 미리보기 + 자동 압축
// ================================

const foodNameInput = document.querySelector('#foodNameInput');
const foodCategorySelect = document.querySelector('#foodCategorySelect');
const foodCommentInput = document.querySelector('#foodCommentInput');
const foodCustomTagsInput = document.querySelector('#foodCustomTagsInput');

const foodImageInput = document.querySelector('#foodImageInput');
const imagePreviewBox = document.querySelector('#imagePreviewBox');
const imagePreview = document.querySelector('#imagePreview');

// 이미지 최대 용량 기준
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// 이미지 최대 가로/세로 크기
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;

// 압축 품질
const IMAGE_QUALITY = 0.8;

// 나중에 위키 등록할 때 저장할 이미지 데이터
let selectedImageData = '';

if (foodImageInput && imagePreviewBox && imagePreview) {
    foodImageInput.addEventListener('change', function() {
        const file = foodImageInput.files[0];

        if (!file) {
            imagePreview.src = '';
            selectedImageData = '';
            imagePreviewBox.classList.add('hidden');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 등록할 수 있어요!');
            foodImageInput.value = '';
            imagePreview.src = '';
            selectedImageData = '';
            imagePreviewBox.classList.add('hidden');
            return;
        }

        resizeImage(file);
    });
}

function resizeImage(file) {
    const reader = new FileReader();

    reader.addEventListener('load', function(event) {
        const img = new Image();

        img.addEventListener('load', function() {
            let width = img.width;
            let height = img.height;

            // 원본 비율 계산
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

            // 투명 배경 PNG가 검은색으로 변하지 않도록 흰 배경 먼저 깔기
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 흰 배경 위에 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);

            let resizedImageData = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);

            selectedImageData = resizedImageData;

            imagePreview.src = selectedImageData;
            imagePreviewBox.classList.remove('hidden');

            if (file.size > MAX_IMAGE_SIZE) {
                console.log('이미지 용량이 커서 자동으로 압축했어요.');
            }
        });

        img.src = event.target.result;
    });

    reader.readAsDataURL(file);
}

// ==========================
// 취소 버튼 누르면 뒤로 돌아가게
// ==========================
const cancelBtn = document.querySelector('.cancel_btn');

if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
        const isCancel = confirm('작성 페이지를 나갈까요? 작성 중인 내용은 자동 저장돼요.');

        if (!isCancel) return;

        history.back();
    });
}

// ================================
// 로그인 사용자 기준 작성값 저장
// ================================

// 사용자별 작성값 저장 key
const WRITE_FORM_STORAGE_KEY = `omechu_wiki_write_form_${loginUserId}`;

function getCheckedValues(name) {
    const checkedInputs = document.querySelectorAll(`input[name="${name}"]:checked`);

    return Array.from(checkedInputs).map(function(input) {
        return input.value;
    });
}

function saveWriteFormData() {
    const formData = {
        foodName: foodNameInput ? foodNameInput.value.trim() : '',
        category: foodCategorySelect ? foodCategorySelect.value : '',
        comment: foodCommentInput ? foodCommentInput.value.trim() : '',
        customTags: foodCustomTagsInput ? foodCustomTagsInput.value.trim() : '',
        timeTags: getCheckedValues('timeTags'),
        situationTags: getCheckedValues('situationTags')
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

restoreWriteFormData();