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

$x_position = $_POST["x_position"] ?? null;
$y_position = $_POST["y_position"] ?? null;

if ($x_position === null || !is_numeric($x_position)) {
    jsonResponse(false, [
        "message" => "가로 위치 정보가 올바르지 않습니다."
    ]);
}

if ($y_position === null || !is_numeric($y_position)) {
    jsonResponse(false, [
        "message" => "세로 위치 정보가 올바르지 않습니다."
    ]);
}

$x_position = round((float)$x_position, 2);
$y_position = round((float)$y_position, 2);

$x_position = max(6, min(94, $x_position));
$y_position = max(8, min(88, $y_position));

$update_sql = "
    UPDATE stadium_participants
    SET x_position = ?,
        y_position = ?,
        last_seen = NOW()
    WHERE id = ?
      AND room_id = ?
      AND user_token = ?
    LIMIT 1
";

$update_stmt = mysqli_prepare($db, $update_sql);

if (!$update_stmt) {
    jsonResponse(false, [
        "message" => "위치 업데이트 쿼리 준비 실패: " . mysqli_error($db)
    ]);
}

mysqli_stmt_bind_param(
    $update_stmt,
    "ddiis",
    $x_position,
    $y_position,
    $participant_id,
    $room_id,
    $user_token
);

mysqli_stmt_execute($update_stmt);

jsonResponse(true, [
    "x_position" => $x_position,
    "y_position" => $y_position
]);
?>