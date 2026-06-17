// js 이용해서 서버의 데이터를 게시글 목록으로 불러와서 HTML 그려내는 작업 수행
// js를 이용해 웹문서의 DOM 요소를 생성하여 그려내는 방식을 CSR이라 함

// js가 헤더에 추가 돼 있고, 게시글을 추가해야하는 table 요소는 body에 있음
// body가 완료된 후 DOM 작업 수행해야 함.

// 방법2가지
// 1. body요소에 onload 이벤트 적용(내부 스크립트 추천)
// 2. 외부스크립트일 경우 defer 속성을 적용

// [연습] 지금은 1번 방식으로 onload 이벤트 발동 시 자동 실행 함수 만들기
function loaded(){
    
    // backend 서버에서 게시글 데이터들을 받아오기 [ 데이터가 많기에 구별이 용이한 json 형식으로 받기 ]
    // 웹보드라는 테이블에서 모든 데이터를 읽어와서 json으로 응답해주는 php 코드 작성
    
    // js에서 페이지의 변경 없이 서버에서 데이터만 요청하는 기법 AJAX 사용
    // 이 작업을 수행해주는 내장 함수 fetch()

    // [중요!] 경로 주의! js 파일 기준이 아니라 js 연결한 .html 파일의 위치를 기준으로 상대경로!
    fetch('./backend/board/loadBoardList.php')
    .then(function(response){
        return response.text();
    })
    .then(function(text){
        // alert(text) //확인하기

        // json 형식의 데이터를 js의 객체로 변환하여 원하는 값들 추출(분석 - parse)
        var json= JSON.parse(text);

        // js로 화면 그리기
        // 1) 게시글 총 개수를 제목 영역에 표시하기
        var p= document.querySelector('.board_title>p');
        p.innerHTML= "자유롭게 게시글을 작성하며 이야기를 나누세요. [총 게시글 수: "+ json.total +" ]";

        // 2) 읽어온 게시글 데이터들을 table의 하위 요소로 추가하기
        // 데이터가 여러개이니 반복문! 파이썬의 for in 처럼 더 쉽게 해보기
        for( board of json.data ){ //배열의 요소가 반복
            // 테이블에 추가되 <tr>요소와 데이터들을 만들기
            var row="";
            row += "<tr>";
            row += `<td class="col_no">${board.no}</td>`;
            row += `<td class="col_title"><a href="./board/view.html?no=${board.no}">${board.title}</a></td>`
            row += `<td class="col_writer">${board.writer}</td>`
            row += `<td class="col_date">${board.date}</td>`
            row += `<td class="col_hits">${board.hits}</td>`
            row += "</tr>";

            // 테이블 요소의 자식으로 추가
            document.getElementsByClassName('board_list')[0].innerHTML += row;

        } // for문의 끝

    })
    
} //-----------------------