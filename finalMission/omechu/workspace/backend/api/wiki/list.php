<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$user_no = isset($_SESSION['user_no']) ? intval($_SESSION['user_no']) : 0;

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
    WHERE status = 'active'
    ORDER BY no DESC
";

$result = mysqli_query($db, $sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => '푸드 위키 목록 조회 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$foods = [];

while ($row = mysqli_fetch_assoc($result)) {
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

    $foods[] = [
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
        'myLikeCount' => $my_like_count
    ];
}

echo json_encode([
    'success' => true,
    'foods' => $foods
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>