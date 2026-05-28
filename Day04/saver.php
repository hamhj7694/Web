<?php
    header("Content-Type:text/html; charset=utf-8");

    //글씨 데이터 받기
    $nicname= $_POST['nicname'];
    $title= $_POST['title'];
    $msg= $_POST['msg'];

    //파일 데이터(파일 정보) 받기
    $file= $_FILES['f1'];

    //받은 파일 정보(5개) 중 필요한 2개 정보만 추출
    $file_name= $file['name']; //원본 파일명
    $file_temp= $file['tmp_name']; //실제 파일의 임시저장소
    
    //임시 저장소에 있는 실제 파일을 영구적으로 서버에 저장하기 위해 이동!
    $save_file = "./uploaded/" . date('YmdHis') . $file_name;
    $result= move_uploaded_file($file_temp, $save_file);
    if($result){
        echo "파일 업로드 성공!<br>";
    } else{
        echo "파일 업로드 실패 ㅠㅠ<br>";
    }

    //글씨 데이터도 잘 받았는지 확인하기
    echo "$nicname <br>";
    echo "$title <br>";
    echo "$msg <br>";
    echo "<hr>";

    $now = date('Y-m-d H:i:s'); //게시글이 저장된 날짜와 시간..

    // MySQL 데이터 베이스의 board 라는 이름의 테이블(표)에 데이터 저장하기
    // [저장할 데이터들 : $name, $title, $msg, $dst_name, $now]

    //1. 접속
    $db= mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');

    //2. 한글 깨짐 방지
    mysqli_query($db, "set names utf8");

    //3. 데이터 삽입 요청 쿼리문 작성 및 요청
    $sqldata = "INSERT INTO board(nicname, title, msg, file_path, date) VALUES('$nicname','$title','$msg','$save_file','$now')";
    $result= mysqli_query($db, $sqldata);
    if($result){
        echo "게시글 저장 성공!!";
    } else{
        echo "게시글 저장 실패! 다시 저장하십시오!";
    }

    //4. 연결 종료
    mysqli_close($db);

?>