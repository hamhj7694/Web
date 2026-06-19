// 옵션 거리 막대
const distanceRange = document.querySelector('.distance_range');

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
        }
    });

    updateDistanceRange();
}

// ================================
// 지도 카테고리 필터 선택
// ================================

const mapFilterBtns = document.querySelectorAll('.map_filter_btn');

mapFilterBtns.forEach(function(button) {
    button.addEventListener('click', function() {
        // 1. 모든 카테고리 버튼에서 selected 제거
        mapFilterBtns.forEach(function(btn) {
            btn.classList.remove('selected');
        });

        // 2. 클릭한 버튼에 selected 추가
        button.classList.add('selected');
    });
});

// ================================
// 카카오맵 임시 장소 데이터
// ================================

const placeData = [
    {
        title: '오메추 식당',
        category: '한식',
        address: '서울특별시 어딘가 맛있는 길 12',
        desc: '김치찌개와 제육볶음이 인기 있는 든든한 밥집',
        rating: '4.5',
        distance: '도보 8분',
        lat: 37.5665,
        lng: 126.9780
    },
    {
        title: '말랑 분식',
        category: '분식',
        address: '서울특별시 맛동산로 24',
        desc: '떡볶이, 김밥, 튀김까지 한 번에 먹기 좋은 분식집',
        rating: '4.2',
        distance: '도보 12분',
        lat: 37.5651,
        lng: 126.9895
    }
];


// ================================
// 카카오맵 생성 + 마커 표시
// ================================

const mapContainer = document.querySelector('#map');
let kakaoMap = null;
let currentInfoWindow = null;
let placeMarkers = [];

// ================================
// 현재 위치 기반 카카오맵 생성
// ================================

// 기본 위치: 신림 근처 임시 좌표
let nowLat = 37.484;
let nowLng = 126.9297;

let myLocationMarker = null;

function getNowLocation() {
    // geolocation을 지원하지 않는 브라우저일 경우
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

            // 위치를 못 가져와도 기본 좌표로 지도 생성
            createMap();
        }
    );
}

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

    setMapBoundsByCurrentLocation();ㄴ
}

function renderMyLocationMarker(position) {
    if (!kakaoMap) return;

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

function getSelectedRadiusMeter() {
    if (!distanceRange) return 1000;

    const distanceMeterList = [500, 1000, 2000, 3000];

    return distanceMeterList[Number(distanceRange.value)] || 1000;
}

function setMapBoundsByCurrentLocation() {
    if (!kakaoMap) return;

    const radiusMeter = getSelectedRadiusMeter();

    // 위도 1도는 약 111.32km
    const latDiff = radiusMeter / 111320;

    // 경도는 현재 위도에 따라 실제 거리가 달라짐
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

    // 계산한 범위를 실제 지도에 적용
    kakaoMap.setBounds(bounds);
}

function renderPlaceMarkers(places) {
    if (!kakaoMap) return;

    places.forEach(function(place, index) {
        const position = new kakao.maps.LatLng(place.lat, place.lng);

        const marker = new kakao.maps.Marker({
            map: kakaoMap,
            position: position
        });

        const infoWindow = new kakao.maps.InfoWindow({
            content: `
                <div style="padding:8px 10px;font-size:13px;line-height:1.5;white-space:nowrap;">
                    <strong>${place.title}</strong><br>
                    ${place.address}
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
            data: place
        });
    });
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
// 현재 위치 버튼
// ================================

const currentLocationBtn = document.querySelector('#currentLocationBtn');

if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', function() {
        getNowLocation();
    });
}

// ================================
// 장소 카드 보기 버튼 클릭 시 지도 이동
// ================================

const placeDetailBtns = document.querySelectorAll('#locationView');

placeDetailBtns.forEach(function(button, index) {
    button.addEventListener('click', function() {
        const markerInfo = placeMarkers[index];

        if (!markerInfo || !kakaoMap) {
            alert('지도 정보를 불러오는 중이에요.');
            return;
        }

        kakaoMap.setCenter(markerInfo.position);
        kakaoMap.setLevel(4);

        openPlaceInfo(markerInfo.marker, markerInfo.infoWindow);

        mapContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    });
});

// 페이지 로드 후 현재 위치 찾기 실행
getNowLocation();