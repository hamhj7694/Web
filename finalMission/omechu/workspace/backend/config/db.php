<?php
// backend/config/db.php

$db = mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');

if (!$db) {
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => false,
        'message' => 'DB 연결 실패'
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

mysqli_set_charset($db, 'utf8mb4');
?>