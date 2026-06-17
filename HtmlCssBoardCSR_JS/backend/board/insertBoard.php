<?php
    header('Content-Type:text/plain; charset=utf-8');

    // 사용자가 json으로 데이터를 보내면 php언어는 특정 위치(php://input)에 이 값을 파일로 보관함
    // 그래서 그 파일을 읽어와야 함.
    $json_data= file_get_contents('php://input');
    // json 형식의 문자열에서 값들의 추출을 쉽게 하기 위해 연관배열로 해독해 내기..
    $datas= json_decode($json_data, true); //true:연관배열로 만들지 여부.

    // 데이터들에서 각 값들을 추출(제목, 글쓴이, 비밀번호, 메세지)
    $title= $datas['title'];
    $writer= $datas['writer'];
    $password= $datas['pw'];
    $message= $datas['msg'];

    //참고로.. DB에 비밀번호같은 것을 저장할때..노출되지 않도록.. 암호화 가능
    $password=password_hash($password, PASSWORD_DEFAULT);
    //나중에 해독하는 것은.. password_verify() 함수 이용.

    // 게시글 저장날짜..
    $now= date('Y.m.d H:i:s');

    // web_board 테이블안에 새로운 게시글을 저장.
    // 테이블 컬룸들 : no, title, msg, writer, date, hits, password
    // 저장할 값들 : $title, $message, $writer, $now, 0, $password
    
    // MySQL DBMS과 연결하여 위 값들을 삽입하기
    $db= mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');
    mysqli_query($db, 'set names utf8');

    // 원하는 쿼리 작성
    $sql= "INSERT INTO web_board(title,msg,writer,date,hits,password) VALUES('$title','$message','$writer','$now','0','$password')";
    $result= mysqli_query($db, $sql); //실행 결과를 true/false 로 줌

    if($result) echo "글 저장을 성공했습니다.";
    else echo "글 저장 중 오류가 발생했습니다. 다시 시도해 주세요.";

    mysqli_close($db);
?>