<?php
    header('Content-Type:application/json; charset=utf-8');

    // MySQL DBMS와 연결하여 데이터들 가져오기
    $db= mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');
    mysqli_query($db, 'set names utf8');

    // wdb_board 테이블의 모든 데이터들을 번호 기준 내림차순으로 불러오기
    $sql= "SELECT * FROM web_board ORDER BY no DESC";
    $result= mysqli_query($db, $sql);

    // 요청 결과표($result)로 부터 데이터들을 한줄씩 가져와서 $board_list 라는 이름에 저장
    $board_list= []; // 빈 배열
    // 게시글 수만큼 반복해 한 줄씩 데이터 가져오기
    $row_num= mysqli_num_rows($result);
    for($i=0; $i<$row_num; $i++){
        $row=mysqli_fetch_array($result, MYSQLI_ASSOC); //연관 배열로 한줄 뽑기
        $board_list[$i]= $row;
    }

    // MySQL과 연결 종료
    mysqli_close($db);

    // $board_list의 요소 개수
    $board_size= count($board_list);

    // 사용자에게 응답한 데이터들을 연관배열로 준비
    $response= [];
    $response['status']= 200; //응답 성공 코드
    $response['total']= $board_size; //총 게시글 수
    $response['data']= $board_list; //실제 게시글 데이터 배열

    // 위 연관배열을 json 형식으로 변환하기
    echo json_encode($response);

?>