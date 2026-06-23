// 옵션 거리 막대
const distanceRange = document.querySelector('.distance_range');

// ================================
// 지도 카테고리 필터 선택
// ================================

const mapFilterBtns = document.querySelectorAll('.map_filter_btn');
const mapFilterList = document.querySelector('.map_filter_list');

// ================================
// 카테고리 리스트 마우스 드래그 스크롤
// ================================

let isFilterDragMoved = false;

if (mapFilterList) {
    let isDraggingFilter = false;
    let startX = 0;
    let startScrollLeft = 0;

    mapFilterList.addEventListener('mousedown', function(event) {
        isDraggingFilter = true;
        isFilterDragMoved = false;

        startX = event.pageX;
        startScrollLeft = mapFilterList.scrollLeft;

        mapFilterList.classList.add('is-dragging');
    });

    mapFilterList.addEventListener('mousemove', function(event) {
        if (!isDraggingFilter) return;

        const moveX = event.pageX - startX;

        if (Math.abs(moveX) > 8) {
            isFilterDragMoved = true;
        }

        mapFilterList.scrollLeft = startScrollLeft - moveX;
    });

    mapFilterList.addEventListener('mouseup', function() {
        isDraggingFilter = false;
        mapFilterList.classList.remove('is-dragging');

        setTimeout(function() {
            isFilterDragMoved = false;
        }, 0);
    });

    mapFilterList.addEventListener('mouseleave', function() {
        isDraggingFilter = false;
        mapFilterList.classList.remove('is-dragging');

        setTimeout(function() {
            isFilterDragMoved = false;
        }, 0);
    });
}

// ================================
// HTML 요소
// ================================

const mapContainer = document.querySelector('#map');
const placeList = document.querySelector('.place_list');
const pageAreaList = document.querySelectorAll('.page');

const pageControlList = Array.from(pageAreaList).map(function(pageArea) {
    const strongList = pageArea.querySelectorAll('strong');
    const buttonList = pageArea.querySelectorAll('button');

    return {
        placeCount: strongList[0],
        pageInfo: strongList[1],
        prevBtn: buttonList[0],
        nextBtn: buttonList[1]
    };
});

const mapSearchInput = document.querySelector('#mapSearchInput');
const mapSearchBtn = document.querySelector('#mapSearchBtn');
const mapResetBtn = document.querySelector('#mapResetBtn');
const currentLocationBtn = document.querySelector('#currentLocationBtn');



// ================================
// 카카오맵 임시 장소 데이터
// ================================

const placeData = [];

// ================================
// 카카오맵 생성 + 마커 표시
// ================================

let kakaoMap = null;
let placeSearch = null;
let mapGeocoder = null;
let currentInfoWindow = null;
let placeMarkers = [];

let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// 기본 fallback 위치: 신림역
const FALLBACK_LAT = 37.484201;
const FALLBACK_LNG = 126.929715;
const FALLBACK_LABEL = '신림역';

// 기본 위치
let nowLat = FALLBACK_LAT;
let nowLng = FALLBACK_LNG;

// 현재 검색 기준 위치
// default: 기본 위치
// gps: 현재 위치 버튼으로 잡은 위치
// searched_place: 검색으로 잡은 지역/장소 위치
// map_center: 사용자가 지도를 드래그해서 잡은 지도 중심
let currentBaseLat = nowLat;
let currentBaseLng = nowLng;
let currentBaseLabel = '기본 위치';
let currentBaseType = 'default';

// 현재 화면에 출력할 장소 데이터
let currentPlaceData = [];

// 현재 검색어
let currentSearchKeyword = '맛집';
// 현재 검색 모드
// food: 음식/카테고리 검색
// location: 지역/장소 기준 검색
// restaurant: 식당명 직접 검색
let currentSearchMode = 'food';
// restaurant 검색 범위
// nearby: 현재 기준 위치 + 선택 거리
// wide: 넓은 주변 검색
// nationwide: 전국 검색
let currentRestaurantSearchScope = 'nearby';

let myLocationMarker = null;

// 최근 검색 조건 저장
const LAST_MAP_SEARCH_KEY = 'omechu_last_map_search';
const RESULT_MAP_KEYWORD_KEY = 'omechu_map_keyword';

// redtable_proxy.php 연결(redtable API)
const REDTABLE_API_URL = '../backend/redtable_proxy.php';

let redTableMenuData = [];
let isRedTableMenuLoaded = false;

// ================================
// 검색어 해석용 키워드
// ================================

const LOCATION_HINT_WORDS = [
    '역', '동', '구', '시', '군', '읍', '면',
    '로', '길', '대학교', '대학', '병원',
    '공원', '터미널', '스타필드', '백화점',
    '마트', '시장'
];

const FOOD_HINT_WORDS = [
    '맛집', '한식', '중식', '일식', '양식', '분식',
    '디저트', '카페', '커피', '파스타', '초밥',
    '버거', '버거킹', '맥도날드', '롯데리아',
    '스타벅스', '치킨', '피자', '국밥', '마라탕',
    '떡볶이', '김밥', '제육', '돈까스', '돈카츠',
    '라멘', '우동', '짜장면', '짬뽕', '탕수육',
    '혼밥', '아침', '점심', '저녁', '야식'
];

// ================================
// 검색어 해석
// ================================

function parseSearchInput(inputValue) {
    const keyword = inputValue.trim().replace(/\s+/g, ' ');

    if (!keyword) {
        return {
            type: 'empty',
            baseKeyword: currentBaseLabel,
            foodKeyword: getCategorySearchKeyword(),
            shouldSearchBaseLocation: false
        };
    }

    const words = keyword.split(' ');
    const lastWord = words[words.length - 1];

    const hasLocationHint = hasLocationKeyword(keyword);
    const lastWordIsFood = isFoodKeyword(lastWord);

    // 예: 신림역 파스타 / 강남 파스타 / 홍대 카페 / 수원 스타필드 버거킹
    if (words.length >= 2 && lastWordIsFood) {
        return {
            type: 'location_food',
            baseKeyword: words.slice(0, -1).join(' '),
            foodKeyword: normalizeFoodKeyword(lastWord),
            shouldSearchBaseLocation: true
        };
    }

    // 예: 신림역 / 강남역 / 수원 스타필드
    if (hasLocationHint && !isFoodKeyword(keyword)) {
        return {
            type: 'location',
            baseKeyword: keyword,
            foodKeyword: getCategorySearchKeyword(),
            shouldSearchBaseLocation: true
        };
    }

    // 예: 파스타 / 버거킹 / 김치찌개
    if (isFoodKeyword(keyword)) {
        return {
            type: 'food',
            baseKeyword: currentBaseLabel,
            foodKeyword: normalizeFoodKeyword(keyword),
            shouldSearchBaseLocation: false
        };
    }

    // 음식 키워드가 아니면 지역/장소 검색으로 보냄
    // 예: 부산, 삼척, 안양, 익산, 동편마을, 신림역
    return {
        type: 'smart',
        baseKeyword: keyword,
        foodKeyword: keyword,
        shouldSearchBaseLocation: false
    };
}

function hasLocationKeyword(keyword) {
    return LOCATION_HINT_WORDS.some(function(word) {
        return keyword.includes(word);
    });
}

function isStationKeyword(keyword) {
    const cleanedKeyword = keyword.trim().replace(/\s+/g, '');

    return cleanedKeyword.endsWith('역');
}

function isFoodKeyword(keyword) {
    return FOOD_HINT_WORDS.some(function(word) {
        return keyword.includes(word);
    });
}

function normalizeFoodKeyword(keyword) {
    if (keyword === '혼밥') return '혼밥 맛집';
    if (keyword === '아침') return '아침 맛집';
    if (keyword === '점심') return '점심 맛집';
    if (keyword === '저녁') return '저녁 맛집';
    if (keyword === '야식') return '야식 맛집';

    return keyword;
}

