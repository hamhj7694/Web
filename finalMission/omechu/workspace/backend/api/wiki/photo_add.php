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

$user_no = intval($_SESSION['user_no']);
$food_no = intval($_POST['food_id'] ?? $_POST['food_no'] ?? 0);

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_FILES['image'])) {
    echo json_encode([
        'success' => false,
        'message' => '업로드할 이미지가 없어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => '이미지 업로드 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$max_size = 5 * 1024 * 1024;

if ($file['size'] > $max_size) {
    echo json_encode([
        'success' => false,
        'message' => '이미지는 5MB 이하만 업로드할 수 있어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$allowed_mime_types = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_type = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($allowed_mime_types[$mime_type])) {
    echo json_encode([
        'success' => false,
        'message' => 'jpg, png, webp, gif 이미지만 업로드할 수 있어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$extension = $allowed_mime_types[$mime_type];

$upload_dir = __DIR__ . '/../../../uploaded/wiki';

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$file_name = 'food_' . $food_no . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$save_path = $upload_dir . '/' . $file_name;
$image_url = '../uploaded/wiki/' . $file_name;

if (!move_uploaded_file($file['tmp_name'], $save_path)) {
    echo json_encode([
        'success' => false,
        'message' => '이미지 파일 저장에 실패했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$original_filename = $file['name'];

mysqli_begin_transaction($db);

try {
    $food_check_sql = "
        SELECT no
        FROM omechu_wiki_foods
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
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
        INSERT INTO omechu_wiki_food_photos
        (
            food_no,
            user_no,
            image_url,
            original_filename,
            status,
            created_at,
            updated_at
        )
        VALUES
        (?, ?, ?, ?, 'active', NOW(), NOW())
    ";

    $insert_stmt = mysqli_prepare($db, $insert_sql);

    if (!$insert_stmt) {
        throw new Exception('사진 저장 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param(
        $insert_stmt,
        'iiss',
        $food_no,
        $user_no,
        $image_url,
        $original_filename
    );

    mysqli_stmt_execute($insert_stmt);

    $photo_no = mysqli_insert_id($db);

    $update_food_sql = "
        UPDATE omechu_wiki_foods
        SET image_url = ?,
            photo_count = photo_count + 1,
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $update_food_stmt = mysqli_prepare($db, $update_food_sql);

    if (!$update_food_stmt) {
        throw new Exception('음식 썸네일 갱신 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($update_food_stmt, 'si', $image_url, $food_no);
    mysqli_stmt_execute($update_food_stmt);

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
        'message' => '사진이 등록됐어요.',
        'photo' => [
            'id' => $photo_no,
            'foodId' => $food_no,
            'userNo' => $user_no,
            'userId' => $user['login_id'] ?? '',
            'user' => $user['nickname'] ?? '익명',
            'image' => $image_url,
            'src' => $image_url,
            'originalFilename' => $original_filename,
            'date' => date('Y-m-d H:i:s'),
            'isMine' => true
        ],
        'thumbnail' => $image_url
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    mysqli_rollback($db);

    if (file_exists($save_path)) {
        unlink($save_path);
    }

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($db);
?>