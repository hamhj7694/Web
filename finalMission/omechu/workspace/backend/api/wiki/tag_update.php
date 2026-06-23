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

$food_no = intval($data['food_id'] ?? $data['food_no'] ?? 0);
$tags = $data['tags'] ?? [];
$times = $data['times'] ?? [];
$situations = $data['situations'] ?? [];

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_array($tags)) $tags = [];
if (!is_array($times)) $times = [];
if (!is_array($situations)) $situations = [];

function clean_tag_list($list) {
    $result = [];

    foreach ($list as $item) {
        $value = trim(strval($item));

        if ($value === '') {
            continue;
        }

        if (!in_array($value, $result, true)) {
            $result[] = $value;
        }
    }

    return $result;
}

$tags = clean_tag_list($tags);
$times = clean_tag_list($times);
$situations = clean_tag_list($situations);

$tags_json = json_encode($tags, JSON_UNESCAPED_UNICODE);
$times_json = json_encode($times, JSON_UNESCAPED_UNICODE);
$situations_json = json_encode($situations, JSON_UNESCAPED_UNICODE);

$sql = "
    UPDATE omechu_wiki_foods
    SET tags_json = ?,
        times_json = ?,
        situations_json = ?,
        updated_at = NOW()
    WHERE no = ?
    AND status = 'active'
    LIMIT 1
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '태그 저장 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    'sssi',
    $tags_json,
    $times_json,
    $situations_json,
    $food_no
);

mysqli_stmt_execute($stmt);

if (mysqli_stmt_affected_rows($stmt) < 0) {
    echo json_encode([
        'success' => false,
        'message' => '태그 저장에 실패했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => '태그가 저장됐어요.',
    'food_id' => $food_no,
    'tags' => $tags,
    'times' => $times,
    'situations' => $situations
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>