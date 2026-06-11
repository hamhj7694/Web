// --------------------------------------------
// 현재 위치 찾기

let nowLat = 37.484;
let nowLng = 126.9297;

function getNowLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
            
        nowLat = position.coords.latitude;
        nowLng = position.coords.longitude;

		createMap();

    }, function(error) {
        alert("위치 정보를 가져오지 못했습니다: " + error.message);
		createMap();
    });
}

// 위치 찾기 실행
window.onload = function() {
    getNowLocation();
};

// --------------------------------------------------------

function createMap(){
	// 지도 가져오기
	var container=document.getElementById('map');

	var options= { //지도 생성 기본 옵션
		center: new kakao.maps.LatLng(nowLat, nowLng), //지도 가운데
		level: 3, // 줌 레벨 1~25
	}

	// 지도객체를 만들고 보여주기
	var map= new kakao.maps.Map(container, options);

	// --------------------------------------------------------
	// // 내 위치에 일반 마커 표시하기
	// // 마커가 표시될 위치입니다 
	// var markerPosition  = new kakao.maps.LatLng(nowLat, nowLng); 

	// // 마커를 생성합니다
	// var marker = new kakao.maps.Marker({
	//     position: markerPosition
	// });

	// // 마커가 지도 위에 표시되도록 설정합니다
	// marker.setMap(map);

	// // 아래 코드는 지도 위의 마커를 제거하는 코드입니다
	// // marker.setMap(null);

	// ----------------------------------------------
	// 다른 이미지로 마커 생성하기
	var imageSrc = './img/ring.png', // 마커이미지의 주소입니다    
		imageSize = new kakao.maps.Size(40, 40), // 마커이미지의 크기입니다
		imageOption = {offset: new kakao.maps.Point(20,20)}; // 마커이미지의 옵션입니다. 마커의 좌표와 일치시킬 이미지 안에서의 좌표를 설정합니다.

	// 마커의 이미지정보를 가지고 있는 마커이미지를 생성합니다
	var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
		markerPosition = new kakao.maps.LatLng(nowLat, nowLng); // 마커가 표시될 위치입니다

	// 마커를 생성합니다
	var marker = new kakao.maps.Marker({
		position: markerPosition, 
		image: markerImage // 마커이미지 설정 
	});

	// 마커가 지도 위에 표시되도록 설정합니다
	marker.setMap(map);
}