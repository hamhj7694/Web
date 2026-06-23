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

$name = trim($data['name'] ?? '');
$category = trim($data['category'] ?? '');
$description = trim($data['description'] ?? '');
$summary = trim($data['summary'] ?? '');

$tags = $data['tags'] ?? [];
$situations = $data['situations'] ?? [];
$times = $data['times'] ?? [];

if ($name === '') {
    echo json_encode([
        'success' => false,
        'message' => '음식 이름을 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($category === '') {
    echo json_encode([
        'success' => false,
        'message' => '카테고리를 선택해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($description === '') {
    echo json_encode([
        'success' => false,
        'message' => '코멘트를 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_array($tags)) $tags = [];
if (!is_array($situations)) $situations = [];
if (!is_array($times)) $times = [];

function normalize_food_name($value) {
    $value = trim(strval($value));
    $value = preg_replace('/\s+/u', '', $value);
    return mb_strtolower($value, 'UTF-8');
}

function clean_list($list) {
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

function merge_list($old_list, $new_list) {
    if (!is_array($old_list)) $old_list = [];
    if (!is_array($new_list)) $new_list = [];

    return clean_list(array_merge($old_list, $new_list));
}

function decode_json_array($json) {
    $data = json_decode($json ?? '[]', true);

    if (!is_array($data)) {
        return [];
    }

    return $data;
}

function append_text_block($old_text, $new_text) {
    $old_text = trim(strval($old_text));
    $new_text = trim(strval($new_text));

    if ($old_text === '') {
        return $new_text;
    }

    if ($new_text === '') {
        return $old_text;
    }

    if (mb_strpos($old_text, $new_text) !== false) {
        return $old_text;
    }

    return $old_text . "\n\n" . $new_text;
}

$normalized_name = normalize_food_name($name);
$tags = clean_list($tags);
$situations = clean_list($situations);
$times = clean_list($times);

$tags_json = json_encode($tags, JSON_UNESCAPED_UNICODE);
$situations_json = json_encode($situations, JSON_UNESCAPED_UNICODE);
$times_json = json_encode($times, JSON_UNESCAPED_UNICODE);

mysqli_begin_transaction($db);

try {
    /*
        1. 같은 음식 찾기
        기준: normalized_name + category
    */
    $find_sql = "
        SELECT
            no,
            name,
            category,
            description,
            summary,
            tags_json,
            situations_json,
            times_json
        FROM omechu_wiki_foods
        WHERE normalized_name = ?
        AND category = ?
        AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ";

    $find_stmt = mysqli_prepare($db, $find_sql);

    if (!$find_stmt) {
        throw new Exception('기존 음식 확인 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param($find_stmt, 'ss', $normalized_name, $category);
    mysqli_stmt_execute($find_stmt);

    $find_result = mysqli_stmt_get_result($find_stmt);
    $existing_food = $find_result ? mysqli_fetch_assoc($find_result) : null;

    /*
        2. 기존 음식이 있으면 정보 병합
    */
    if ($existing_food) {
        $food_no = intval($existing_food['no']);

        $old_tags = decode_json_array($existing_food['tags_json']);
        $old_situations = decode_json_array($existing_food['situations_json']);
        $old_times = decode_json_array($existing_food['times_json']);

        $next_tags = merge_list($old_tags, $tags);
        $next_situations = merge_list($old_situations, $situations);
        $next_times = merge_list($old_times, $times);

        $next_description = append_text_block($existing_food['description'], $description);
        $next_summary = append_text_block($existing_food['summary'], $summary);

        $next_tags_json = json_encode($next_tags, JSON_UNESCAPED_UNICODE);
        $next_situations_json = json_encode($next_situations, JSON_UNESCAPED_UNICODE);
        $next_times_json = json_encode($next_times, JSON_UNESCAPED_UNICODE);

        $update_sql = "
            UPDATE omechu_wiki_foods
            SET description = ?,
                summary = ?,
                tags_json = ?,
                situations_json = ?,
                times_json = ?,
                updated_at = NOW()
            WHERE no = ?
            LIMIT 1
        ";

        $update_stmt = mysqli_prepare($db, $update_sql);

        if (!$update_stmt) {
            throw new Exception('기존 음식 정보 병합 준비 중 오류가 발생했어요.');
        }

        mysqli_stmt_bind_param(
            $update_stmt,
            'sssssi',
            $next_description,
            $next_summary,
            $next_tags_json,
            $next_situations_json,
            $next_times_json,
            $food_no
        );

        mysqli_stmt_execute($update_stmt);

        mysqli_commit($db);

        echo json_encode([
            'success' => true,
            'mode' => 'merged',
            'message' => '이미 있는 음식이라 기존 위키에 정보를 추가했어요.',
            'food' => [
                'id' => $food_no,
                'name' => $existing_food['name'],
                'category' => $existing_food['category']
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /*
        3. 기존 음식이 없으면 새 음식 생성
    */
    $insert_sql = "
        INSERT INTO omechu_wiki_foods
        (
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
        )
        VALUES
        (
            ?, ?, ?, '',
            ?, ?,
            ?, ?, ?,
            '{}',
            0, 0, 0, 0,
            ?,
            'active',
            NOW(),
            NOW()
        )
    ";

    $insert_stmt = mysqli_prepare($db, $insert_sql);

    if (!$insert_stmt) {
        throw new Exception('음식 등록 준비 중 오류가 발생했어요.');
    }

    mysqli_stmt_bind_param(
        $insert_stmt,
        'ssssssssi',
        $name,
        $normalized_name,
        $category,
        $description,
        $summary,
        $tags_json,
        $situations_json,
        $times_json,
        $user_no
    );

    mysqli_stmt_execute($insert_stmt);

    $food_no = mysqli_insert_id($db);

    mysqli_commit($db);

    echo json_encode([
        'success' => true,
        'mode' => 'created',
        'message' => '푸드 위키가 등록됐어요.',
        'food' => [
            'id' => $food_no,
            'name' => $name,
            'category' => $category
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Exception $e) {
    mysqli_rollback($db);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_close($db);
?>