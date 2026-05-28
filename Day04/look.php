<?php

    header("Content-Type:text/html; charset=utf-8");

    // board 테이블에 저장되어 있는 모든 게시글 데이터들 읽어와서 응답response 해주기.

    //1. 접속
    $db= mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');

    //2. 한글 깨짐 방지
    mysqli_query($db, "set names utf8");

    //3. board 테이블 에서 모든 게시글 데이터들을 가져오는 쿼리문 작성 및 요청
    $data = "SELECT * FROM board";
    $result_table = mysqli_query($db, $data); //select 조건에 따른 결과표 리턴
    //혹시 쿼리문 잘못 되면... 결과표($result_table)가 얻어지지 않음.
    if($result_table){
        // 데이터를 읽어오는 작업은 레코드(한 줄 row) 단위로 데이터를 읽어짐!

        // 결과표에 있는 총 레코드의 개수 확인
        $row_num=mysqli_num_rows($result_table);

        echo "<hr>";
        // 반복문을 통해.. 총 레코드의 수 만큼 한줄씩 데이터를 읽어와서 사용자에게 보여주기
        for($i=0; $i < $row_num; $i++){
            $row= mysqli_fetch_array($result_table, MYSQLI_ASSOC); //한줄 데이터를 (연관)배열로 주세요!
        
            // 한 줄에서 각 칸들의 값들을 뽑아오기
            $no = $row['no'];
            $nicname = $row['nicname'];
            $title= $row['title'];
            $msg= $row['msg'];
            $msg = nl2br($msg);
            $file_path= $row['file_path'];
            $date= $row['date'];

            echo "<h4>$no $nicname</h4>";
            echo "<h5>$title</h5>";
            echo "<p>$msg</p>";
            echo "<p>$date</p>";
            
            if($file_path){  //혹시 첨부 이미지가 있다면
                echo "<img src='$file_path' alt='첨부 이미지 없음' width='200'>";
            }
            echo "<hr>";
        }

    } else{
        echo "게시글 리스트를 불러오는 중 오류가 발생했습니다.";
    }

    //4. 연결 종료
    mysqli_close($db);

?>