function getCategorySearchKeyword() {
    const selectedCategory = getSelectedCategory();

    if (selectedCategory === '전체') return '맛집';
    if (selectedCategory === '디저트') return '디저트 카페';

    return `${selectedCategory} 맛집`;
}

function exitRestaurantSearchMode(nextKeyword) {
    currentSearchMode = 'food';
    currentSearchKeyword = nextKeyword || getCategorySearchKeyword();
    currentPage = 1;
}

// redtable API 연동
function loadRedTableMenuData() {
    const MAX_REDTABLE_PAGE = 30;
    const loadedMenuData = [];

    function requestRedTablePage(pageNo) {
        fetch(`${REDTABLE_API_URL}?pageNo=${pageNo}`)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                const pageMenuData = data.body || [];

                console.log(`RedTable ${pageNo}페이지 응답:`, pageMenuData.length);

                if (pageMenuData.length > 0) {
                    loadedMenuData.push(...pageMenuData);
                }

                if (pageMenuData.length === 0 || pageNo >= MAX_REDTABLE_PAGE) {
                    redTableMenuData = loadedMenuData;
                    isRedTableMenuLoaded = true;

                    console.log('RedTable 전체 메뉴 로딩 완료:', redTableMenuData.length);

                    refreshCurrentPlaceMenusFromRedTable();
                    return;
                }

                requestRedTablePage(pageNo + 1);
            })
            .catch(function(error) {
                console.error('RedTable 메뉴 데이터 로딩 실패:', error);

                redTableMenuData = loadedMenuData;
                isRedTableMenuLoaded = loadedMenuData.length > 0;

                refreshCurrentPlaceMenusFromRedTable();
            });
    }

    requestRedTablePage(1);
}

function refreshCurrentPlaceMenusFromRedTable() {
    if (!currentPlaceData || currentPlaceData.length === 0) return;

    currentPlaceData = currentPlaceData.map(function(place) {
        return {
            ...place,
            food: getRepresentativeFoods(place)
        };
    });

    renderPlaceList(currentPlaceData);
}

// ================================
// 카카오 지역/장소 검색
// ================================

function searchBaseLocationByKeyword(baseKeyword, foodKeyword) {
    if (!placeSearch || !kakaoMap) {
        alert('카카오 장소 검색을 사용할 수 없어요. services 라이브러리를 확인해 주세요.');
        return;
    }

    const keyword = baseKeyword.trim();

    if (!keyword) {
        alert('검색할 지역이나 장소명을 입력해 주세요.');
        return;
    }

    const basePosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);
    const NEAR_RADIUS = 20000; // 1차: 현재 기준 위치 주변 20km
    const WIDE_RADIUS = 100000; // 2차: 더 넓은 범위 100km

    function searchByAddressFirst() {
        if (!mapGeocoder) {
            searchByPlaceKeyword();
            return;
        }

        mapGeocoder.addressSearch(keyword, function(result, status) {
            if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                const firstAddress = result[0];

                currentBaseLat = Number(firstAddress.y);
                currentBaseLng = Number(firstAddress.x);
                currentBaseLabel = firstAddress.address_name || keyword;
                currentBaseType = 'searched_region';

                currentSearchKeyword = foodKeyword || getCategorySearchKeyword();
                currentPage = 1;

                const searchedPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

                kakaoMap.setCenter(searchedPosition);
                renderMyLocationMarker(searchedPosition);

                searchFoodPlacesAroundBase(currentSearchKeyword);
                return;
            }

            searchByPlaceKeyword();
        });
    }

    function applyBaseSearchResult(result) {
        const firstPlace = result[0];

        currentBaseLat = Number(firstPlace.y);
        currentBaseLng = Number(firstPlace.x);
        currentBaseLabel = firstPlace.place_name || keyword;
        currentBaseType = 'searched_place';

        currentSearchKeyword = foodKeyword || getCategorySearchKeyword();
        currentPage = 1;

        const searchedPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

        kakaoMap.setCenter(searchedPosition);
        renderMyLocationMarker(searchedPosition);

        searchFoodPlacesAroundBase(currentSearchKeyword);
    }

    function searchNationwide() {
        placeSearch.keywordSearch(
            keyword,
            function(result, status) {
                if (status !== kakao.maps.services.Status.OK || !result || result.length === 0) {
                    alert(`"${keyword}" 위치를 찾지 못했어요. 다른 지역명이나 장소명으로 검색해 주세요.`);
                    return;
                }

                applyBaseSearchResult(result);
            },
            {
                size: 5
            }
        );
    }

    function searchByRadius(radiusMeter, onFail) {
        placeSearch.keywordSearch(
            keyword,
            function(result, status) {
                if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                    applyBaseSearchResult(result);
                    return;
                }

                onFail();
            },
            {
                location: basePosition,
                radius: radiusMeter,
                sort: kakao.maps.services.SortBy.DISTANCE,
                size: 5
            }
        );
    }
    
    function searchByPlaceKeyword() {
        // 역 이름은 현재 위치 주변 검색을 거치지 않고 바로 전국 검색
        if (isStationKeyword(keyword)) {
            searchNationwide();
            return;
        }

        searchByRadius(NEAR_RADIUS, function() {
            searchByRadius(WIDE_RADIUS, function() {
                searchNationwide();
            });
        });
    }

    searchByAddressFirst();
}

function searchSmartKeyword(keyword) {
    if (!placeSearch || !kakaoMap) {
        alert('카카오 장소 검색을 사용할 수 없어요. services 라이브러리를 확인해 주세요.');
        return;
    }

    const searchKeyword = keyword.trim();

    if (!searchKeyword) {
        searchFoodPlacesAroundBase(getCategorySearchKeyword());
        return;
    }

    // 1차: 주소/행정구역으로 먼저 해석
    if (mapGeocoder) {
        mapGeocoder.addressSearch(searchKeyword, function(result, status) {
            if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                searchBaseLocationByKeyword(searchKeyword, getCategorySearchKeyword());
                return;
            }

            inspectKeywordByKakaoPlaces();
        });

        return;
    }

    inspectKeywordByKakaoPlaces();

    function inspectKeywordByKakaoPlaces() {
        placeSearch.keywordSearch(
            searchKeyword,
            function(result, status) {
                if (status !== kakao.maps.services.Status.OK || !result || result.length === 0) {
                    searchRestaurantPlacesByKeyword(searchKeyword);
                    return;
                }

                const foodOrCafeResult = result.find(function(kakaoPlace) {
                    return isFoodOrCafeKakaoPlace(kakaoPlace);
                });

                if (foodOrCafeResult) {
                    searchRestaurantPlacesByKeyword(searchKeyword);
                    return;
                }

                const locationLikeResult = result.find(function(kakaoPlace) {
                    return isLocationLikeKakaoPlace(kakaoPlace);
                });

                if (locationLikeResult) {
                    searchBaseLocationByKeyword(searchKeyword, getCategorySearchKeyword());
                    return;
                }

                currentSearchMode = 'restaurant';
                currentSearchKeyword = searchKeyword;
                currentRestaurantSearchScope = 'nationwide';
                currentPlaceData = [];
                currentPage = 1;
                renderPlaceList(currentPlaceData);
            },
            {
                size: 10,
                sort: kakao.maps.services.SortBy.ACCURACY
            }
        );
    }
}

