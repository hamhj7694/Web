<?php

    header("Content-Type:text/html; charset=utf-8");
    
    // 사용자가 GET 방식으로 보낸 데이터를 받기
    $name = $_GET['name'];
    $msg = $_GET['msg'];

    // $name $msg 변수에 있는 데이터를 Database에 저장하기
    // Databas는 엑셀 같은 구조를 가진 프로그램
    // 그래서 데이터를 저장하려면, 구조를 가진 표(table)를 만들어야 함.

    // 데이터 삽입 작업은 SQL이라는 데이터베이스 전용 언어를 사용
    // My SQL에 접속하여 memo 테이블에 이름 $name, 메시지 $msg 데이터를 삽입하기
    
    // 1. MySQL에 접속하기
    $db= mysqli_connect('localhost','testham','a1s2d3f4!','testham'); //DB서버URL, DB접속ID, DB접속PW, DB명칭
    // 내 PC에서 내 PC에 접속하는 방법 [ 127.0.0.1 = localhost ]

    // 2. DB 안에서 한글이 깨지지 않도록 요청.
    mysqli_query($db, 'set names utf8');

    // 3. 원하는 CRUD 작업을 요청하는 질의문 만들고 요청
    $sql="INSERT INTO memo(name, msg) VALUES('$name', '$msg')";
    $result = mysqli_query($db, $sql); //쿼리문이 성공하면 true, 실패하면 false 리턴
    if($result){
        echo "메모글 저장이 완료 되었습니다.";
    }else{
        echo "메모글 저장에 실패했습니다. 다시 시도해 주세요.";
    }

    // 4. 연결종료
    mysqli_close($db);

?>