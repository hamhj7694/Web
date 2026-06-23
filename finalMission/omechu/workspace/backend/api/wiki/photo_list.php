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
        p.no,
        p.food_no,
        p.user_no,
        p.image_url,
        p.original_filename,
        p.created_at,
        u.nickname,
        u.login_id
    FROM omechu_wiki_food_photos p
    LEFT JOIN omechu_users u
        ON p.user_no = u.no
    WHERE p.food_no = ?
    AND p.status = 'active'
    ORDER BY p.no DESC
";

$stmt = mysqli_prepare($db, $sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => '사진 목록 조회 준비 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_stmt_bind_param($stmt, 'i', $food_no);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

$login_user_no = isset($_SESSION['user_no']) ? intval($_SESSION['user_no']) : 0;
$photos = [];

while ($row = mysqli_fetch_assoc($result)) {
    $photos[] = [
        'id' => intval($row['no']),
        'foodId' => intval($row['food_no']),
        'userNo' => intval($row['user_no']),
        'userId' => $row['login_id'] ?: '',
        'user' => $row['nickname'] ?: '익명',
        'image' => $row['image_url'],
        'src' => $row['image_url'],
        'originalFilename' => $row['original_filename'] ?: '',
        'date' => $row['created_at'],
        'createdAt' => $row['created_at'],
        'isMine' => $login_user_no > 0 && $login_user_no === intval($row['user_no'])
    ];
}

echo json_encode([
    'success' => true,
    'photos' => $photos
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>