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
$user_key = strval($user_no);

$sql = "
    SELECT
        no,
        name,
        category,
        image_url,
        likes_json,
        like_count,
        comment_count,
        view_count,
        photo_count,
        created_at
    FROM omechu_wiki_foods
    WHERE status = 'active'
    ORDER BY no DESC
";

$result = mysqli_query($db, $sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => '내 활동 정보를 불러오지 못했어요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$foods = [];

while ($row = mysqli_fetch_assoc($result)) {
    $food_no = intval($row['no']);

    $likes_json = json_decode($row['likes_json'] ?? '{}', true);

    if (!is_array($likes_json)) {
        $likes_json = [];
    }

    $foods[$food_no] = [
        'foodId' => $food_no,
        'foodName' => $row['name'],
        'foodCategory' => $row['category'] ?: '기타',
        'foodImage' => $row['image_url'] ?: '',
        'commentCount' => 0,
        'replyCount' => 0,
        'photoCount' => 0,
        'tagCount' => 0,
        'myLikeCount' => isset($likes_json[$user_key]) ? intval($likes_json[$user_key]) : 0,
        'totalLikeCount' => intval($row['like_count']),
        'createdAt' => $row['created_at']
    ];
}

/*
    내가 작성한 코멘트 수
*/
$comment_sql = "
    SELECT food_no, COUNT(*) AS cnt
    FROM omechu_wiki_comments
    WHERE user_no = ?
    AND status = 'active'
    GROUP BY food_no
";

$comment_stmt = mysqli_prepare($db, $comment_sql);

if ($comment_stmt) {
    mysqli_stmt_bind_param($comment_stmt, 'i', $user_no);
    mysqli_stmt_execute($comment_stmt);

    $comment_result = mysqli_stmt_get_result($comment_stmt);

    while ($row = mysqli_fetch_assoc($comment_result)) {
        $food_no = intval($row['food_no']);

        if (isset($foods[$food_no])) {
            $foods[$food_no]['commentCount'] = intval($row['cnt']);
        }
    }
}

/*
    내가 작성한 사진 수
*/
$photo_sql = "
    SELECT food_no, COUNT(*) AS cnt
    FROM omechu_wiki_food_photos
    WHERE user_no = ?
    AND status = 'active'
    GROUP BY food_no
";

$photo_stmt = mysqli_prepare($db, $photo_sql);

if ($photo_stmt) {
    mysqli_stmt_bind_param($photo_stmt, 'i', $user_no);
    mysqli_stmt_execute($photo_stmt);

    $photo_result = mysqli_stmt_get_result($photo_stmt);

    while ($row = mysqli_fetch_assoc($photo_result)) {
        $food_no = intval($row['food_no']);

        if (isset($foods[$food_no])) {
            $foods[$food_no]['photoCount'] = intval($row['cnt']);
        }
    }
}

/*
    replies_json 안에서 내가 작성한 의견 수
*/
$reply_sql = "
    SELECT food_no, replies_json
    FROM omechu_wiki_comments
    WHERE status = 'active'
    AND replies_json IS NOT NULL
    AND replies_json != ''
";

$reply_result = mysqli_query($db, $reply_sql);

if ($reply_result) {
    while ($row = mysqli_fetch_assoc($reply_result)) {
        $food_no = intval($row['food_no']);

        if (!isset($foods[$food_no])) {
            continue;
        }

        $replies = json_decode($row['replies_json'], true);

        if (!is_array($replies)) {
            continue;
        }

        foreach ($replies as $reply) {
            $reply_user_no = 0;

            if (isset($reply['userNo'])) {
                $reply_user_no = intval($reply['userNo']);
            } elseif (isset($reply['user_no'])) {
                $reply_user_no = intval($reply['user_no']);
            }

            if ($reply_user_no === $user_no) {
                $foods[$food_no]['replyCount'] += 1;
            }
        }
    }
}

$joined_foods = [];
$liked_foods = [];

foreach ($foods as $food) {
    if (
        intval($food['commentCount']) > 0 ||
        intval($food['replyCount']) > 0 ||
        intval($food['photoCount']) > 0
    ) {
        $joined_foods[] = $food;
    }

    if (intval($food['myLikeCount']) > 0) {
        $liked_foods[] = $food;
    }
}

echo json_encode([
    'success' => true,
    'joinedFoods' => $joined_foods,
    'likedFoods' => $liked_foods
], JSON_UNESCAPED_UNICODE);

mysqli_close($db);
?>