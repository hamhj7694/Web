<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');

if ($email === '') {
    echo json_encode([
        'success' => false,
        'message' => '이메일을 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "SELECT login_id FROM omechu_users WHERE email = '$email' AND status = 'active' LIMIT 1";
$result = mysqli_query($db, $sql);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '일치하는 회원 정보를 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = mysqli_fetch_assoc($result);

echo json_encode([
    'success' => true,
    'login_id' => $user['login_id']
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>