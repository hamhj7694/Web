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

$message = trim($_POST["message"] ?? "");

if ($message === "") {
    jsonResponse(false, [
        "message" => "메시지를 입력해주세요."
    ]);
}

if (mb_strlen($message, "UTF-8") > 80) {
    jsonResponse(false, [
        "message" => "메시지는 최대 80자까지 가능합니다."
    ]);
}

/*
  현재 세션의 참여자가 실제로 존재하는지 확인
*/
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
    INSERT INTO stadium_messages
    (room_id, participant_id, message, created_at)
    VALUES (?, ?, ?, NOW())
";

$insert_stmt = mysqli_prepare($db, $insert_sql);

if (!$insert_stmt) {
    jsonResponse(false, [
        "message" => "메시지 저장 쿼리 준비 실패: " . mysqli_error($db)
    ]);
}

mysqli_stmt_bind_param(
    $insert_stmt,
    "iis",
    $room_id,
    $participant_id,
    $message
);

mysqli_stmt_execute($insert_stmt);

$message_id = mysqli_insert_id($db);

if ($message_id <= 0) {
    jsonResponse(false, [
        "message" => "메시지 저장 실패: " . mysqli_error($db)
    ]);
}

jsonResponse(true, [
    "message" => "메시지가 저장되었습니다.",
    "message_id" => $message_id
]);
?>