<?php
    header('Content-Type:text/html; charset=utf-8');

    //사용자가 GET방식으로 전달한 값을 변수에 저장
    $nickname= $_GET['nickname'];
    $email= $_GET['email'];

    //실제로는 Database에 저장하는 작업 수행하고 결과를 응답(response - echo)
    //DB작업까지 하면 시간이 오래걸리니..지금은 그냥... 받은 데이터를 그래도 응답해주기
    //echo "$nickname - $email 값으로 회원가입을 했습니다.";

    //AJAX 기술이 없을때.. 페이지가 변경되었다는 것을 사용자가 인식하지 못하도록..
    //응답할때. 원래 웹 페이지를 그대로 다시 출력..
    echo ("
    <!DOCTYPE html>
    <html lang='ko'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>no ajax</title>
    </head>
    <body>

        <!-- 서버에 있는 텍스트 문서를 읽어오는 요청 HTTP Request -->
        <form action='./aaa.txt' method='get'>
            <input type='submit' value='서버의 텍스트 데이터 불러오기'>
        </form>
        <hr>

        <h3>회원가입 페이지</h3>
        <form action='./aaa.php' method='get'>
            <input type='text' placeholder='닉네임 입력하세요.' name='nickname' value='$nickname'>
            <input type='text' placeholder='이메일 입력하세요.' name='email' value='$email'>

            <input type='submit' value='가입하기'>
        </form>
        <hr>
        <textarea cols='50' rows='5'>$nickname - $email 데이터로 회원가입했습니다.</textarea>
        
    </body>
    </html>
    ");
?>