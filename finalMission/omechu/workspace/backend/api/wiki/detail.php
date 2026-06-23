<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$user_no = isset($_SESSION['user_no']) ? intval($_SESSION['user_no']) : 0;
$food_no = intval($_GET['id'] ?? $_GET['food_no'] ?? 0);

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
    조회수 증가
*/
$view_sql = "
    UPDATE omechu_wiki_foods
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE no = ?
    AND status = 'active'
    LIMIT 1
";

$view_stmt = mysqli_prepare($db, $view_sql);

if ($view_stmt) {
    mysqli_stmt_bind_param($view_stmt, 'i', $food_no);
    mysqli_stmt_execute($view_stmt);
}

/*
    상세 조회
*/
$sql = "
    SELECT
        no,
        name,
        normalized_name,
        category,
        image_url,
        description,
        summary,
        tags_json,
        situations_json,
        times_json,
        likes_json,
        like_count,
        comment_count,
        view_count,
        photo_count,
        created_by,
        status,
        created_at,
        updated_at
    FROM omechu_wiki_foods
    WHERE no = ?
    AND status = 'active'
    LIMIT 1
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '상세 정보 조회 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param($stmt, 'i', $food_no);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보를 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$row = mysqli_fetch_assoc($result);

$tags = json_decode($row['tags_json'] ?? '[]', true);
$situations = json_decode($row['situations_json'] ?? '[]', true);
$times = json_decode($row['times_json'] ?? '[]', true);
$likes_json = json_decode($row['likes_json'] ?? '{}', true);

if (!is_array($tags)) $tags = [];
if (!is_array($situations)) $situations = [];
if (!is_array($times)) $times = [];
if (!is_array($likes_json)) $likes_json = [];

$my_like_count = 0;

if ($user_no > 0 && isset($likes_json[strval($user_no)])) {
    $my_like_count = intval($likes_json[strval($user_no)]);
}

$food = [
    'id' => intval($row['no']),
    'name' => $row['name'],
    'category' => $row['category'],
    'image' => $row['image_url'] ?: '',
    'description' => $row['description'] ?: '',
    'summary' => $row['summary'] ?: '',
    'tags' => $tags,
    'situations' => $situations,
    'times' => $times,
    'likes' => intval($row['like_count']),
    'comments' => intval($row['comment_count']),
    'hits' => intval($row['view_count']),
    'photos' => intval($row['photo_count']),
    'createdBy' => intval($row['created_by']),
    'createdAt' => $row['created_at'],
    'myLikeCount' => $my_like_count,
    'isMine' => $user_no > 0 && intval($row['created_by']) === $user_no
];

echo json_encode([
    'success' => true,
    'food' => $food
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>