function runSearchFromInput(triggerType) {
    const inputValue = mapSearchInput ? mapSearchInput.value.trim() : '';
    const parsedSearch = parseSearchInput(inputValue);

    console.log('공통 검색 실행:', {
        triggerType: triggerType,
        inputValue: inputValue,
        parsedSearch: parsedSearch,
        currentBaseLabel: currentBaseLabel,
        currentBaseType: currentBaseType
    });

    // 검색창이 비어 있으면 선택 카테고리 기준 검색
    if (!inputValue) {
        exitRestaurantSearchMode(getCategorySearchKeyword());
        searchFoodPlacesAroundBase(currentSearchKeyword);
        return;
    }

    // 검색 버튼은 위치 찾기/식당 찾기를 허용
    if (triggerType === 'submit') {
        runSubmitSearch(parsedSearch);
        return;
    }

    // 거리바, 현재 위치, 지도 클릭은 현재 기준 위치 주변에서만 검색
    runAroundBaseSearch(parsedSearch);
}

function runSubmitSearch(parsedSearch) {
    // 지역 + 음식 검색
    // 예: 신림역 파스타 / 강남역 초밥
    if (parsedSearch.shouldSearchBaseLocation) {
        currentSearchMode = 'location';
        currentPage = 1;
        searchBaseLocationByKeyword(parsedSearch.baseKeyword, parsedSearch.foodKeyword);
        return;
    }

    // 음식 키워드 검색
    // 예: 파스타 / 초밥 / 카페
    if (parsedSearch.type === 'food') {
        exitRestaurantSearchMode(parsedSearch.foodKeyword);
        searchFoodPlacesAroundBase(currentSearchKeyword);
        return;
    }

    // 애매한 검색어는 검색 버튼에서만 smart 판단
    // 식당이면 식당 위치를 찾고, 지역/장소면 그 위치 기준 맛집 검색
    if (parsedSearch.type === 'smart') {
        searchSmartKeyword(parsedSearch.foodKeyword);
        return;
    }

    // 혹시 restaurant 타입이 들어오면 최초 식당 찾기
    if (parsedSearch.type === 'restaurant') {
        searchRestaurantPlacesByKeyword(parsedSearch.foodKeyword, {
            focusMap: true,
            useFallbackSearch: true,
            setBaseLocation: true
        });
        return;
    }

    // fallback
    exitRestaurantSearchMode(getCategorySearchKeyword());
    searchFoodPlacesAroundBase(currentSearchKeyword);
}

function runAroundBaseSearch(parsedSearch) {
    // 주변 재검색에서는 위치를 새로 찾지 않는다.
    // 현재 기준 위치 currentBaseLat/currentBaseLng 기준으로만 검색한다.

    // 음식 검색어
    if (parsedSearch.type === 'food') {
        exitRestaurantSearchMode(parsedSearch.foodKeyword);
        searchFoodPlacesAroundBase(currentSearchKeyword);
        return;
    }

    // 지역 + 음식 검색어가 남아 있어도, 주변 재검색에서는 음식 키워드만 적용
    // 예: 현재 위치 버튼 + "강남 파스타" → 내 GPS 주변 파스타
    if (parsedSearch.shouldSearchBaseLocation) {
        exitRestaurantSearchMode(parsedSearch.foodKeyword || getCategorySearchKeyword());
        searchFoodPlacesAroundBase(currentSearchKeyword);
        return;
    }

    // 애매한 검색어는 현재 기준 위치 주변에서 식당명으로만 검색
    // 예: GPS 기준 "백부장집 닭한마리" / 지도 클릭 기준 "달막달막"
    if (parsedSearch.type === 'smart' || parsedSearch.type === 'restaurant') {
        searchRestaurantPlacesByKeyword(parsedSearch.foodKeyword, {
            focusMap: false,
            useFallbackSearch: false,
            setBaseLocation: false
        });
        return;
    }

    // 빈 값 또는 fallback
    exitRestaurantSearchMode(getCategorySearchKeyword());
    searchFoodPlacesAroundBase(currentSearchKeyword);
}

// ================================
// 카카오 음식/식당 검색
// ================================

function searchFoodPlacesAroundBase(foodKeyword) {
    if (!placeSearch || !kakaoMap) {
        alert('카카오 장소 검색을 사용할 수 없어요. services 라이브러리를 확인해 주세요.');
        return;
    }

    currentSearchMode = 'food';

    const keyword = foodKeyword.trim() || '맛집';
    const radiusMeter = getSelectedRadiusMeter();
    const centerPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

    const MAX_KAKAO_PAGE = 3; // 카카오 1페이지 최대 15개 × 3 = 최대 45개
    const KAKAO_PAGE_SIZE = 15;

    let collectedPlaces = [];

    function requestKakaoPage(pageNumber) {
        placeSearch.keywordSearch(
            keyword,
            function(result, status, pagination) {
                if (status !== kakao.maps.services.Status.OK) {
                    if (collectedPlaces.length === 0) {
                        currentPlaceData = [];
                        currentPage = 1;
                        renderPlaceList(currentPlaceData);
                    } else {
                        applyCollectedKakaoPlaces(collectedPlaces, keyword);
                    }

                    return;
                }

                collectedPlaces = collectedPlaces.concat(result);

                const canLoadNextPage =
                    pagination &&
                    pagination.hasNextPage &&
                    pageNumber < MAX_KAKAO_PAGE;

                if (canLoadNextPage) {
                    requestKakaoPage(pageNumber + 1);
                    return;
                }

                applyCollectedKakaoPlaces(collectedPlaces, keyword);
            },
            {
                location: centerPosition,
                radius: radiusMeter,
                sort: kakao.maps.services.SortBy.DISTANCE,
                page: pageNumber,
                size: KAKAO_PAGE_SIZE
            }
        );
    }

    requestKakaoPage(1);
}

function isFoodOrCafeKakaoPlace(kakaoPlace) {
    const categoryGroupCode = kakaoPlace.category_group_code || '';
    const categoryName = kakaoPlace.category_name || '';

    // 카카오 장소 카테고리 그룹
    // FD6: 음식점
    // CE7: 카페
    if (categoryGroupCode === 'FD6' || categoryGroupCode === 'CE7') {
        return true;
    }

    return (
        categoryName.includes('음식점') ||
        categoryName.includes('한식') ||
        categoryName.includes('중식') ||
        categoryName.includes('일식') ||
        categoryName.includes('양식') ||
        categoryName.includes('분식') ||
        categoryName.includes('카페') ||
        categoryName.includes('디저트')
    );
}

function filterFoodOrCafeKakaoPlaces(kakaoPlaces) {
    return kakaoPlaces.filter(function(kakaoPlace) {
        return isFoodOrCafeKakaoPlace(kakaoPlace);
    });
}

function isLocationLikeKakaoPlace(kakaoPlace) {
    const categoryGroupCode = kakaoPlace.category_group_code || '';
    const categoryName = kakaoPlace.category_name || '';

    // SW8: 지하철역
    if (categoryGroupCode === 'SW8') {
        return true;
    }

    return (
        categoryName.includes('지하철') ||
        categoryName.includes('역') ||
        categoryName.includes('교통') ||
        categoryName.includes('관광') ||
        categoryName.includes('명소') ||
        categoryName.includes('거리') ||
        categoryName.includes('공원') ||
        categoryName.includes('시장') ||
        categoryName.includes('백화점') ||
        categoryName.includes('마트') ||
        categoryName.includes('쇼핑') ||
        categoryName.includes('대학교') ||
        categoryName.includes('공공기관')
    );
}

function getRestaurantSearchKeywordVariants(keyword) {
    const cleanedKeyword = String(keyword || '').trim().replace(/\s+/g, ' ');
    const noSpaceKeyword = cleanedKeyword.replace(/\s+/g, '');

    return [...new Set([
        cleanedKeyword,
        noSpaceKeyword
    ])].filter(function(variant) {
        return variant.length > 0;
    });
}

