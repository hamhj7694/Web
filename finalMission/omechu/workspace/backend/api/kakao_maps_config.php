<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$key = getenv('KAKAO_MAPS_JS_KEY');
if (!$key) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Map SDK is not configured.']);
    exit;
}
// Kakao JavaScript app keys are browser-visible by design: restrict allowed domains.
echo json_encode(['success' => true, 'appKey' => $key]);
?>
