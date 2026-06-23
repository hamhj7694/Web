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
$food_no = intval($data['food_id'] ?? $data['food_no'] ?? 0);

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_begin_transaction($db);

try {
    $select_sql = "
        SELECT no, likes_json, like_count
        FROM omechu_wiki_foods
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ";

    $select_stmt = mysqli_prepare($db, $select_sql);

    if (!$select_stmt) {
        throw new Exception('음식 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($select_stmt, 'i', $food_no);
    mysqli_stmt_execute($select_stmt);

    $select_result = mysqli_stmt_get_result($select_stmt);

    if (!$select_result || mysqli_num_rows($select_result) === 0) {
        throw new Exception('음식 정보를 찾을 수 없어요.');
    }

    $row = mysqli_fetch_assoc($select_result);

    $likes_json = json_decode($row['likes_json'] ?? '{}', true);

    if (!is_array($likes_json)) {
        $likes_json = [];
    }

    $user_key = strval($user_no);
    $my_like_count = intval($likes_json[$user_key] ?? 0);

    if ($my_like_count <= 0) {
        throw new Exception('삭제할 추천 기록이 없어요.');
    }

    unset($likes_json[$user_key]);

    $current_total_like_count = intval($row['like_count']);
    $next_total_like_count = max(0, $current_total_like_count - $my_like_count);

    $next_likes_json = json_encode($likes_json, JSON_UNESCAPED_UNICODE);

    $update_sql = "
        UPDATE omechu_wiki_foods
        SET likes_json = ?,
            like_count = ?,
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_stmt = mysqli_prepare($db, $update_sql);

    if (!$update_stmt) {
        throw new Exception('추천 기록 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param(
        $update_stmt,
        'sii',
        $next_likes_json,
        $next_total_like_count,
        $food_no
    );

    mysqli_stmt_execute($update_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '내 추천 기록이 삭제됐어요.',
        'food_id' => $food_no,
        'food_no' => $food_no,
        'deleted_like_count' => $my_like_count,
        'like_count' => $next_total_like_count,
        'my_like_count' => 0
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