function removeDuplicateKakaoPlaces(kakaoPlaces) {
    const placeMap = new Map();

    kakaoPlaces.forEach(function(kakaoPlace) {
        const key = kakaoPlace.id || `${kakaoPlace.place_name}_${kakaoPlace.x}_${kakaoPlace.y}`;

        if (!placeMap.has(key)) {
            placeMap.set(key, kakaoPlace);
        }
    });

    return Array.from(placeMap.values());
}

function searchRestaurantPlacesByKeyword(restaurantKeyword, options) {
    const searchOptions = options || {};

    const shouldFocusMap = searchOptions.focusMap !== false;
    const shouldUseFallbackSearch = searchOptions.useFallbackSearch !== false;
    const shouldSetBaseLocation = searchOptions.setBaseLocation !== false;

    if (!placeSearch || !kakaoMap) {
        alert('카카오 장소 검색을 사용할 수 없어요. services 라이브러리를 확인해 주세요.');
        return;
    }

    const keyword = String(restaurantKeyword || '').trim();

    if (!keyword) {
        currentPlaceData = [];
        currentPage = 1;
        renderPlaceList(currentPlaceData);
        return;
    }

    currentSearchMode = 'restaurant';
    currentSearchKeyword = keyword;
    currentPage = 1;

    const MAX_KAKAO_PAGE = 3;
    const KAKAO_PAGE_SIZE = 15;

    const centerPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);
    const selectedRadiusMeter = getSelectedRadiusMeter();
    const keywordVariants = getRestaurantSearchKeywordVariants(keyword);

    const searchScopeList = [
        {
            scope: 'nearby',
            option: {
                location: centerPosition,
                radius: selectedRadiusMeter,
                sort: kakao.maps.services.SortBy.DISTANCE
            }
        }
    ];

    // 최초 검색 버튼으로 식당을 찾는 경우에만 넓은 범위 fallback 허용
    if (shouldUseFallbackSearch) {
        searchScopeList.push(
            {
                scope: 'wide',
                option: {
                    location: centerPosition,
                    radius: 20000,
                    sort: kakao.maps.services.SortBy.DISTANCE
                }
            },
            {
                scope: 'nationwide',
                option: {
                    sort: kakao.maps.services.SortBy.ACCURACY
                }
            }
        );
    }

    function requestKakaoPages(searchKeyword, searchOption, onComplete) {
        let collectedPlaces = [];

        function requestPage(pageNumber) {
            placeSearch.keywordSearch(
                searchKeyword,
                function(result, status, pagination) {
                    if (status !== kakao.maps.services.Status.OK) {
                        onComplete(collectedPlaces);
                        return;
                    }

                    collectedPlaces = collectedPlaces.concat(result);

                    const canLoadNextPage =
                        pagination &&
                        pagination.hasNextPage &&
                        pageNumber < MAX_KAKAO_PAGE;

                    if (canLoadNextPage) {
                        requestPage(pageNumber + 1);
                        return;
                    }

                    onComplete(collectedPlaces);
                },
                {
                    ...searchOption,
                    page: pageNumber,
                    size: KAKAO_PAGE_SIZE
                }
            );
        }

        requestPage(1);
    }

    function searchScope(scopeIndex) {
        if (scopeIndex >= searchScopeList.length) {
            currentPlaceData = [];
            currentPage = 1;
            currentRestaurantSearchScope = 'nearby';
            renderPlaceList(currentPlaceData);
            return;
        }

        const scopeData = searchScopeList[scopeIndex];
        let mergedPlaces = [];
        let keywordIndex = 0;

        function searchNextKeywordVariant() {
            if (keywordIndex >= keywordVariants.length) {
                const uniquePlaces = removeDuplicateKakaoPlaces(mergedPlaces);
                const foodOrCafePlaces = filterFoodOrCafeKakaoPlaces(uniquePlaces);

                if (foodOrCafePlaces.length > 0) {
                    applyRestaurantSearchPlaces(
                        foodOrCafePlaces,
                        keyword,
                        scopeData.scope,
                        shouldFocusMap,
                        shouldSetBaseLocation
                    );
                    return;
                }

                searchScope(scopeIndex + 1);
                return;
            }

            const searchKeyword = keywordVariants[keywordIndex];
            keywordIndex++;

            requestKakaoPages(searchKeyword, scopeData.option, function(resultPlaces) {
                mergedPlaces = mergedPlaces.concat(resultPlaces);
                searchNextKeywordVariant();
            });
        }

        searchNextKeywordVariant();
    }

    searchScope(0);
}

function applyRestaurantSearchPlaces(
    kakaoPlaces,
    keyword,
    searchScope,
    shouldFocusMap,
    shouldSetBaseLocation
) {
    currentRestaurantSearchScope = searchScope || 'nearby';

    const foodOrCafePlaces = filterFoodOrCafeKakaoPlaces(kakaoPlaces);

    currentPlaceData = foodOrCafePlaces
        .map(function(kakaoPlace) {
            const convertedPlace = convertKakaoPlace(kakaoPlace);

            convertedPlace.nameScore = getRestaurantNameSimilarityScore(
                keyword,
                kakaoPlace.place_name
            );

            return convertedPlace;
        })
        .sort(function(a, b) {
            return b.nameScore - a.nameScore;
        });

    currentSearchKeyword = keyword;
    currentSearchMode = 'restaurant';
    currentPage = 1;

    console.log('식당명 검색 결과:', {
        keyword: keyword,
        scope: currentRestaurantSearchScope,
        count: currentPlaceData.length,
        first: currentPlaceData[0]
    });

    // 검색 버튼으로 식당을 찾은 경우에만 대표 식당을 새 기준 위치로 등록
    if (
        shouldSetBaseLocation !== false &&
        shouldFocusMap !== false &&
        currentPlaceData.length > 0
    ) {
        setBaseLocationByPlace(currentPlaceData[0], 'searched_restaurant');
    }

    renderPlaceList(currentPlaceData);

    if (shouldFocusMap !== false) {
        focusMapToPlaces(currentPlaceData);
    }
}

function getRestaurantNameSimilarityScore(searchKeyword, placeName) {
    const searchText = normalizeTextForMatch(searchKeyword);
    const placeText = normalizeTextForMatch(placeName);

    if (!searchText || !placeText) return 0;

    if (placeText === searchText) return 100;
    if (placeText.includes(searchText)) return 80;
    if (searchText.includes(placeText)) return 70;

    let score = 0;

    searchText.split('').forEach(function(char) {
        if (placeText.includes(char)) {
            score += 1;
        }
    });

    return score;
}

function applyCollectedKakaoPlaces(kakaoPlaces, keyword) {
    currentPlaceData = kakaoPlaces.map(function(kakaoPlace) {
        return convertKakaoPlace(kakaoPlace);
    });

    currentSearchKeyword = keyword;
    currentPage = 1;

    saveLastMapSearch();

    // 리스트와 마커만 다시 그림
    // 지도 중심/줌은 건드리지 않음
    renderPlaceList(currentPlaceData);
}

function convertKakaoPlace(kakaoPlace) {
    return {
        title: kakaoPlace.place_name,
        category: getCategoryFromKakaoPlace(kakaoPlace.category_name),
        address: kakaoPlace.road_address_name || kakaoPlace.address_name || '주소 정보 없음',
        placeUrl: kakaoPlace.place_url || 'https://map.kakao.com/',
        food: getRepresentativeFoods(kakaoPlace),
        lat: Number(kakaoPlace.y),
        lng: Number(kakaoPlace.x)
    };
}

function getCategoryFromKakaoPlace(categoryName) {
    if (!categoryName) return '기타';

    if (categoryName.includes('한식')) return '한식';
    if (categoryName.includes('중식')) return '중식';
    if (categoryName.includes('일식')) return '일식';
    if (categoryName.includes('양식')) return '양식';
    if (categoryName.includes('분식')) return '분식';
    if (categoryName.includes('카페') || categoryName.includes('디저트')) return '디저트';

    return '기타';
}

