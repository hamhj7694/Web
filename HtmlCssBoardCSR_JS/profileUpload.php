<?php

    if(isset($_FILES['img'])){ //혹시 'img'라는 이름의 식별자가 있는지 여부
        $file= $_FILES['img'];

        echo "파일이름 : ". $file['name'].'\n';
        echo "파일크기 : ". $file['size'].'\n';
        echo "임시저장소 : ". $file['tmp_name'].'\n';

        move_uploaded_file($file['tmp_name'], "./" . $file['name']);

        // 문자열 데이터는 그냥 POST 방식으로 전달되었으니..
        $nickname= $_POST['nickname'];
        echo "닉네임 : $nickname";
    }
?>