<?php

    header("Content-Type:text/html; charset=utf-8");

    $name= $_POST['name'];
    $gender= $_POST['gender'];
    $age= $_POST['age'];
    $pick= $_POST['pick'];
    $phone= $_POST['phone'];
    $gab = abs(27 - $age);

    $num= count($pick);

    echo "<h1> $name 님 </h1>";
    for($i=0; $i<$num; $i++){
        echo ", $pick[$i]";
    }
    echo "를 지원해 주셔서 감사합니다!";
    echo "<h2>$name 님과 저의 나이 차이는 $gab 살 이네요. 잘 부탁 드려요 ㅎㅎ </h2>";
    echo "<h2>결과는 심사 후 $phone 으로 연락 드리겠습니다!</h2>";

?>