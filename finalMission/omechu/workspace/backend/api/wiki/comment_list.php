<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$food_no = intval($_GET['food_id'] ?? $_GET['food_no'] ?? 0);

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "
    SELECT
        c.no,
        c.food_no,
        c.user_no,
        c.content,
        c.meal_time,
        c.tags_json,
        c.replies_json,
        c.created_at,
        c.updated_at,
        u.nickname,
        u.login_id
    FROM omechu_wiki_comments c
    LEFT JOIN omechu_users u
        ON c.user_no = u.no
    WHERE c.food_no = ?
    AND c.status = 'active'
    ORDER BY c.no DESC
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '코멘트 목록 조회 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param($stmt, 'i', $food_no);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

$login_user_no = isset($_SESSION['user_no']) ? intval($_SESSION['user_no']) : 0;
$comments = [];

while ($row = mysqli_fetch_assoc($result)) {
    $tags = json_decode($row['tags_json'] ?? '[]', true);
    $replies = json_decode($row['replies_json'] ?? '[]', true);

    if (!is_array($tags)) $tags = [];
    if (!is_array($replies)) $replies = [];

    $comments[] = [
        'id' => intval($row['no']),
        'foodId' => intval($row['food_no']),
        'userNo' => intval($row['user_no']),
        'userId' => $row['login_id'] ?: '',
        'user' => $row['nickname'] ?: '익명',
        'text' => $row['content'],
        'mealTime' => $row['meal_time'] ?: '',
        'timePeriod' => $row['meal_time'] ?: '',
        'tags' => $tags,
        'replies' => $replies,
        'date' => $row['created_at'],
        'createdAt' => $row['created_at'],
        'isMine' => $login_user_no > 0 && $login_user_no === intval($row['user_no'])
    ];
}

echo json_encode([
    'success' => true,
    'comments' => $comments
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>