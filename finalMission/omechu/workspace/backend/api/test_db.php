<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

echo json_encode([
    'success' => true,
    'message' => 'DB 연결 성공!'
], JSON_UNESCAPED_UNICODE);
?>