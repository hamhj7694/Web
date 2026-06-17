function submitBoard(){
    // form요소는 action속성이 없어도, submit이 발동하면 무조건 페이지 변경 발동!
    // action이 없기에 현재 문서를 새로고침함... 결국 페이지 변경이 되는 것임!
    // 이 기본 동작을 막기(방지하기)
    window.event.preventDefault();
    
    // alert() //테스트

    // 사용자가 입력한 값을 서버에 전송하여 web_board 테이블에 저장되도록 AJAX 코드 작성
    var title= document.getElementById('in1').value;
    var writer= document.getElementById('in2').value;
    var password= document.getElementById('in3').value;
    var message= document.getElementById('in4').value;

    // 보낼 데이터를 key=value 형식으로 만들기 불편.
    // json 형식으로 보내기! (요즘 선호 방식 -- 요청/응답 모두 json형식)

    // json을 형식의 문자열을 곧바로 만드는 건 불편해서... 먼저 js객체로 생성!
    var data= {
        title:title,
        writer:writer,
        pw:password,
        msg:message
    }
    // 이 js객체를 json 문자열로 변환하기!
    var jsonData= JSON.stringify(data); //stringify 문자열화 시키기

    // alert(jsonData) //테스트

    // AJAX 기술로 서버에 위 데이터를 POST방식으로 전송하고 응답받기
    fetch('../backend/board/insertBoard.php',{
        method:'POST',
        headers: {'Content-Type':'application/json'}, // 보내는 데이터가 json 임을 알려주기
        body: jsonData
    })
    .then(function(res){
        return res.text()
    })
    .then(function(text){
        alert(text)

        // 서버 응답이 잘 되었으니.. 다시 게시판 목록 화면(index.html)로 이동
        window.location.href= '../index.html';
    })
}