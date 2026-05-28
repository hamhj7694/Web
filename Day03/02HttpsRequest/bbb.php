<?php

    // 응답하는 데이터의 형식 지정. 한글깨짐 방지
    header("Content-Type:text/html; charset=utf-8");

    // 사용자가 POST 방식으로 보낸 데이터는 $_POST 라는 특별한 배열변수에 저장되어 있음.
    // 이 배열변수에서 원하는 값들을 추출
    $user_id= $_POST['user_id'];
    $user_pw= $_POST['user_pw'];
    $gender= $_POST['gender'];
    $message= $_POST['msg'];
    $brand= $_POST['brand'];
    
    // textarea 에서의 줄바꿈은 \n 임.
    // 웹 브라우저는 줄바꿈을 <br>태그를 사용해야 함
    // 그래서 $maesage 변수 안에 있는 \n을 br 태그로 변환해야 함.
    // php에는 이 작업을 해주는 기능(function-함수)이 존재함
    $message = nl2br($message);

    // 실무에서는 이 데이터들을 Database에 저장하는 등의 코드를 작성함.
    // 오늘 이번 예제에서는 데이터를 잘 받았는지 확인하는 정도로 실습...
    // 받은 데이터들을 사용자에게 그대로 응답response 해주기(브라우저에 보여주기)
    echo "<p>아이디: $user_id</p>";
    echo "<p>비밀번호: $user_pw</p>";
    echo "<p>성별: $gender</p>";
    echo "<p>자동차 브랜드: $brand</p>";
    echo "<p>메시지:<br> $message</p>";

    // checkbox 는 다중선택으로 여러개의 값을 동시에 보내기에 배열로 받아짐
    $fruits= $_POST['fruits'];
    // $fruits 는 배열변수임 - 파이썬의 리스트와 같은 구조.. 인덱스 번호 사용
    // 배열의 요소 개수를 알아내자
    $num= count($fruits);
    for($i=0; $i<$num; $i++){
        echo "$fruits[$i],";
    }

?>