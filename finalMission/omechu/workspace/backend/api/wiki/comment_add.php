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
$content = trim($data['content'] ?? '');
$meal_time = trim($data['meal_time'] ?? $data['timePeriod'] ?? '');
$tags = $data['tags'] ?? [];

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($content === '') {
    echo json_encode([
        'success' => false,
        'message' => '코멘트를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_array($tags)) {
    $tags = [];
}

$tags_json = json_encode(array_values($tags), JSON_UNESCAPED_UNICODE);
$replies_json = '[]';

mysqli_begin_transaction($db);

try {
    $food_check_sql = "
        SELECT no
        FROM omechu_wiki_foods
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
    ";

    $food_check_stmt = mysqli_prepare($db, $food_check_sql);

    if (!$food_check_stmt) {
        throw new Exception('음식 확인 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($food_check_stmt, 'i', $food_no);
    mysqli_stmt_execute($food_check_stmt);

    $food_check_result = mysqli_stmt_get_result($food_check_stmt);

    if (!$food_check_result || mysqli_num_rows($food_check_result) === 0) {
        throw new Exception('음식 정보를 찾을 수 없어요.');
    }

    $insert_sql = "
        INSERT INTO omechu_wiki_comments
        (
            food_no,
            user_no,
            content,
            meal_time,
            tags_json,
            replies_json,
            status,
            created_at,
            updated_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    ";

    $insert_stmt = mysqli_prepare($db, $insert_sql);

    if (!$insert_stmt) {
        throw new Exception('코멘트 저장 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param(
        $insert_stmt,
        'iissss',
        $food_no,
        $user_no,
        $content,
        $meal_time,
        $tags_json,
        $replies_json
    );

    mysqli_stmt_execute($insert_stmt);

    $comment_no = mysqli_insert_id($db);

    $update_sql = "
        UPDATE omechu_wiki_foods
        SET comment_count = comment_count + 1,
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

    $user_sql = "
        SELECT nickname, login_id
        FROM omechu_users
        WHERE no = ?
        LIMIT 1
    ";

    $user_stmt = mysqli_prepare($db, $user_sql);
    mysqli_stmt_bind_param($user_stmt, 'i', $user_no);
    mysqli_stmt_execute($user_stmt);
    $user_result = mysqli_stmt_get_result($user_stmt);
    $user = mysqli_fetch_assoc($user_result);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '코멘트가 등록됐어요.',
        'comment' => [
            'id' => $comment_no,
            'foodId' => $food_no,
            'userNo' => $user_no,
            'userId' => $user['login_id'] ?? '',
            'user' => $user['nickname'] ?? '익명',
            'text' => $content,
            'mealTime' => $meal_time,
            'timePeriod' => $meal_time,
            'tags' => $tags,
            'replies' => [],
            'date' => date('Y-m-d H:i:s'),
            'isMine' => true
        ]
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