// =====================================
// redtable API 연동
// =====================================
function normalizeTextForMatch(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()\[\]{}]/g, '')
        .replace(/[·ㆍ,.]/g, '')
        .replace(/서울/g, '')
        .replace(/종로/g, '')
        .replace(/신림/g, '')
        .replace(/강남/g, '')
        .replace(/홍대/g, '')
        .replace(/건대/g, '')
        .replace(/본관/g, '')
        .replace(/별관/g, '')
        .replace(/본점/g, '')
        .replace(/지점/g, '')
        .replace(/분점/g, '')
        .replace(/직영점/g, '')
        .replace(/신관/g, '')
        .replace(/구관/g, '')
        .replace(/본가/g, '')
        .replace(/원조/g, '')
        .replace(/전통/g, '')
        .replace(/맛집/g, '')
        .replace(/점$/g, '');
}

function splitMenuNames(menuText) {
    if (!menuText) return [];

    return String(menuText)
        .split(/[\/,·ㆍ|]/)
        .map(function(menuName) {
            return menuName.trim();
        })
        .filter(function(menuName) {
            return menuName.length > 0;
        });
}

function normalizeAddressForMatch(address) {
    return String(address || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/서울특별시/g, '서울')
        .replace(/부산광역시/g, '부산')
        .replace(/대구광역시/g, '대구')
        .replace(/인천광역시/g, '인천')
        .replace(/광주광역시/g, '광주')
        .replace(/대전광역시/g, '대전')
        .replace(/울산광역시/g, '울산')
        .replace(/세종특별자치시/g, '세종')
        .replace(/경기도/g, '경기')
        .replace(/강원특별자치도/g, '강원')
        .replace(/강원도/g, '강원')
        .replace(/충청북도/g, '충북')
        .replace(/충청남도/g, '충남')
        .replace(/전라북도/g, '전북')
        .replace(/전북특별자치도/g, '전북')
        .replace(/전라남도/g, '전남')
        .replace(/경상북도/g, '경북')
        .replace(/경상남도/g, '경남')
        .replace(/제주특별자치도/g, '제주')
        .replace(/[()\[\]{}·ㆍ,.]/g, '');
}

function formatMenuPrice(price) {
    const numberPrice = Number(price);

    if (!numberPrice || Number.isNaN(numberPrice)) {
        return '';
    }

    return `${numberPrice.toLocaleString()}원`;
}

function pushUniqueMenu(menuList, menuItem) {
    if (!menuItem || !menuItem.name) return;

    const menuKey = normalizeTextForMatch(menuItem.name);

    const alreadyExists = menuList.some(function(savedMenu) {
        return normalizeTextForMatch(savedMenu.name) === menuKey;
    });

    if (alreadyExists) return;

    menuList.push(menuItem);
}

function findRedTableMenusForPlace(kakaoPlace) {
    if (!isRedTableMenuLoaded || redTableMenuData.length === 0) {
        return [];
    }

    const kakaoPlaceName = normalizeTextForMatch(
        kakaoPlace.place_name || kakaoPlace.title || ''
    );

    const kakaoAddress = normalizeAddressForMatch(
        kakaoPlace.road_address_name ||
        kakaoPlace.address_name ||
        kakaoPlace.address ||
        ''
    );

    const matchedMenus = [];

    redTableMenuData.forEach(function(menuItem) {
        const redTableRestaurantName = normalizeTextForMatch(menuItem.RSTR_NM);
        const redTableAreaName = normalizeAddressForMatch(menuItem.AREA_NM);

        if (!redTableRestaurantName) return;

        const isStrongNameMatched =
            kakaoPlaceName.includes(redTableRestaurantName) ||
            redTableRestaurantName.includes(kakaoPlaceName);

        const isLooseNameMatched =
            isStrongNameMatched ||
            getRestaurantNameSimilarityScore(kakaoPlaceName, redTableRestaurantName) >= 45;

        if (!isLooseNameMatched) return;

        const isAreaMatched =
            !redTableAreaName ||
            !kakaoAddress ||
            kakaoAddress.includes(redTableAreaName) ||
            redTableAreaName.includes(kakaoAddress.slice(0, 5)) ||
            kakaoAddress.slice(0, 5).includes(redTableAreaName.slice(0, 5));

        // 이름이 매우 강하게 맞으면 주소가 조금 달라도 허용
        if (!isAreaMatched && !isStrongNameMatched) return;

        const priceText = formatMenuPrice(menuItem.MENU_PRICE);

        if (menuItem.SPCLT_MENU_NM) {
            pushUniqueMenu(matchedMenus, {
                name: menuItem.SPCLT_MENU_NM,
                price: priceText,
                isSpecial: true,
                url: menuItem.MENU_URL || '',
                source: 'redtable'
            });
        }

        if (menuItem.MENU_NM) {
            splitMenuNames(menuItem.MENU_NM).forEach(function(menuName) {
                pushUniqueMenu(matchedMenus, {
                    name: menuName,
                    price: priceText,
                    isSpecial: menuItem.SPCLT_MENU_YN === 'Y',
                    url: menuItem.MENU_URL || '',
                    source: 'redtable'
                });
            });
        }
    });

    return matchedMenus.slice(0, 6);
}

function getRepresentativeFoods(kakaoPlace) {
    const redTableMenus = findRedTableMenusForPlace(kakaoPlace);

    if (redTableMenus.length > 0) {
        return redTableMenus;
    }

    return getFoodKeywordsFromKakaoPlace(kakaoPlace);
}
// =====================================

function getFoodKeywordsFromKakaoPlace(kakaoPlace) {
    const keywordSource = `
        ${kakaoPlace.place_name || kakaoPlace.title || ''}
        ${kakaoPlace.category_name || kakaoPlace.category || ''}
    `;

    const foodKeywordList = [
        // 한식
        '김치찌개', '된장찌개', '순두부찌개', '부대찌개', '제육',
        '백반', '국밥', '순대국', '감자탕', '해장국', '냉면',
        '삼겹살', '갈비', '불고기', '곱창', '막창', '족발', '보쌈',
        '닭갈비', '닭한마리', '찜닭', '닭도리탕', '칼국수', '수제비',
        '비빔밥', '덮밥', '쌈밥', '생선구이', '고등어구이',

        // 분식
        '떡볶이', '김밥', '라면', '튀김', '순대', '어묵',
        '돈까스', '돈카츠', '우동', '쫄면',

        // 중식
        '짜장면', '짬뽕', '탕수육', '마라탕', '마라샹궈',
        '양꼬치', '훠궈', '딤섬',

        // 일식
        '초밥', '스시', '라멘', '사시미', '회', '오마카세',
        '카츠', '규동', '가츠동', '텐동',

        // 양식 / 세계음식
        '파스타', '피자', '스테이크', '리조또', '샐러드',
        '버거', '햄버거', '타코', '브리또', '퀘사디아',
        '쌀국수', '분짜', '커리', '카레', '케밥',

        // 술집 / 포차
        '치킨', '호프', '맥주', '소주', '안주', '오뎅탕',
        '골뱅이무침', '닭똥집', '먹태', '노가리', '전', '부침개',

        // 카페 / 디저트
        '커피', '케이크', '디저트', '빙수', '와플', '크로플',
        '베이글', '샌드위치', '토스트', '도넛'
    ];

    const matchedKeywords = foodKeywordList.filter(function(foodName) {
        return keywordSource.includes(foodName);
    });

    const categoryText = `${kakaoPlace.category_name || kakaoPlace.category || ''}`;

    if (categoryText.includes('호프') || categoryText.includes('주점') || categoryText.includes('술집')) {
        return ['맥주', '안주', '치킨'];
    }

    if (categoryText.includes('멕시코') || categoryText.includes('남미')) {
        return ['타코', '브리또', '퀘사디아'];
    }

    if (categoryText.includes('분식')) {
        return ['떡볶이', '김밥', '튀김'];
    }

    if (categoryText.includes('한식')) {
        return ['백반', '찌개', '제육'];
    }

    if (categoryText.includes('중식')) {
        return ['짜장면', '짬뽕', '탕수육'];
    }

    if (categoryText.includes('일식')) {
        return ['초밥', '라멘', '돈카츠'];
    }

    if (categoryText.includes('양식')) {
        return ['파스타', '피자', '스테이크'];
    }

    if (
        (kakaoPlace.category_name && kakaoPlace.category_name.includes('카페')) ||
        (kakaoPlace.category && kakaoPlace.category.includes('디저트'))
    ) {
        return ['커피', '디저트'];
    }

    return ['추천 메뉴 정보가 없습니다!'];
}

