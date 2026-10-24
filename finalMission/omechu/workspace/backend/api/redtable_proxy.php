<?php
header('Content-Type: application/json; charset=utf-8');
$key = getenv('REDTABLE_SERVICE_KEY');
if (!$key) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'API configuration required.']);
    exit;
}
$pageNo = filter_input(INPUT_GET, 'pageNo', FILTER_VALIDATE_INT);
$pageNo = $pageNo && $pageNo > 0 ? min($pageNo, 100) : 1;
$url = 'https://seoul.openapi.redtable.global/api/menu/korean?' . http_build_query(['serviceKey' => $key, 'pageNo' => $pageNo]);
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 20
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($response === false) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'message' => 'Upstream API unavailable.']);
    exit;
}
http_response_code($status >= 100 && $status <= 599 ? $status : 502);
echo $response;
?>