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

if ($food_no <= 0) {
    echo json_encode([
        'success' => false,
        'message' => '음식 정보가 올바르지 않아요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_begin_transaction($db);

try {
    /*
        1. 음식 존재 확인
    */
    $food_sql = "
        SELECT no
        FROM omechu_wiki_foods
        WHERE no = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ";

    $food_stmt = mysqli_prepare($db, $food_sql);

    if (!$food_stmt) {
        throw new Exception('음식 확인 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($food_stmt, 'i', $food_no);
    mysqli_stmt_execute($food_stmt);

    $food_result = mysqli_stmt_get_result($food_stmt);

    if (!$food_result || mysqli_num_rows($food_result) === 0) {
        throw new Exception('음식 정보를 찾을 수 없어요.');
    }

    /*
        2. 내가 쓴 코멘트 삭제
        - soft delete
    */
    $comment_delete_sql = "
        UPDATE omechu_wiki_comments
        SET status = 'deleted',
            updated_at = NOW()
        WHERE food_no = ?
        AND user_no = ?
        AND status = 'active'
    ";

    $comment_delete_stmt = mysqli_prepare($db, $comment_delete_sql);

    if (!$comment_delete_stmt) {
        throw new Exception('코멘트 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($comment_delete_stmt, 'ii', $food_no, $user_no);
    mysqli_stmt_execute($comment_delete_stmt);

    $deleted_comment_count = mysqli_stmt_affected_rows($comment_delete_stmt);

    if ($deleted_comment_count < 0) {
        $deleted_comment_count = 0;
    }

    /*
        3. 다른 사람 코멘트에 달린 내 의견 삭제
        - replies_json 배열에서 내 userNo만 제거
    */
    $reply_delete_count = 0;

    $reply_select_sql = "
        SELECT no, replies_json
        FROM omechu_wiki_comments
        WHERE food_no = ?
        AND status = 'active'
        AND replies_json IS NOT NULL
        AND replies_json != ''
        FOR UPDATE
    ";

    $reply_select_stmt = mysqli_prepare($db, $reply_select_sql);

    if (!$reply_select_stmt) {
        throw new Exception('의견 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($reply_select_stmt, 'i', $food_no);
    mysqli_stmt_execute($reply_select_stmt);

    $reply_result = mysqli_stmt_get_result($reply_select_stmt);

    while ($row = mysqli_fetch_assoc($reply_result)) {
        $comment_no = intval($row['no']);
        $replies = json_decode($row['replies_json'], true);

        if (!is_array($replies)) {
            continue;
        }

        $next_replies = [];

        foreach ($replies as $reply) {
            $reply_user_no = 0;

            if (isset($reply['userNo'])) {
                $reply_user_no = intval($reply['userNo']);
            } elseif (isset($reply['user_no'])) {
                $reply_user_no = intval($reply['user_no']);
            }

            if ($reply_user_no === $user_no) {
                $reply_delete_count += 1;
                continue;
            }

            $next_replies[] = $reply;
        }

        if (count($next_replies) !== count($replies)) {
            $next_replies_json = json_encode($next_replies, JSON_UNESCAPED_UNICODE);

            $reply_update_sql = "
                UPDATE omechu_wiki_comments
                SET replies_json = ?,
                    updated_at = NOW()
                WHERE no = ?
                LIMIT 1
            ";

            $reply_update_stmt = mysqli_prepare($db, $reply_update_sql);

            if (!$reply_update_stmt) {
                throw new Exception('의견 삭제 준비 중 오류가 발생했어요.');
            }

            mysqli_stmt_bind_param($reply_update_stmt, 'si', $next_replies_json, $comment_no);
            mysqli_stmt_execute($reply_update_stmt);
        }
    }

    /*
        4. 내가 올린 사진 삭제
        - soft delete
    */
    $photo_delete_sql = "
        UPDATE omechu_wiki_food_photos
        SET status = 'deleted',
            updated_at = NOW()
        WHERE food_no = ?
        AND user_no = ?
        AND status = 'active'
    ";

    $photo_delete_stmt = mysqli_prepare($db, $photo_delete_sql);

    if (!$photo_delete_stmt) {
        throw new Exception('사진 삭제 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($photo_delete_stmt, 'ii', $food_no, $user_no);
    mysqli_stmt_execute($photo_delete_stmt);

    $deleted_photo_count = mysqli_stmt_affected_rows($photo_delete_stmt);

    if ($deleted_photo_count < 0) {
        $deleted_photo_count = 0;
    }

    /*
        5. 음식 comment_count 재계산
        - active 코멘트 기준
    */
    $comment_count_sql = "
        SELECT COUNT(*) AS cnt
        FROM omechu_wiki_comments
        WHERE food_no = ?
        AND status = 'active'
    ";

    $comment_count_stmt = mysqli_prepare($db, $comment_count_sql);

    if (!$comment_count_stmt) {
        throw new Exception('코멘트 수 재계산 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($comment_count_stmt, 'i', $food_no);
    mysqli_stmt_execute($comment_count_stmt);

    $comment_count_result = mysqli_stmt_get_result($comment_count_stmt);
    $comment_count_row = mysqli_fetch_assoc($comment_count_result);

    $next_comment_count = intval($comment_count_row['cnt'] ?? 0);

    /*
        6. 음식 photo_count 재계산
    */
    $photo_count_sql = "
        SELECT COUNT(*) AS cnt
        FROM omechu_wiki_food_photos
        WHERE food_no = ?
        AND status = 'active'
    ";

    $photo_count_stmt = mysqli_prepare($db, $photo_count_sql);

    if (!$photo_count_stmt) {
        throw new Exception('사진 수 재계산 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($photo_count_stmt, 'i', $food_no);
    mysqli_stmt_execute($photo_count_stmt);

    $photo_count_result = mysqli_stmt_get_result($photo_count_stmt);
    $photo_count_row = mysqli_fetch_assoc($photo_count_result);

    $next_photo_count = intval($photo_count_row['cnt'] ?? 0);

    /*
        7. 최신 active 사진을 다시 썸네일로 설정
    */
    $latest_photo_sql = "
        SELECT image_url
        FROM omechu_wiki_food_photos
        WHERE food_no = ?
        AND status = 'active'
        ORDER BY no DESC
        LIMIT 1
    ";

    $latest_photo_stmt = mysqli_prepare($db, $latest_photo_sql);

    if (!$latest_photo_stmt) {
        throw new Exception('최신 사진 조회 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($latest_photo_stmt, 'i', $food_no);
    mysqli_stmt_execute($latest_photo_stmt);

    $latest_photo_result = mysqli_stmt_get_result($latest_photo_stmt);
    $latest_photo_row = $latest_photo_result ? mysqli_fetch_assoc($latest_photo_result) : null;

    $next_thumbnail = $latest_photo_row && !empty($latest_photo_row['image_url'])
        ? $latest_photo_row['image_url']
        : '';

    /*
        8. 음식 카운트 / 썸네일 갱신
    */
    $food_update_sql = "
        UPDATE omechu_wiki_foods
        SET comment_count = ?,
            photo_count = ?,
            image_url = ?,
            updated_at = NOW()
        WHERE no = ?
        LIMIT 1
    ";

    $food_update_stmt = mysqli_prepare($db, $food_update_sql);

    if (!$food_update_stmt) {
        throw new Exception('음식 정보 갱신 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param(
        $food_update_stmt,
        'iisi',
        $next_comment_count,
        $next_photo_count,
        $next_thumbnail,
        $food_no
    );

    mysqli_stmt_execute($food_update_stmt);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'message' => '내 작성내용이 삭제됐어요.',
        'food_id' => $food_no,
        'deleted' => [
            'comments' => $deleted_comment_count,
            'replies' => $reply_delete_count,
            'photos' => $deleted_photo_count
        ],
        'comment_count' => $next_comment_count,
        'photo_count' => $next_photo_count,
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