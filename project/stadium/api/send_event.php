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

if (!$room_id || !$participant_id || !$user_token) {
    jsonResponse(false, [
        "message" => "입장 정보가 없습니다. 다시 입장해주세요."
    ]);
}

$event_type = trim($_POST["event_type"] ?? "");

$allowed_events = ["jump", "heart", "fire", "party", "ball"];

if (!in_array($event_type, $allowed_events, true)) {
    jsonResponse(false, [
        "message" => "허용되지 않은 이벤트입니다."
    ]);
}

$check_sql = "
    SELECT id
    FROM stadium_participants
    WHERE id = ?
      AND room_id = ?
      AND user_token = ?
    LIMIT 1
";

$check_stmt = mysqli_prepare($db, $check_sql);

if (!$check_stmt) {
    jsonResponse(false, [
        "message" => "참여자 확인 쿼리 준비 실패: " . mysqli_error($db)
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
$me = mysqli_fetch_assoc($check_result);

if (!$me) {
    jsonResponse(false, [
        "message" => "참여자 정보를 찾을 수 없습니다."
    ]);
}

$insert_sql = "
    INSERT INTO stadium_events
    (room_id, participant_id, event_type, created_at)
    VALUES (?, ?, ?, NOW())
";

$insert_stmt = mysqli_prepare($db, $insert_sql);

if (!$insert_stmt) {
    jsonResponse(false, [
        "message" => "이벤트 저장 쿼리 준비 실패: " . mysqli_error($db)
    ]);
}

mysqli_stmt_bind_param(
    $insert_stmt,
    "iis",
    $room_id,
    $participant_id,
    $event_type
);

mysqli_stmt_execute($insert_stmt);

$event_id = mysqli_insert_id($db);

if ($event_id <= 0) {
    jsonResponse(false, [
        "message" => "이벤트 저장 실패: " . mysqli_error($db)
    ]);
}

jsonResponse(true, [
    "message" => "이벤트가 저장되었습니다.",
    "event_id" => $event_id,
    "event_type" => $event_type
]);
?>