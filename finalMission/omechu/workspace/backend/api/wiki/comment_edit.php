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

if (!is_array($data)) {
    echo json_encode([
        'success' => false,
        'message' => '요청 데이터가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_no = intval($_SESSION['user_no']);
$comment_no = intval($data['comment_id'] ?? $data['comment_no'] ?? 0);
$content = trim($data['content'] ?? '');

if ($comment_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '코멘트 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($content === '') {
    echo json_encode([
        'success' => false,
        'message' => '수정할 내용을 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "
    UPDATE omechu_wiki_comments
    SET content = ?,
        updated_at = NOW()
    WHERE no = ?
    AND user_no = ?
    AND status = 'active'
    LIMIT 1
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '코멘트 수정 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param($stmt, 'sii', $content, $comment_no, $user_no);
mysqli_stmt_execute($stmt);

if (mysqli_stmt_affected_rows($stmt) <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '수정할 코멘트를 찾을 수 없거나 권한이 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => '코멘트가 수정됐어요.',
    'comment_id' => $comment_no,
    'content' => $content
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>