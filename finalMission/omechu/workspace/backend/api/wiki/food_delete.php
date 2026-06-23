<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

if (!isset($db) && isset($conn)) {
    $db = $conn;
}

if (!isset($db)) {
    echo json_encode([
        'success' => false,
        'message' => 'DB 연결을 찾을 수 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

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

$user_no = intval($_SESSION['user_no']);
$is_admin = isAdminUser($db, $user_no);

if (!$is_admin) {
    echo json_encode([
        'success' => false,
        'message' => '관리자만 삭제할 수 있어요.'
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
        SELECT no, name
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
        throw new Exception('삭제할 음식을 찾을 수 없어요.');
    }

    $food = mysqli_fetch_assoc($select_result);

    $delete_food_sql = "
        UPDATE omechu_wiki_foods
        SET status = 'deleted',
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $delete_food_stmt = mysqli_prepare($db, $delete_food_sql);

    if (!$delete_food_stmt) {
        throw new Exception('음식 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($delete_food_stmt, 'i', $food_no);
    mysqli_stmt_execute($delete_food_stmt);

    $delete_comments_sql = "
        UPDATE omechu_wiki_comments
        SET status = 'deleted',
            updated_at = NOW()
        WHERE food_no = ?
        AND status = 'active'
    ";

    $delete_comments_stmt = mysqli_prepare($db, $delete_comments_sql);

    if (!$delete_comments_stmt) {
        throw new Exception('관련 코멘트 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($delete_comments_stmt, 'i', $food_no);
    mysqli_stmt_execute($delete_comments_stmt);

    $delete_photos_sql = "
        UPDATE omechu_wiki_food_photos
        SET status = 'deleted',
            updated_at = NOW()
        WHERE food_no = ?
        AND status = 'active'
    ";

    $delete_photos_stmt = mysqli_prepare($db, $delete_photos_sql);

    if (!$delete_photos_stmt) {
        throw new Exception('관련 사진 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($delete_photos_stmt, 'i', $food_no);
    mysqli_stmt_execute($delete_photos_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '음식 위키가 삭제됐어요.',
        'food_id' => $food_no,
        'food_name' => $food['name']
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