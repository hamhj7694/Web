<?php

    // 응답할 데이터의 형식을 미리 알려줘야한다.
    header("Content-Type:text/html; charset=utf-8");

    // 사용자가 get 방식으로 보낸 데이터를 처리해 보기
    // PHP는 get 방식으로 보내온 데이터들을 $_GET이라는 이람의 배열에 자동 넣어줌
    // PHP에서는 언어에서 변수를 만들거나 사용할 때는 반드시 $와 함께 사용!
    $title= $_GET['title'];
    $message= $_GET['msg'];

    // 이 사이가 php 코딩 영역
    // php의 목적 = 사용자가 보는 브라우저에 글씨 정보 보여주기(응답하기 response)
    echo "<h2>Tiis is php server</h2>";
    echo "<p>한글도 잘 돼요</p>";
    // 사용자가 보낸 데이터를 잘 받았는지 응답(브라우저에 출력)
    echo "$title <br>";
    echo "$message";
?>