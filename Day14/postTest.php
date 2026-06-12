<?php
    header('Content-Type:text/html; charset=utf-8');

    $name= $_POST['name'];
    $password= $_POST['pw'];

    echo "${name}과 ${password}를 잘 받았습니다!"
?>