// ================================
// 거리 막대
// ================================

function updateDistanceRange() {
    if (!distanceRange) return;

    const min = Number(distanceRange.min);
    const max = Number(distanceRange.max);
    const value = Number(distanceRange.value);

    const percent = ((value - min) / (max - min)) * 100;

    distanceRange.style.background = `
        linear-gradient(
            to right,
            var(--color-main) 0%,
            var(--color-main) ${percent}%,
            var(--color-line) ${percent}%,
            var(--color-line) 100%
        )
    `;
}

if (distanceRange) {
    distanceRange.addEventListener('input', function() {
        updateDistanceRange();

        if (!kakaoMap) return;

        currentPage = 1;
        setMapBoundsByCurrentLocation();

        if (!placeSearch) {
            renderPlaceList(currentPlaceData);
            return;
        }

        runSearchFromInput('distance');
    });

    updateDistanceRange();
}

// ================================
// 카테고리 필터 선택
// ================================

mapFilterBtns.forEach(function(button) {
    button.addEventListener('click', function() {
        if (isFilterDragMoved) return;

        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        button.classList.add('selected');

        // 카테고리 클릭은 검색창보다 우선
        // 검색창에 남은 식당명 때문에 흐름이 꼬이지 않도록 비움
        if (mapSearchInput) {
            mapSearchInput.value = '';
        }

        exitRestaurantSearchMode(getCategorySearchKeyword());

        if (placeSearch) {
            searchFoodPlacesAroundBase(currentSearchKeyword);
        } else {
            renderPlaceList(currentPlaceData);
        }
    });
});

// ================================
// fallback 위치 설정
// ================================

function setFallbackLocation() {
    currentBaseLat = FALLBACK_LAT;
    currentBaseLng = FALLBACK_LNG;
    currentBaseLabel = FALLBACK_LABEL;
    currentBaseType = 'fallback';

    exitRestaurantSearchMode(currentSearchKeyword || '맛집');

    if (!kakaoMap) {
        createMap();
    }

    if (!kakaoMap || !window.kakao || !kakao.maps) return;

    const fallbackPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

    kakaoMap.setCenter(fallbackPosition);
    renderMyLocationMarker(fallbackPosition);
    setMapBoundsByCurrentLocation();

    if (placeSearch) {
        searchFoodPlacesAroundBase(currentSearchKeyword);
    } else {
        renderPlaceList([]);
    }
}

// ================================
// 최근 검색 조건 저장 / 불러오기
// ================================

function saveLastMapSearch() {
    if (currentSearchMode === 'restaurant') {
        return;
    }

    const selectedCategory = getSelectedCategory();

    const lastSearchData = {
        baseLat: currentBaseLat,
        baseLng: currentBaseLng,
        baseLabel: currentBaseLabel,
        baseType: currentBaseType,
        searchKeyword: currentSearchKeyword,
        distanceValue: distanceRange ? distanceRange.value : '1',
        category: selectedCategory,
        savedAt: Date.now()
    };

    localStorage.setItem(LAST_MAP_SEARCH_KEY, JSON.stringify(lastSearchData));
}

function loadLastMapSearch() {
    const savedData = localStorage.getItem(LAST_MAP_SEARCH_KEY);

    if (!savedData) return null;

    try {
        return JSON.parse(savedData);
    } catch (error) {
        localStorage.removeItem(LAST_MAP_SEARCH_KEY);
        return null;
    }
}

function applyLastMapSearch(lastSearchData) {
    if (!lastSearchData) return false;

    currentBaseLat = Number(lastSearchData.baseLat);
    currentBaseLng = Number(lastSearchData.baseLng);
    currentBaseLabel = lastSearchData.baseLabel || '이전 검색 위치';
    currentBaseType = lastSearchData.baseType || 'saved';
    currentSearchKeyword = lastSearchData.searchKeyword || '맛집';
    currentPage = 1;

    if (distanceRange && lastSearchData.distanceValue !== undefined) {
        distanceRange.value = lastSearchData.distanceValue;
        updateDistanceRange();
    }

    if (lastSearchData.category) {
        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');

            if (btn.dataset.category === lastSearchData.category) {
                btn.classList.add('selected');
            }
        });
    }

    return true;
}

// ================================
// 현재 위치 가져오기
// ================================

