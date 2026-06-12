<?php
    header('Content-Type:application/json; charset=utf-8');

    //영화진흥위원회 OPEN API를 대신 요청하여 오늘의 박스오피스 정보를 사용자에게 응답
    
    //php 언어에서 다른 서버에 데이터 요청하는 문법 : curl [client url]

    // curl 라이브러리 시작!
    $ch= curl_init();

    // curl로 수행할 작업을 옵션으로 설정
    $url= 'https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=494179480f84ebba867a5d0a4246c609&targetDt=20260611';  
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //요청결과를 받겠다고 설정

    //설정되었으니.. curl 작업 실행!
    $result= curl_exec($ch); //응답 받은 결과를 리턴해 줌.


    // 결과가 있는지 확인 한 후 사용자에게 응답
    if($result){
        echo $result;
    }else{
        echo "실패!" . curl_error($ch);
    }
?>