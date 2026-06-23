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

$photo_no = intval($data['photo_id'] ?? $data['photo_no'] ?? 0);

if ($photo_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '사진 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_begin_transaction($db);

try {
    $select_sql = "
        SELECT no, food_no, user_no, image_url
        FROM omechu_wiki_food_photos
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ";

    $select_stmt = mysqli_prepare($db, $select_sql);

    if (!$select_stmt) {
        throw new Exception('사진 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($select_stmt, 'i', $photo_no);
    mysqli_stmt_execute($select_stmt);

    $select_result = mysqli_stmt_get_result($select_stmt);

    if (!$select_result || mysqli_num_rows($select_result) === 0) {
        throw new Exception('사진을 찾을 수 없어요.');
    }

    $photo = mysqli_fetch_assoc($select_result);

    if (!$is_admin && intval($photo['user_no']) !== $user_no) {
        throw new Exception('삭제 권한이 없어요.');
    }

    $food_no = intval($photo['food_no']);

    $delete_sql = "
        UPDATE omechu_wiki_food_photos
        SET status = 'deleted',
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $delete_stmt = mysqli_prepare($db, $delete_sql);

    if (!$delete_stmt) {
        throw new Exception('사진 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($delete_stmt, 'i', $photo_no);
    mysqli_stmt_execute($delete_stmt);

    $latest_sql = "
        SELECT image_url
        FROM omechu_wiki_food_photos
        WHERE food_no = ?
        AND status = 'active'
        ORDER BY no DESC
        LIMIT 1
    ";

    $latest_stmt = mysqli_prepare($db, $latest_sql);

    if (!$latest_stmt) {
        throw new Exception('최신 사진 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($latest_stmt, 'i', $food_no);
    mysqli_stmt_execute($latest_stmt);

    $latest_result = mysqli_stmt_get_result($latest_stmt);
    $latest_photo = $latest_result ? mysqli_fetch_assoc($latest_result) : null;

    $next_thumbnail = $latest_photo && !empty($latest_photo['image_url'])
        ? $latest_photo['image_url']
        : '';

    $update_food_sql = "
        UPDATE omechu_wiki_foods
        SET image_url = ?,
            photo_count = GREATEST(photo_count - 1, 0),
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_food_stmt = mysqli_prepare($db, $update_food_sql);

    if (!$update_food_stmt) {
        throw new Exception('음식 썸네일 갱신 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($update_food_stmt, 'si', $next_thumbnail, $food_no);
    mysqli_stmt_execute($update_food_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '사진이 삭제됐어요.',
        'photo_id' => $photo_no,
        'food_id' => $food_no,
        'thumbnail' => $next_thumbnail
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