function getNowLocation() {
    if (!navigator.geolocation) {
        alert('현재 위치를 가져올 수 없어 신림역 기준으로 검색할게요.');
        setFallbackLocation();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentBaseLat = position.coords.latitude;
            currentBaseLng = position.coords.longitude;
            currentBaseLabel = '현재 위치';
            currentBaseType = 'gps';
            currentPage = 1;

            if (!kakaoMap) {
                createMap();
            }

            if (!kakaoMap || !window.kakao || !kakao.maps) return;

            const gpsPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

            kakaoMap.setCenter(gpsPosition);
            renderMyLocationMarker(gpsPosition);
            setMapBoundsByCurrentLocation();

            if (placeSearch) {
                runSearchFromInput('currentLocation');
            } else {
                renderPlaceList([]);
            }
        },
        function() {
            alert('현재 위치를 가져오지 못했어요. 신림역 기준으로 검색할게요.');
            setFallbackLocation();
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// ================================
// 페이지 첫 진입 처리
// ================================

function initMapPage() {
    loadRedTableMenuData();

    const resultKeyword = localStorage.getItem(RESULT_MAP_KEYWORD_KEY);

    if (resultKeyword) {
        currentSearchKeyword = normalizeFoodKeyword(resultKeyword);

        if (mapSearchInput) {
            mapSearchInput.value = currentSearchKeyword;
        }

        localStorage.removeItem(RESULT_MAP_KEYWORD_KEY);

        getNowLocation();
        return;
    }

    const lastSearchData = loadLastMapSearch();

    if (lastSearchData && applyLastMapSearch(lastSearchData)) {
        createMap();

        if (placeSearch) {
            searchFoodPlacesAroundBase(currentSearchKeyword);
        } else {
            renderPlaceList([]);
        }

        return;
    }

    getNowLocation();
}

// ================================
// 지도 생성
// ================================

function createMap() {
    if (!mapContainer || !window.kakao || !kakao.maps) return;

    const nowPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

    const mapOption = {
        center: nowPosition,
        level: 5
    };

    kakaoMap = new kakao.maps.Map(mapContainer, mapOption);

    if (!kakao.maps.services) {
        console.error('kakao.maps.services가 없습니다. libraries=services 설정을 확인하세요.');
        alert('카카오 장소 검색 기능을 사용할 수 없어요. services 라이브러리를 확인해주세요.');
        return;
    }

    placeSearch = new kakao.maps.services.Places();
    mapGeocoder = new kakao.maps.services.Geocoder();

    currentInfoWindow = null;
    placeMarkers = [];

    renderMyLocationMarker(nowPosition);
    connectMapClickEvent();
    renderPlaceList(currentPlaceData);

    setMapBoundsByCurrentLocation();
}

// ================================
// 지도 클릭 기준 위치 변경
// ================================

function connectMapClickEvent() {
    if (!kakaoMap) return;

    kakao.maps.event.addListener(kakaoMap, 'click', function(mouseEvent) {
        const clickedPosition = mouseEvent.latLng;

        currentBaseLat = clickedPosition.getLat();
        currentBaseLng = clickedPosition.getLng();
        currentBaseLabel = '선택한 위치';
        currentBaseType = 'map_click';
        currentPage = 1;

        // 지도 클릭 시에는 기준 위치 마커만 변경
        renderMyLocationMarker(clickedPosition);

        // 기존 검색 결과/리스트는 그대로 둠
        // 실제 검색은 검색 버튼을 눌렀을 때 실행됨
        console.log('검색 기준 위치만 변경됨. 검색 버튼을 누르면 이 위치 기준으로 검색됩니다.', {
            lat: currentBaseLat,
            lng: currentBaseLng
        });
    });
}

// ================================
// 현재 위치 마커
// ================================
function setBaseLocationByPlace(place, baseType) {
    if (!place || !place.lat || !place.lng) return;

    currentBaseLat = Number(place.lat);
    currentBaseLng = Number(place.lng);
    currentBaseLabel = place.title || '검색한 식당';
    currentBaseType = baseType || 'searched_restaurant';

    const basePosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

    kakaoMap.setCenter(basePosition);
    renderMyLocationMarker(basePosition);
}

function renderMyLocationMarker(position) {
    if (!kakaoMap) return;

    if (myLocationMarker) {
        myLocationMarker.setMap(null);
    }

    //기준 마커 스타일 ---------
    const baseMarkerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
            <path 
                d="M19 0C8.5 0 0 8.5 0 19c0 13.5 19 29 19 29s19-15.5 19-29C38 8.5 29.5 0 19 0z" 
                fill="#ff7a00"
            />
            <circle cx="19" cy="19" r="11" fill="#ffffff"/>
            <circle cx="19" cy="19" r="6" fill="#18b957"/>
        </svg>
    `;

    const baseMarkerImage = new kakao.maps.MarkerImage(
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(baseMarkerSvg),
        new kakao.maps.Size(30, 35),
        {
            offset: new kakao.maps.Point(19, 48)
        }
    )
    //기준 마커 스타일 --------- 끝

    myLocationMarker = new kakao.maps.Marker({
        map: kakaoMap,
        position: position,
        image: baseMarkerImage,
        zIndex: 1
    });

    const myInfoWindow = new kakao.maps.InfoWindow({
        content: `
            <div style="padding:8px 10px;font-size:13px;line-height:1.5;white-space:nowrap;">
                <strong>기준 위치</strong><br>
                ${escapeHTML(currentBaseLabel)}
            </div>
        `
    });

    kakao.maps.event.addListener(myLocationMarker, 'click', function() {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        myInfoWindow.open(kakaoMap, myLocationMarker);
        currentInfoWindow = myInfoWindow;
    });
}

// ================================
// 선택 거리
// ================================

function getSelectedRadiusMeter() {
    if (!distanceRange) return 300;

    const distanceMeterList = [100, 250, 500, 1000];

    return distanceMeterList[Number(distanceRange.value)] || 300;
}

// ================================
// 지도 범위 조정
// ================================

function setMapBoundsByCurrentLocation() {
    if (!kakaoMap) return;

    const radiusMeter = getSelectedRadiusMeter();

    const latDiff = radiusMeter / 111320;
    const lngDiff = radiusMeter / (111320 * Math.cos(currentBaseLat * Math.PI / 180));

    const southWest = new kakao.maps.LatLng(
        currentBaseLat - latDiff,
        currentBaseLng - lngDiff
    );

    const northEast = new kakao.maps.LatLng(
        currentBaseLat + latDiff,
        currentBaseLng + lngDiff
    );

    const bounds = new kakao.maps.LatLngBounds(southWest, northEast);

    kakaoMap.setBounds(bounds);
}

//검색 결과 전체가 지도에 보이게 하는 함수
function setMapBoundsByPlaces(places) {
    if (!kakaoMap || !places || places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();

    places.forEach(function(place) {
        if (!place.lat || !place.lng) return;

        bounds.extend(new kakao.maps.LatLng(place.lat, place.lng));
    });

    kakaoMap.setBounds(bounds);
}

function focusMapToPlaces(places) {
    if (!kakaoMap || !places || places.length === 0) return;

    const validPlaces = places.filter(function(place) {
        return place.lat && place.lng;
    });

    if (validPlaces.length === 0) return;

    // 결과가 1개면 해당 식당으로 바로 이동
    if (validPlaces.length === 1) {
        const position = new kakao.maps.LatLng(
            validPlaces[0].lat,
            validPlaces[0].lng
        );

        kakaoMap.setCenter(position);
        kakaoMap.setLevel(4);
        return;
    }

    // 결과가 여러 개면 전체 결과가 보이게 범위 조정
    setMapBoundsByPlaces(validPlaces);
}

// ================================
// 거리 계산
// ================================

function getDistanceMeter(lat1, lng1, lat2, lng2) {
    const R = 6371000;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(distanceNumber) {
    if (distanceNumber < 1000) {
        return `${distanceNumber}m`;
    }

    return `${(distanceNumber / 1000).toFixed(1)}km`;
}

// ================================
// 마커 표시
// ================================

function renderPlaceMarkers(places) {
    if (!kakaoMap) return;

    clearPlaceMarkers();

    places.forEach(function(place, index) {
        const position = new kakao.maps.LatLng(place.lat, place.lng);

        const marker = new kakao.maps.Marker({
            map: kakaoMap,
            position: position,
            zIndex: 5
        });

        const infoWindow = new kakao.maps.InfoWindow({
            content: `
                <div style="padding:8px 10px;font-size:13px;line-height:1.5;white-space:nowrap;">
                    <strong>${escapeHTML(place.title)}</strong><br>
                    ${escapeHTML(place.address)}
                </div>
            `
        });

        kakao.maps.event.addListener(marker, 'click', function() {
            openPlaceInfo(marker, infoWindow);
        });

        placeMarkers.push({
            marker: marker,
            infoWindow: infoWindow,
            position: position,
            data: place,
            index: index
        });
    });
}

function clearPlaceMarkers() {
    placeMarkers.forEach(function(markerInfo) {
        markerInfo.marker.setMap(null);
    });

    placeMarkers = [];

    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
}

function openPlaceInfo(marker, infoWindow) {
    if (!kakaoMap) return;

    if (currentInfoWindow === infoWindow) {
        infoWindow.close();
        currentInfoWindow = null;
        return;
    }

    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    infoWindow.open(kakaoMap, marker);
    currentInfoWindow = infoWindow;
}

// ================================
// 페이지 정보 업데이트
// ================================

function updatePageControls(totalCount, currentPageNumber, totalPage) {
    pageControlList.forEach(function(control) {
        if (control.placeCount) {
            control.placeCount.textContent = totalCount;
        }

        if (control.pageInfo) {
            control.pageInfo.textContent = totalCount > 0 ? `${currentPageNumber}/${totalPage}` : '0/0';
        }

        if (control.prevBtn) {
            control.prevBtn.disabled = currentPageNumber <= 1;
        }

        if (control.nextBtn) {
            control.nextBtn.disabled = currentPageNumber >= totalPage || totalPage === 0;
        }
    });
}

// ================================
// 장소 리스트 출력
// ================================

function renderPlaceList(places) {
    if (!placeList) return;

    const selectedCategory = getSelectedCategory();

    const filteredPlaces = places
        .map(function(place) {
            const distanceNumber = getDistanceMeter(
                currentBaseLat,
                currentBaseLng,
                place.lat,
                place.lng
            );
            return {
                ...place,
                distanceNumber: distanceNumber
            };
        })
        .filter(function(place) {
            const radiusMeter = getSelectedRadiusMeter();

            const isRestaurantWideResult =
                currentSearchMode === 'restaurant' &&
                currentRestaurantSearchScope !== 'nearby';

            if (!isRestaurantWideResult && place.distanceNumber > radiusMeter) {
                return false;
            }

            // 식당명 직접 검색일 때는 선택 카테고리 때문에 결과를 숨기지 않음
            if (currentSearchMode === 'restaurant') {
                return true;
            }

            if (selectedCategory === '전체') {
                return true;
            }

            return place.category === selectedCategory;
        });

        placeList.innerHTML = '';

        const totalPage = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);

        if (currentPage > totalPage) {
            currentPage = totalPage || 1;
        }

        updatePageControls(filteredPlaces.length, currentPage, totalPage);

        if (filteredPlaces.length === 0) {
            placeList.innerHTML = `
                <p class="empty_place_text">
                    검색 결과가 없어요!
                </p>
            `;

            clearPlaceMarkers();
            return;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pagePlaces = filteredPlaces.slice(startIndex, endIndex);

        // 현재 페이지에 보이는 식당만 지도 마커로 표시
        renderPlaceMarkers(pagePlaces);

        pagePlaces.forEach(function(place, index) {
        const card = document.createElement('article');
        card.className = 'place_card';

        const distanceText = formatDistance(place.distanceNumber);

        card.innerHTML = `
            <div class="place_top">
                <h3>${escapeHTML(place.title)}</h3>
                <span>${escapeHTML(place.category)}</span>
            </div>

            <div class="place_mid">
                <p class="place_address">
                    ${escapeHTML(place.address)}
                </p>

                <div class="place_meta">
                    <span >(${escapeHTML(distanceText)})</span>
                </div>
            </div>
                
            <div class="location_btn">
                <button type="button" class="place_food_btn" data-index="${index}">
                    관련 메뉴
                </button>

                <button type="button" class="place_search_btn" data-index="${index}">
                    길찾기
                </button>

                <button type="button" class="place_detail_btn" data-index="${index}">
                    카카오맵
                </button>
            </div>

            <div class="related_food_box is-hidden">
                ${renderRelatedTags(place)}
            </div>
        `;

        placeList.appendChild(card);
    });

    connectPlaceButtons(pagePlaces);
}

// ================================
// 관련 음식 태그 출력
// ================================

function renderRelatedTags(place) {
    if (!place.food || place.food.length === 0) {
        return '<span>#추천메뉴없음</span>';
    }

    return place.food.map(function(foodItem) {
        // 기존 fallback 문자열 메뉴
        if (typeof foodItem === 'string') {
            return `<span>#${escapeHTML(foodItem)}</span>`;
        }

        const specialText = foodItem.isSpecial ? '대표 ' : '';
        const menuName = `${specialText}${foodItem.name}`;

        if (foodItem.url) {
            return `
                <a class="related_food_tag redtable_menu_tag"
                   href="${escapeHTML(foodItem.url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    #${escapeHTML(menuName)}
                </a>
            `;
        }

        return `
            <span class="related_food_tag redtable_menu_tag">
                #${escapeHTML(menuName)}
            </span>
        `;
    }).join('');
}

