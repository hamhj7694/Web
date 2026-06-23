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
$nickname = trim($data['nickname'] ?? '');
$current_password = trim($data['current_password'] ?? '');
$new_password = trim($data['new_password'] ?? '');

if ($nickname === '') {
    echo json_encode([
        'success' => false,
        'message' => '닉네임을 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($current_password === '') {
    echo json_encode([
        'success' => false,
        'message' => '현재 비밀번호를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($new_password !== '' && mb_strlen($new_password) < 4) {
    echo json_encode([
        'success' => false,
        'message' => '새 비밀번호는 4자 이상 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_no_safe = mysqli_real_escape_string($db, $user_no);
$nickname_safe = mysqli_real_escape_string($db, $nickname);

$sql = "SELECT no, password_hash, nickname 
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

if (!password_verify($current_password, $user['password_hash'])) {
    echo json_encode([
        'success' => false,
        'message' => '현재 비밀번호가 일치하지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$checkSql = "SELECT no 
             FROM omechu_users 
             WHERE nickname = '$nickname_safe' 
             AND no != '$user_no_safe' 
             AND status = 'active' 
             LIMIT 1";

$checkResult = mysqli_query($db, $checkSql);

if ($checkResult && mysqli_num_rows($checkResult) > 0) {
    echo json_encode([
        'success' => false,
        'message' => '이미 사용 중인 닉네임이에요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($new_password !== '') {
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    $new_password_hash_safe = mysqli_real_escape_string($db, $new_password_hash);

    $updateSql = "UPDATE omechu_users 
                  SET nickname = '$nickname_safe',
                      password_hash = '$new_password_hash_safe'
                  WHERE no = '$user_no_safe'
                  LIMIT 1";
} else {
    $updateSql = "UPDATE omechu_users 
                  SET nickname = '$nickname_safe'
                  WHERE no = '$user_no_safe'
                  LIMIT 1";
}

$updateResult = mysqli_query($db, $updateSql);

if (!$updateResult) {
    echo json_encode([
        'success' => false,
        'message' => '계정 정보 변경 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$_SESSION['nickname'] = $nickname;

echo json_encode([
    'success' => true,
    'message' => '계정 정보가 변경됐어요.',
    'user' => [
        'no' => $user_no,
        'login_id' => $_SESSION['login_id'],
        'nickname' => $nickname
    ]
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>