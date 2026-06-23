<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_no'])) {
    echo json_encode([
        'success' => true,
        'is_login' => false,
        'user' => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_role = $_SESSION['role'] ?? 'user';
$is_admin = $user_role === 'admin';

echo json_encode([
    'success' => true,
    'is_login' => true,
    'user' => [
        'no' => intval($_SESSION['user_no']),
        'login_id' => $_SESSION['login_id'] ?? '',
        'nickname' => $_SESSION['nickname'] ?? '',
        'role' => $user_role,
        'isAdmin' => $is_admin
    ]
], JSON_UNESCAPED_UNICODE);
?>