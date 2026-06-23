<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$login_id = $_GET['login_id'] ?? '';
$login_id = trim($login_id);

if ($login_id === '') {
    echo json_encode([
        'success' => false,
        'message' => '아이디를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9]{4,}$/', $login_id)) {
    echo json_encode([
        'success' => false,
        'message' => '아이디는 영문 또는 숫자 조합 4자 이상으로 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "SELECT no FROM omechu_users WHERE login_id = '$login_id' LIMIT 1";
$result = mysqli_query($db, $sql);

if ($result && mysqli_num_rows($result) > 0) {
    echo json_encode([
        'success' => true,
        'is_duplicated' => true,
        'message' => '이미 사용 중인 아이디예요!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'is_duplicated' => false,
    'message' => '사용 가능한 아이디예요!'
], JSON_UNESCAPED_UNICODE);
?>