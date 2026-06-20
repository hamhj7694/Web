<!-- RedTable API 인증키 -->
<!-- vyw8BQae8o1A7Bhovayi7ylF0zga1kppXOy5Erhz7e3zpfiIQSFJDyrNURwjw8y9 -->

<!-- RedTable API 주소 -->
<!-- https://www.data.go.kr/data/15097605/openapi.do?utm_source=chatgpt.com -->

<?php
header('Content-Type: application/json; charset=utf-8');

$SERVICE_KEY = 'vyw8BQae8o1A7Bhovayi7ylF0zga1kppXOy5Erhz7e3zpfiIQSFJDyrNURwjw8y9';

$pageNo = $_GET['pageNo'] ?? '1';

// 일단 메뉴정보 한국어만 테스트
$apiUrl = 'https://seoul.openapi.redtable.global/api/menu/korean';

$url = $apiUrl . '?' . http_build_query([
    'serviceKey' => $SERVICE_KEY,
    'pageNo' => $pageNo
]);

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'RedTable API 요청 실패',
        'error' => $error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code($httpCode);
echo $response;