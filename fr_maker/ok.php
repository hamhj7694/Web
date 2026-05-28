<?php

    header("Content-Type:text/html; charset=utf-8");

    $name= $_POST['name'];
    $phone= $_POST['phone'];
    $gender= $_POST['gender'];
    $age= $_POST['age'];

    // --- 파일 받기 관련 ---
    //파일 데이터(파일 정보) 받기
    $file= $_FILES['img1'];

    //받은 파일 정보(5개) 중 필요한 2개 정보만 추출
    $file_name= $file['name']; //원본 파일명
    $file_temp= $file['tmp_name']; //실제 파일의 임시저장소
    // --------------------

    // [수정] HTML에서 넘겨준 체크박스 배열을 그대로 받습니다.
    $pick_array = isset($_POST['pick']) ? $_POST['pick'] : [];
    $num= count($pick_array);
    // [핵심 수정] 배열로 된 체크박스 값을 "여자친구, 썸녀" 형태의 하나의 '문자열'로 합쳐줍니다.
    // 이렇게 해야 DB의 VARCHAR 이나 TEXT 컬럼에 안전하게 저장됩니다.
    $pick = implode(', ', $pick_array);
    
    // $msg1= $_POST['msg1'];
    $msg2= $_POST['msg2'];

    $hamage = date("Y") - 2000 + 1;
    $gab = abs($hamage - $age);

    //--------------------------------------------------------------------------
    $db= mysqli_connect('localhost','testham','a1s2d3f4!','testham');

    mysqli_query($db, 'set names utf8');

    //임시 저장소에 있는 실제 파일을 영구적으로 서버에 저장하기 위해 이동!
    $file_path = "./uploaded/" . $name . date('YmdHis') . $file_name;

    $data ="INSERT INTO fr_maker(name, gender, age, phone, pick, msg2, file_path) VALUES('$name', '$gender', '$age', '$phone', '$pick', '$msg2', '$file_path')";

    $result = mysqli_query($db, $data);
    $result2= move_uploaded_file($file_temp, $file_path);

    if($result){

        echo "<h1> ❤️ $name 님 ❤️ $pick 을(를) 지원해 주셔서 감사합니다!</h1><HR>";
        echo "<h2>$name 님과 저의 나이 차이는 $gab 살 이네요. 잘 부탁 드려요 ㅎㅎ</h2>";        
        echo "<h2>$phone 으로 연락 드리겠습니다!</h2><hr>";
        echo "<h4>문의 사항: 010-5616-7694 함형준</h4>";

    }else{
        echo "지원 실패. 다시 시도해 주세요.";
    }

    mysqli_close($db);

?>