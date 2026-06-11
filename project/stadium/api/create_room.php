<?php
session_start();

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(false, [
        "message" => "잘못된 요청입니다."
    ]);
}

$nickname = trim($_POST["nickname"] ?? "");

if ($nickname === "") {
    jsonResponse(false, [
        "message" => "닉네임을 입력해주세요."
    ]);
}

if (mb_strlen($nickname, "UTF-8") > 12) {
    jsonResponse(false, [
        "message" => "닉네임은 최대 12자까지 가능합니다."
    ]);
}

$nickname = cleanText($nickname);
$user_color = getUserColor($nickname);

$user_token = generateToken();
$host_token = $user_token;

$room_code = "";
$room_id = 0;

mysqli_begin_transaction($db);

try {
    for ($i = 0; $i < 10; $i++) {
        $candidate_code = generateRoomCode(6);

        $check_sql = "SELECT id FROM stadium_rooms WHERE room_code = ?";
        $check_stmt = mysqli_prepare($db, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "s", $candidate_code);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_num_rows($check_result) === 0) {
            $room_code = $candidate_code;
            break;
        }
    }

    if ($room_code === "") {
        throw new Exception("방 코드 생성에 실패했습니다.");
    }

    $insert_room_sql = "
        INSERT INTO stadium_rooms (room_code, host_token, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
    ";

    $room_stmt = mysqli_prepare($db, $insert_room_sql);

    if (!$room_stmt) {
        throw new Exception("방 생성 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($room_stmt, "ss", $room_code, $host_token);
    mysqli_stmt_execute($room_stmt);

    $room_id = mysqli_insert_id($db);

    if ($room_id <= 0) {
        throw new Exception("방 생성에 실패했습니다.");
    }

    $x_position = 50;
    $is_host = 1;

    $insert_participant_sql = "
        INSERT INTO stadium_participants
        (room_id, user_token, nickname, user_color, x_position, is_host, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ";

    $participant_stmt = mysqli_prepare($db, $insert_participant_sql);

    if (!$participant_stmt) {
        throw new Exception("참여자 생성 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param(
        $participant_stmt,
        "isssii",
        $room_id,
        $user_token,
        $nickname,
        $user_color,
        $x_position,
        $is_host
    );

    mysqli_stmt_execute($participant_stmt);

    $participant_id = mysqli_insert_id($db);

    if ($participant_id <= 0) {
        throw new Exception("참여자 생성에 실패했습니다.");
    }

    $_SESSION["room_code"] = $room_code;
    $_SESSION["room_id"] = $room_id;
    $_SESSION["participant_id"] = $participant_id;
    $_SESSION["user_token"] = $user_token;
    $_SESSION["is_host"] = true;

    mysqli_commit($db);

    jsonResponse(true, [
        "message" => "방이 생성되었습니다.",
        "room_code" => $room_code,
        "redirect_url" => "room.php?code=" . urlencode($room_code)
    ]);

} catch (Exception $e) {
    mysqli_rollback($db);

    jsonResponse(false, [
        "message" => $e->getMessage()
    ]);
}
?>