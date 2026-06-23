<?php
session_start();

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(false, [
        "message" => "잘못된 요청입니다."
    ]);
}

$room_id = $_SESSION["room_id"] ?? null;
$participant_id = $_SESSION["participant_id"] ?? null;
$user_token = $_SESSION["user_token"] ?? null;
$is_host = $_SESSION["is_host"] ?? false;

if (!$room_id || !$participant_id || !$user_token) {
    jsonResponse(false, [
        "message" => "입장 정보가 없습니다. 다시 입장해주세요."
    ]);
}

if (!$is_host) {
    jsonResponse(false, [
        "message" => "방장만 화면 링크를 변경할 수 있습니다."
    ]);
}

$iframe_url = trim($_POST["iframe_url"] ?? "");

if ($iframe_url === "") {
    jsonResponse(false, [
        "message" => "링크를 입력해주세요."
    ]);
}

if (!filter_var($iframe_url, FILTER_VALIDATE_URL)) {
    jsonResponse(false, [
        "message" => "올바른 URL이 아닙니다."
    ]);
}

$scheme = parse_url($iframe_url, PHP_URL_SCHEME);

if ($scheme !== "http" && $scheme !== "https") {
    jsonResponse(false, [
        "message" => "http 또는 https 링크만 사용할 수 있습니다."
    ]);
}

$check_sql = "
    SELECT id
    FROM stadium_participants
    WHERE id = ?
      AND room_id = ?
      AND user_token = ?
      AND is_host = 1
    LIMIT 1
";

$check_stmt = mysqli_prepare($db, $check_sql);

if (!$check_stmt) {
    jsonResponse(false, [
        "message" => "방장 확인 쿼리 준비 실패: " . mysqli_error($db)
    ]);
}

mysqli_stmt_bind_param(
    $check_stmt,
    "iis",
    $participant_id,
    $room_id,
    $user_token
);

mysqli_stmt_execute($check_stmt);

$check_result = mysqli_stmt_get_result($check_stmt);
$host = mysqli_fetch_assoc($check_result);

if (!$host) {
    jsonResponse(false, [
        "message" => "방장 정보를 확인할 수 없습니다."
    ]);
}

$update_sql = "
    UPDATE stadium_rooms
    SET iframe_url = ?,
        updated_at = NOW()
    WHERE id = ?
    LIMIT 1
";

$update_stmt = mysqli_prepare($db, $update_sql);

if (!$update_stmt) {
    jsonResponse(false, [
        "message" => "화면 링크 저장 쿼리 준비 실패: " . mysqli_error($db)
    ]);
}

mysqli_stmt_bind_param(
    $update_stmt,
    "si",
    $iframe_url,
    $room_id
);

mysqli_stmt_execute($update_stmt);

jsonResponse(true, [
    "message" => "화면 링크가 저장되었습니다.",
    "iframe_url" => $iframe_url
]);
?>