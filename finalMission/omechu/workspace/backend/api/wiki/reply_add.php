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
        'message' => '의견 내용을 입력해주세요.'
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

    $user_sql = "
        SELECT nickname, login_id
        FROM omechu_users
        WHERE no = ?
        LIMIT 1
    ";

    $user_stmt = mysqli_prepare($db, $user_sql);

    if (!$user_stmt) {
        throw new Exception('사용자 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($user_stmt, 'i', $user_no);
    mysqli_stmt_execute($user_stmt);

    $user_result = mysqli_stmt_get_result($user_stmt);
    $user = mysqli_fetch_assoc($user_result);

    $reply_id = 'reply_' . time() . '_' . mt_rand(1000, 9999);
    $created_at = date('Y-m-d H:i:s');

    $new_reply = [
        'id' => $reply_id,
        'userNo' => $user_no,
        'userId' => $user['login_id'] ?? '',
        'user' => $user['nickname'] ?? '익명',
        'text' => $content,
        'date' => $created_at,
        'createdAt' => $created_at,
        'updatedAt' => $created_at
    ];

    array_unshift($replies, $new_reply);

    $next_replies_json = json_encode($replies, JSON_UNESCAPED_UNICODE);

    $update_sql = "
        UPDATE omechu_wiki_comments
        SET replies_json = ?,
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_stmt = mysqli_prepare($db, $update_sql);

    if (!$update_stmt) {
        throw new Exception('의견 저장 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($update_stmt, 'si', $next_replies_json, $comment_no);
    mysqli_stmt_execute($update_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '의견이 등록됐어요.',
        'comment_id' => $comment_no,
        'reply' => $new_reply
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