<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

$category = trim($_GET['category'] ?? '');
$situation = trim($_GET['situation'] ?? '');
$time = trim($_GET['time'] ?? '');

$where_sql = "status = 'active'";
$param_types = "";
$params = [];

if ($category !== '' && $category !== '전체') {
    $where_sql .= " AND category = ?";
    $param_types .= "s";
    $params[] = $category;
}

if ($situation !== '') {
    $where_sql .= " AND situations_json LIKE ?";
    $param_types .= "s";
    $params[] = '%"' . $situation . '"%';
}

if ($time !== '') {
    $where_sql .= " AND times_json LIKE ?";
    $param_types .= "s";
    $params[] = '%"' . $time . '"%';
}

$sql = "
    SELECT
        no,
        name,
        category,
        image_url,
        description,
        summary,
        tags_json,
        situations_json,
        times_json,
        like_count,
        comment_count,
        view_count,
        photo_count,
        created_by,
        created_at
    FROM omechu_wiki_foods
    WHERE $where_sql
    ORDER BY RAND()
    LIMIT 1
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '오메추 추천 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (count($params) > 0) {
    mysqli_stmt_bind_param($stmt, $param_types, ...$params);
}

mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode([
        'success' => false,
        'message' => '조건에 맞는 음식이 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$row = mysqli_fetch_assoc($result);

$tags = json_decode($row['tags_json'] ?? '[]', true);
$situations = json_decode($row['situations_json'] ?? '[]', true);
$times = json_decode($row['times_json'] ?? '[]', true);

if (!is_array($tags)) $tags = [];
if (!is_array($situations)) $situations = [];
if (!is_array($times)) $times = [];

$food = [
    'id' => intval($row['no']),
    'name' => $row['name'],
    'category' => $row['category'],
    'image' => $row['image_url'] ?: './assets/food/default.png',
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
    'createdAt' => $row['created_at']
];

echo json_encode([
    'success' => true,
    'food' => $food
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>