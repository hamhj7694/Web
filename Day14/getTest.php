<?php
    header('Content-Type:text/html; charset=utf-8');

    //사용자 ajax로 보내온 [이름, 비밀번호]를 받기
    $name= $_GET['name'];
    $password= $_GET['pw'];

    //사용자 측에 데이터를 잘 받았다고 응답(response - echo)
    echo "이름: $name<br>";
    echo "비밀번호: $password<br>";

?>