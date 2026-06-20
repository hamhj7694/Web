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
const pageStrongList = document.querySelectorAll('.section_header strong');
const placeCount = pageStrongList[0];
const pageInfo = pageStrongList[1];

const mapSearchInput = document.querySelector('#mapSearchInput');
const mapSearchBtn = document.querySelector('#mapSearchBtn');
const mapResetBtn = document.querySelector('#mapResetBtn');
const currentLocationBtn = document.querySelector('#currentLocationBtn');

// ================================
// 카카오맵 임시 장소 데이터
// ================================

const placeData = [
    {
        title: '오메추 식당',
        category: '한식',
        address: '서울특별시 어딘가 맛있는 길 12',
        placeUrl: 'https://map.kakao.com/',
        food: ['제육', '계란말이', '김치찌개'],
        lat: 37.5665,
        lng: 126.9780
    },
    {
        title: '말랑 분식',
        category: '분식',
        address: '서울특별시 맛동산로 24',
        placeUrl: 'https://map.kakao.com/',
        food: ['떡볶이', '김밥', '튀김'],
        lat: 37.5651,
        lng: 126.9895
    }
];

// ================================
// 카카오맵 생성 + 마커 표시
// ================================

let kakaoMap = null;
let currentInfoWindow = null;
let placeMarkers = [];

// 기본 위치: 신림 근처 임시 좌표
let nowLat = 37.484;
let nowLng = 126.9297;

let myLocationMarker = null;

// ================================
// 거리 막대
// ================================

if (distanceRange) {
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

    distanceRange.addEventListener('input', function() {
        updateDistanceRange();

        if (kakaoMap) {
            setMapBoundsByCurrentLocation();
            renderPlaceList(placeData);
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

        renderPlaceList(placeData);
    });
});

// ================================
// 현재 위치 가져오기
// ================================

function getNowLocation() {
    if (!navigator.geolocation) {
        alert('현재 위치 기능을 지원하지 않는 브라우저입니다.');
        createMap();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            nowLat = position.coords.latitude;
            nowLng = position.coords.longitude;

            createMap();
        },
        function(error) {
            alert('위치 정보를 가져오지 못했습니다: ' + error.message);

            createMap();
        }
    );
}

// ================================
// 지도 생성
// ================================

function createMap() {
    if (!mapContainer || !window.kakao || !kakao.maps) return;

    const nowPosition = new kakao.maps.LatLng(nowLat, nowLng);

    const mapOption = {
        center: nowPosition,
        level: 5
    };

    kakaoMap = new kakao.maps.Map(mapContainer, mapOption);

    currentInfoWindow = null;
    placeMarkers = [];

    renderMyLocationMarker(nowPosition);
    renderPlaceMarkers(placeData);
    renderPlaceList(placeData);

    setMapBoundsByCurrentLocation();
}

// ================================
// 현재 위치 마커
// ================================

function renderMyLocationMarker(position) {
    if (!kakaoMap) return;

    if (myLocationMarker) {
        myLocationMarker.setMap(null);
    }

    myLocationMarker = new kakao.maps.Marker({
        map: kakaoMap,
        position: position
    });

    const myInfoWindow = new kakao.maps.InfoWindow({
        content: `
            <div style="padding:8px 10px;font-size:13px;line-height:1.5;white-space:nowrap;">
                <strong>현재 위치</strong>
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

    const distanceMeterList = [100, 300, 500, 1000];

    return distanceMeterList[Number(distanceRange.value)] || 300;
}

// ================================
// 지도 범위 조정
// ================================

function setMapBoundsByCurrentLocation() {
    if (!kakaoMap) return;

    const radiusMeter = getSelectedRadiusMeter();

    const latDiff = radiusMeter / 111320;
    const lngDiff = radiusMeter / (111320 * Math.cos(nowLat * Math.PI / 180));

    const southWest = new kakao.maps.LatLng(
        nowLat - latDiff,
        nowLng - lngDiff
    );

    const northEast = new kakao.maps.LatLng(
        nowLat + latDiff,
        nowLng + lngDiff
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
            position: position
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
// 장소 리스트 출력
// ================================

function renderPlaceList(places) {
    if (!placeList) return;

    const selectedCategory = getSelectedCategory();

    const filteredPlaces = places
        .map(function(place) {
            const distanceNumber = getDistanceMeter(
                nowLat,
                nowLng,
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

    if (placeCount) {
        placeCount.textContent = filteredPlaces.length;
    }

    if (pageInfo) {
        pageInfo.textContent = filteredPlaces.length > 0 ? '1/1' : '0/0';
    }

    if (filteredPlaces.length === 0) {
        placeList.innerHTML = `
            <p class="empty_place_text">
                검색 결과가 없어요!
            </p>
        `;
        return;
    }

    filteredPlaces.forEach(function(place, index) {
        const card = document.createElement('article');
        card.className = 'place_card';

        const distanceText = formatDistance(place.distanceNumber);

        card.innerHTML = `
            <div class="place_top">
                <h3>${escapeHTML(place.title)}</h3>
                <span>${escapeHTML(place.category)}</span>
            </div>

            <p class="place_address">
                ${escapeHTML(place.address)}
            </p>

            <div class="place_meta">
                <span>${escapeHTML(distanceText)}</span>
                <span>${escapeHTML(place.category)}</span>
            </div>

            <div class="location_btn">
                <button type="button" class="place_food_btn" data-index="${index}">
                    메뉴
                </button>

                <button type="button" class="place_search_btn" data-index="${index}">
                    길찾기
                </button>

                <button type="button" class="place_detail_btn" data-index="${index}">
                    상세
                </button>
            </div>

            <div class="related_food_box">
                ${renderRelatedTags(place)}
            </div>
        `;

        placeList.appendChild(card);
    });

    connectPlaceButtons(filteredPlaces);
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
            const place = places[Number(button.dataset.index)];

            if (!place) return;

            if (!place.food || place.food.length === 0) {
                alert('등록된 메뉴가 없어요.');
                return;
            }

            alert(`${place.title} 메뉴\n- ${place.food.join('\n- ')}`);
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

            const markerInfo = placeMarkers.find(function(markerData) {
                return markerData.data.title === place.title &&
                    markerData.data.address === place.address;
            });

            if (markerInfo && kakaoMap) {
                kakaoMap.setCenter(markerInfo.position);
                kakaoMap.setLevel(4);
                openPlaceInfo(markerInfo.marker, markerInfo.infoWindow);

                mapContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                return;
            }

            if (place.placeUrl) {
                window.open(place.placeUrl, '_blank');
            }
        });
    });
}

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
        alert('검색 기능은 다음 단계에서 연결할게요.');
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

        renderPlaceList(placeData);
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

// 페이지 로드 후 현재 위치 찾기 실행
getNowLocation();