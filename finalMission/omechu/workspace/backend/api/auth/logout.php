<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

session_unset();
session_destroy();

echo json_encode([
    'success' => true,
    'message' => '로그아웃되었습니다.'
], JSON_UNESCAPED_UNICODE);
?>