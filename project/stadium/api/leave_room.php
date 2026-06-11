<?php
session_start();

require_once __DIR__ . "/db.php";

$room_id = $_SESSION["room_id"] ?? null;
$participant_id = $_SESSION["participant_id"] ?? null;
$user_token = $_SESSION["user_token"] ?? null;

if ($room_id && $participant_id && $user_token) {
    $sql = "
        UPDATE stadium_participants
        SET last_seen = DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        WHERE id = ?
          AND room_id = ?
          AND user_token = ?
        LIMIT 1
    ";

    $stmt = mysqli_prepare($db, $sql);

    if ($stmt) {
        mysqli_stmt_bind_param(
            $stmt,
            "iis",
            $participant_id,
            $room_id,
            $user_token
        );

        mysqli_stmt_execute($stmt);
    }
}

unset($_SESSION["room_code"]);
unset($_SESSION["room_id"]);
unset($_SESSION["participant_id"]);
unset($_SESSION["user_token"]);
unset($_SESSION["is_host"]);
unset($_SESSION["face_image"]);

jsonResponse(true, [
    "message" => "방에서 나갔습니다."
]);
?>