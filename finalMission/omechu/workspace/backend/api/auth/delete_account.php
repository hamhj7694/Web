<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

if (!isset($_SESSION['user_no'])) {
    echo json_encode([
        'success' => false,
        'message' => '로그인이 필요합니다.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$user_no = intval($_SESSION['user_no']);
$password = trim($data['password'] ?? '');

if ($password === '') {
    echo json_encode([
        'success' => false,
        'message' => '현재 비밀번호를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_no_safe = mysqli_real_escape_string($db, $user_no);

$sql = "SELECT no, password_hash 
        FROM omechu_users 
        WHERE no = '$user_no_safe' 
        AND status = 'active' 
        LIMIT 1";

$result = mysqli_query($db, $sql);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '회원 정보를 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = mysqli_fetch_assoc($result);

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode([
        'success' => false,
        'message' => '비밀번호가 일치하지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$updateSql = "UPDATE omechu_users 
              SET status = 'deleted' 
              WHERE no = '$user_no_safe'
              LIMIT 1";

$updateResult = mysqli_query($db, $updateSql);

if (!$updateResult) {
    echo json_encode([
        'success' => false,
        'message' => '계정 탈퇴 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

session_unset();
session_destroy();

echo json_encode([
    'success' => true,
    'message' => '계정 탈퇴가 완료됐어요.'
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>