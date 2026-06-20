// 옵션 거리 막대
const distanceRange = document.querySelector('.distance_range');

// ================================
// 지도 카테고리 필터 선택
// ================================

const mapFilterBtns = document.querySelectorAll('.map_filter_btn');

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
let currentInfoWindow = null;
let placeMarkers = [];

let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// 기본 fallback 위치: 서울역
const FALLBACK_LAT = 37.5547;
const FALLBACK_LNG = 126.9706;
const FALLBACK_LABEL = '서울역';

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

let myLocationMarker = null;

// 최근 검색 조건 저장
const LAST_MAP_SEARCH_KEY = 'omechu_last_map_search';

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

    // 예: 신림역 파스타 / 강남역 초밥 / 수원 스타필드 버거킹
    if (words.length >= 2 && hasLocationHint && lastWordIsFood) {
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
    return {
        type: 'food',
        baseKeyword: currentBaseLabel,
        foodKeyword: normalizeFoodKeyword(keyword),
        shouldSearchBaseLocation: false
    };
}

function hasLocationKeyword(keyword) {
    return LOCATION_HINT_WORDS.some(function(word) {
        return keyword.includes(word);
    });
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

// ================================
// 카카오 음식/식당 검색
// ================================

function searchFoodPlacesAroundBase(foodKeyword) {
    if (!placeSearch || !kakaoMap) {
        alert('카카오 장소 검색을 사용할 수 없어요. services 라이브러리를 확인해 주세요.');
        return;
    }

    const keyword = foodKeyword.trim() || '맛집';
    const radiusMeter = getSelectedRadiusMeter();
    const centerPosition = new kakao.maps.LatLng(currentBaseLat, currentBaseLng);

    placeSearch.keywordSearch(
        keyword,
        function(result, status) {
            if (status !== kakao.maps.services.Status.OK) {
                currentPlaceData = [];
                currentPage = 1;
                renderPlaceList(currentPlaceData);
                return;
            }

            currentPlaceData = result.map(function(kakaoPlace) {
                return convertKakaoPlace(kakaoPlace);
            });

            currentSearchKeyword = keyword;
            currentPage = 1;

            saveLastMapSearch();

            renderPlaceList(currentPlaceData);
            setMapBoundsByCurrentLocation();
        },
        {
            location: centerPosition,
            radius: radiusMeter,
            sort: kakao.maps.services.SortBy.ACCURACY
        }
    );
}

function convertKakaoPlace(kakaoPlace) {
    return {
        title: kakaoPlace.place_name,
        category: getCategoryFromKakaoPlace(kakaoPlace.category_name),
        address: kakaoPlace.road_address_name || kakaoPlace.address_name || '주소 정보 없음',
        placeUrl: kakaoPlace.place_url || 'https://map.kakao.com/',
        food: getFoodKeywordsFromKakaoPlace(kakaoPlace),
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

function getFoodKeywordsFromKakaoPlace(kakaoPlace) {
    const keywordSource = `${kakaoPlace.place_name} ${kakaoPlace.category_name}`;

    const foodKeywordList = [
        '김치찌개', '제육', '백반', '국밥', '냉면', '삼겹살',
        '떡볶이', '김밥', '라면', '돈까스', '돈카츠', '우동', '라멘',
        '초밥', '짜장면', '짬뽕', '탕수육', '파스타', '피자',
        '버거', '치킨', '마라탕', '커피', '케이크', '디저트'
    ];

    const matchedKeywords = foodKeywordList.filter(function(foodName) {
        return keywordSource.includes(foodName);
    });

    if (matchedKeywords.length > 0) {
        return matchedKeywords.slice(0, 3);
    }

    if (kakaoPlace.category_name && kakaoPlace.category_name.includes('카페')) {
        return ['커피', '디저트'];
    }

    return ['추천메뉴'];
}

// ================================
// 거리 막대
// ================================

    function updateDistanceRange() {
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

        if (kakaoMap) {
            currentPage = 1;
            setMapBoundsByCurrentLocation();
            renderPlaceList(currentPlaceData);
        }
    });

    updateDistanceRange();
}

// ================================
// 카테고리 필터 선택
// ================================

mapFilterBtns.forEach(function(button) {
    button.addEventListener('click', function() {
        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        button.classList.add('selected');

        currentPage = 1;
        renderPlaceList(currentPlaceData);
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

    currentSearchKeyword = '맛집';
    currentPage = 1;

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
        alert('현재 위치를 가져올 수 없어 서울역 기준으로 검색할게요.');
        setFallbackLocation();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentBaseLat = position.coords.latitude;
            currentBaseLng = position.coords.longitude;
            currentBaseLabel = '현재 위치';
            currentBaseType = 'gps';

            currentSearchKeyword = '맛집';
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
                searchFoodPlacesAroundBase(currentSearchKeyword);
            } else {
                renderPlaceList([]);
            }
        },
        function() {
            alert('현재 위치를 가져오지 못했어요. 서울역 기준으로 검색할게요.');
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

    if (kakao.maps.services) {
        placeSearch = new kakao.maps.services.Places();
    }

    currentInfoWindow = null;
    placeMarkers = [];

    renderMyLocationMarker(nowPosition);
    connectMapDragEvent();
    renderPlaceList(currentPlaceData);

    setMapBoundsByCurrentLocation();
}

// ================================
// 지도 드래그 기준 위치 변경
// ================================

function connectMapDragEvent() {
    if (!kakaoMap) return;

    kakao.maps.event.addListener(kakaoMap, 'dragend', function() {
        // 지도 드래그만으로는 기준 위치를 바꾸지 않음
        // 검색 버튼을 눌렀을 때 현재 지도 중심을 기준 위치로 사용
        currentBaseType = 'map_moved';
    });
}

function setBaseLocationByMapCenter() {
    if (!kakaoMap) return;

    const center = kakaoMap.getCenter();

    currentBaseLat = center.getLat();
    currentBaseLng = center.getLng();
    currentBaseLabel = '지도 중심';
    currentBaseType = 'map_center';

    renderMyLocationMarker(center);
}

// ================================
// 현재 위치 마커
// ================================

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

            if (place.distanceNumber > radiusMeter) {
                return false;
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
                    음식 키워드
                </button>

                <button type="button" class="place_search_btn" data-index="${index}">
                    길찾기
                </button>

                <button type="button" class="place_detail_btn" data-index="${index}">
                    정보 상세보기
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

    return place.food.map(function(foodName) {
        return `<span>#${escapeHTML(foodName)}</span>`;
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
                button.textContent = '음식 키워드';
            } else {
                button.textContent = '키워드 닫기';
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
        const inputValue = mapSearchInput ? mapSearchInput.value : '';
        const parsedSearch = parseSearchInput(inputValue);

        console.log('검색어 해석 결과:', parsedSearch);

        if (parsedSearch.shouldSearchBaseLocation) {
            alert('지역/장소 기준 검색은 다음 단계에서 연결할게요. 우선 음식/브랜드 검색부터 테스트해 주세요.');
            return;
        }

        // 음식/브랜드 검색은 검색 버튼을 누른 순간의 지도 중심을 기준으로 검색
        setBaseLocationByMapCenter();

        currentPage = 1;
        searchFoodPlacesAroundBase(parsedSearch.foodKeyword);
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
        if (mapSearchInput) {
            mapSearchInput.value = '';
        }

        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        if (mapFilterBtns[0]) {
            mapFilterBtns[0].classList.add('selected');
        }

        if (distanceRange) {
            distanceRange.value = 1;
            updateDistanceRange();
        }

        currentPlaceData = [];
        currentSearchKeyword = '맛집';
        currentPage = 1;

        getNowLocation();
        return;
        
        if (kakaoMap) {
            currentPage = 1;
            setMapBoundsByCurrentLocation();

            if (placeSearch) {
                searchFoodPlacesAroundBase(currentSearchKeyword);
            } else {
                renderPlaceList(currentPlaceData);
            }
        }

        renderPlaceList(currentPlaceData);
        setMapBoundsByCurrentLocation();
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
initMapPage();