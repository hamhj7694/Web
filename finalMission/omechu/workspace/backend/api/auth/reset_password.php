<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$login_id = trim($data['login_id'] ?? '');
$email = trim($data['email'] ?? '');
$new_password = trim($data['new_password'] ?? '');

if ($login_id === '' || $email === '' || $new_password === '') {
    echo json_encode([
        'success' => false,
        'message' => '필수 정보를 모두 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (mb_strlen($new_password) < 4) {
    echo json_encode([
        'success' => false,
        'message' => '새 비밀번호는 4자 이상 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "SELECT no FROM omechu_users 
        WHERE login_id = '$login_id' 
        AND email = '$email' 
        AND status = 'active' 
        LIMIT 1";

$result = mysqli_query($db, $sql);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '일치하는 회원 정보를 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$password_hash = password_hash($new_password, PASSWORD_DEFAULT);

$updateSql = "UPDATE omechu_users 
              SET password_hash = '$password_hash' 
              WHERE login_id = '$login_id' 
              AND email = '$email' 
              LIMIT 1";

$updateResult = mysqli_query($db, $updateSql);

if (!$updateResult) {
    echo json_encode([
        'success' => false,
        'message' => '비밀번호 변경 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => '비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요.'
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>