// ================================
// 선택 카테고리 가져오기
// ================================

function getSelectedCategory() {
    const selectedButton = document.querySelector('.map_filter_btn.selected');

    if (!selectedButton) {
        return '전체';
    }

    return selectedButton.dataset.category || '전체';
}

// ================================
// 카드 버튼 연결
// ================================

function connectPlaceButtons(places) {
    const foodBtns = document.querySelectorAll('.place_food_btn');
    const searchBtns = document.querySelectorAll('.place_search_btn');
    const detailBtns = document.querySelectorAll('.place_detail_btn');

    foodBtns.forEach(function(button) {
        button.addEventListener('click', function() {
            const card = button.closest('.place_card');

            if (!card) return;

            const foodBox = card.querySelector('.related_food_box');

            if (!foodBox) return;

            foodBox.classList.toggle('is-hidden');

            if (foodBox.classList.contains('is-hidden')) {
                button.textContent = '관련 메뉴';
            } else {
                button.textContent = '메뉴 닫기';
            }
        });
    });

    searchBtns.forEach(function(button) {
        button.addEventListener('click', function() {
            const place = places[Number(button.dataset.index)];

            if (!place || !place.lat || !place.lng) return;

            const routeUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.title)},${place.lat},${place.lng}`;

            window.open(routeUrl, '_blank');
        });
    });

    detailBtns.forEach(function(button) {
        button.addEventListener('click', function() {
            const place = places[Number(button.dataset.index)];

            if (!place) return;

            if (!place.placeUrl || place.placeUrl === '카카오맵 링크') {
                alert('카카오맵 링크가 아직 없어요.');
                return;
            }

            window.open(place.placeUrl, '_blank');
        });
    });
}

// ================================
// 페이지네이션 버튼
// ================================

pageControlList.forEach(function(control) {
    if (control.prevBtn) {
        control.prevBtn.addEventListener('click', function() {
            if (currentPage <= 1) return;

            currentPage--;
            renderPlaceList(currentPlaceData);
        });
    }

    if (control.nextBtn) {
        control.nextBtn.addEventListener('click', function() {
            currentPage++;
            renderPlaceList(currentPlaceData);
        });
    }
});

// ================================
// 현재 위치 버튼
// ================================

if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', function() {
        getNowLocation();
    });
}

// ================================
// 검색 버튼
// ================================

if (mapSearchBtn) {
    mapSearchBtn.addEventListener('click', function() {
        if (!placeSearch) {
            renderPlaceList(currentPlaceData);
            return;
        }

        currentPage = 1;
        runSearchFromInput('submit');
    });
}

if (mapSearchInput) {
    mapSearchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();

            if (mapSearchBtn) {
                mapSearchBtn.click();
            }
        }
    });
}

// ================================
// 초기화 버튼
// ================================

if (mapResetBtn) {
    mapResetBtn.addEventListener('click', function() {
        // 최근 검색 조건 삭제
        localStorage.removeItem(LAST_MAP_SEARCH_KEY);

        // 검색창 비우기
        if (mapSearchInput) {
            mapSearchInput.value = '';
        }

        // 카테고리 전체로 초기화
        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        if (mapFilterBtns[0]) {
            mapFilterBtns[0].classList.add('selected');
        }

        // 거리 250m로 초기화
        if (distanceRange) {
            distanceRange.value = 1;
            updateDistanceRange();
        }

        // 데이터 초기화
        currentPlaceData = [];
        exitRestaurantSearchMode('맛집');
        currentSearchKeyword = '맛집';
        currentPage = 1;

        // 현재 위치 기준으로 다시 검색
        getNowLocation();
    });
}

// ================================
// HTML 출력 안전 처리
// ================================

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// 페이지 로드 후 최근 검색 조건 또는 현재 위치 기준으로 지도 실행
if (window.kakao && kakao.maps && typeof kakao.maps.load === 'function') {
    kakao.maps.load(function() {
        initMapPage();
    });
} else if (window.kakao && kakao.maps) {
    initMapPage();
} else {
    console.error('카카오맵 SDK가 로드되지 않았습니다. map.html의 Kakao script를 확인하세요.');
    alert('지도를 불러오지 못했어요. 카카오맵 설정을 확인해주세요.');
}