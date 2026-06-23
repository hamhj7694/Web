<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

if (!isset($db) && isset($conn)) {
    $db = $conn;
}

if (!isset($db)) {
    echo json_encode([
        'success' => false,
        'message' => 'DB 연결을 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$login_id = trim($data['login_id'] ?? '');
$password = trim($data['password'] ?? '');

if ($login_id === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => '아이디와 비밀번호를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "
    SELECT
        no,
        login_id,
        email,
        password_hash,
        nickname,
        status,
        role
    FROM omechu_users
    WHERE login_id = ?
    AND status = 'active'
    LIMIT 1
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '로그인 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param($stmt, 's', $login_id);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '아이디 또는 비밀번호가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = mysqli_fetch_assoc($result);

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode([
        'success' => false,
        'message' => '아이디 또는 비밀번호가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_role = $user['role'] ?? 'user';
$is_admin = $user_role === 'admin';

// 세션 저장
$_SESSION['user_no'] = intval($user['no']);
$_SESSION['login_id'] = $user['login_id'];
$_SESSION['nickname'] = $user['nickname'];
$_SESSION['role'] = $user_role;
$_SESSION['is_admin'] = $is_admin;

echo json_encode([
    'success' => true,
    'message' => '로그인 성공!',
    'user' => [
        'no' => intval($user['no']),
        'login_id' => $user['login_id'],
        'nickname' => $user['nickname'],
        'email' => $user['email'],
        'role' => $user_role,
        'isAdmin' => $is_admin
    ]
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>