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
$reply_id = trim($data['reply_id'] ?? '');

if ($comment_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '코멘트 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($reply_id === '') {
    echo json_encode([
        'success' => false,
        'message' => '의견 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_begin_transaction($db);

try {
    $select_sql = "
        SELECT no, replies_json
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

    $row = mysqli_fetch_assoc($select_result);

    $replies = json_decode($row['replies_json'] ?? '[]', true);

    if (!is_array($replies)) {
        $replies = [];
    }

    $found = false;

    foreach ($replies as $reply) {
        if (($reply['id'] ?? '') !== $reply_id) {
            continue;
        }

        if (!$is_admin && intval($reply['userNo'] ?? 0) !== $user_no) {
            throw new Exception('삭제 권한이 없어요.');
        }

        $found = true;
        break;
    }

    if (!$found) {
        throw new Exception('삭제할 의견을 찾을 수 없어요.');
    }

    $next_replies = array_values(array_filter($replies, function($reply) use ($reply_id) {
        return ($reply['id'] ?? '') !== $reply_id;
    }));

    $next_replies_json = json_encode($next_replies, JSON_UNESCAPED_UNICODE);

    $update_sql = "
        UPDATE omechu_wiki_comments
        SET replies_json = ?,
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_stmt = mysqli_prepare($db, $update_sql);

    if (!$update_stmt) {
        throw new Exception('의견 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($update_stmt, 'si', $next_replies_json, $comment_no);
    mysqli_stmt_execute($update_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '의견이 삭제됐어요.',
        'comment_id' => $comment_no,
        'reply_id' => $reply_id
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