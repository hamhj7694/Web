<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

function isAdminUser($db, $user_no) {
    if ($user_no <= 0) {
        return false;
    }

    $sql = "SELECT role FROM omechu_users WHERE no = ? LIMIT 1";
    $stmt = mysqli_prepare($db, $sql);

    if (!$stmt) {
        return false;
    }

    mysqli_stmt_bind_param($stmt, 'i', $user_no);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);

    return isset($user['role']) && $user['role'] === 'admin';
}

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
$is_admin = isAdminUser($db, $user_no);
$comment_no = intval($data['comment_id'] ?? $data['comment_no'] ?? 0);

if ($comment_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '코멘트 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_begin_transaction($db);

try {
    $select_sql = "
        SELECT no, food_no, user_no
        FROM omechu_wiki_comments
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ";

    $select_stmt = mysqli_prepare($db, $select_sql);

    if (!$select_stmt) {
        throw new Exception('코멘트 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($select_stmt, 'i', $comment_no);
    mysqli_stmt_execute($select_stmt);

    $select_result = mysqli_stmt_get_result($select_stmt);

    if (!$select_result || mysqli_num_rows($select_result) === 0) {
        throw new Exception('코멘트를 찾을 수 없어요.');
    }

    $comment = mysqli_fetch_assoc($select_result);

    if (!$is_admin && intval($comment['user_no']) !== $user_no) {
        throw new Exception('삭제 권한이 없어요.');
    }

    $food_no = intval($comment['food_no']);

    $delete_sql = "
        UPDATE omechu_wiki_comments
        SET status = 'deleted',
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $delete_stmt = mysqli_prepare($db, $delete_sql);

    if (!$delete_stmt) {
        throw new Exception('코멘트 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($delete_stmt, 'i', $comment_no);
    mysqli_stmt_execute($delete_stmt);

    $update_sql = "
        UPDATE omechu_wiki_foods
        SET comment_count = GREATEST(comment_count - 1, 0),
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_stmt = mysqli_prepare($db, $update_sql);

    if (!$update_stmt) {
        throw new Exception('댓글 수 갱신 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($update_stmt, 'i', $food_no);
    mysqli_stmt_execute($update_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '코멘트가 삭제됐어요.',
        'comment_id' => $comment_no,
        'food_id' => $food_no
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    mysqli_rollback($db);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($db);
?>