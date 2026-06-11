<?php
session_start();

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(false, [
        "message" => "잘못된 요청입니다."
    ]);
}

$nickname = trim($_POST["nickname"] ?? "");
$room_code = strtoupper(trim($_POST["room_code"] ?? ""));

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

if ($room_code === "") {
    jsonResponse(false, [
        "message" => "입장코드를 입력해주세요."
    ]);
}

if (!preg_match("/^[A-Z0-9]{4,10}$/", $room_code)) {
    jsonResponse(false, [
        "message" => "올바른 입장코드가 아닙니다."
    ]);
}

$nickname = cleanText($nickname);
$user_color = getUserColor($nickname);

$face_image_path = null;
$server_save_path = null;

/*
  얼굴 이미지 업로드 처리

  실제 서버 저장 위치:
  api/join_room.php 기준 ../uploads/faces/

  DB/세션 저장 경로:
  uploads/faces/파일명
*/
if (isset($_FILES["face_image"]) && $_FILES["face_image"]["error"] === UPLOAD_ERR_OK) {
    $max_size = 3 * 1024 * 1024;

    if ($_FILES["face_image"]["size"] > $max_size) {
        jsonResponse(false, [
            "message" => "얼굴 이미지는 최대 3MB까지 업로드할 수 있습니다."
        ]);
    }

    $upload_dir = __DIR__ . "/../uploads/faces/";

    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            jsonResponse(false, [
                "message" => "얼굴 이미지 저장 폴더를 만들 수 없습니다."
            ]);
        }
    }

    $tmp_name = $_FILES["face_image"]["tmp_name"];
    $original_name = $_FILES["face_image"]["name"];
    $ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));

    $allowed_exts = ["jpg", "jpeg", "png", "webp"];

    if (!in_array($ext, $allowed_exts, true)) {
        jsonResponse(false, [
            "message" => "jpg, png, webp 이미지만 업로드할 수 있습니다."
        ]);
    }

    $image_info = getimagesize($tmp_name);

    if ($image_info === false) {
        jsonResponse(false, [
            "message" => "올바른 이미지 파일이 아닙니다."
        ]);
    }

    $allowed_mimes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!in_array($image_info["mime"], $allowed_mimes, true)) {
        jsonResponse(false, [
            "message" => "jpg, png, webp 이미지만 업로드할 수 있습니다."
        ]);
    }

    $new_name = "face_" . bin2hex(random_bytes(16)) . "." . $ext;

    // 서버 실제 저장 위치
    $server_save_path = $upload_dir . $new_name;

    // DB와 세션에 저장할 상대경로
    $face_image_path = "uploads/faces/" . $new_name;

    if (!move_uploaded_file($tmp_name, $server_save_path)) {
        jsonResponse(false, [
            "message" => "얼굴 이미지 업로드에 실패했습니다."
        ]);
    }
}

$user_token = generateToken();

mysqli_begin_transaction($db);

try {
    /*
      1. 입장코드로 방 찾기
    */
    $room_sql = "
        SELECT id, room_code
        FROM stadium_rooms
        WHERE room_code = ?
        LIMIT 1
    ";

    $room_stmt = mysqli_prepare($db, $room_sql);

    if (!$room_stmt) {
        throw new Exception("방 확인 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($room_stmt, "s", $room_code);
    mysqli_stmt_execute($room_stmt);

    $room_result = mysqli_stmt_get_result($room_stmt);
    $room = mysqli_fetch_assoc($room_result);

    if (!$room) {
        throw new Exception("존재하지 않는 입장코드입니다.");
    }

    $room_id = (int)$room["id"];

    /*
      2. 참여자 생성
      - 입장자는 is_host = 0
      - 초기 위치는 50
    */
    $x_position = 50;
    $is_host = 0;

    /*
    같은 방 안에서 같은 닉네임이 현재 접속 중이면 입장 차단
    last_seen이 최근 30초 이내면 접속 중으로 판단
    */
    $existing_participant_sql = "
        SELECT id, nickname, last_seen
        FROM stadium_participants
        WHERE room_id = ?
        AND nickname = ?
        AND last_seen >= DATE_SUB(NOW(), INTERVAL 30 SECOND)
        LIMIT 1
    ";

    $existing_participant_stmt = mysqli_prepare($db, $existing_participant_sql);

    if (!$existing_participant_stmt) {
        throw new Exception("닉네임 중복 확인 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param(
        $existing_participant_stmt,
        "is",
        $room_id,
        $nickname
    );

    mysqli_stmt_execute($existing_participant_stmt);

    $existing_participant_result = mysqli_stmt_get_result($existing_participant_stmt);
    $existing_participant = mysqli_fetch_assoc($existing_participant_result);

    if ($existing_participant) {
        throw new Exception("사용중인 닉네임입니다.");
    }

    $insert_participant_sql = "
        INSERT INTO stadium_participants
        (room_id, user_token, nickname, user_color, face_image, x_position, is_host, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ";

    $participant_stmt = mysqli_prepare($db, $insert_participant_sql);

    if (!$participant_stmt) {
        throw new Exception("참여자 생성 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param(
        $participant_stmt,
        "issssii",
        $room_id,
        $user_token,
        $nickname,
        $user_color,
        $face_image_path,
        $x_position,
        $is_host
    );

    mysqli_stmt_execute($participant_stmt);

    $participant_id = mysqli_insert_id($db);

    if ($participant_id <= 0) {
        throw new Exception("참여자 생성에 실패했습니다.");
    }

    /*
      3. 세션 저장
    */
    $_SESSION["room_code"] = $room_code;
    $_SESSION["room_id"] = $room_id;
    $_SESSION["participant_id"] = $participant_id;
    $_SESSION["user_token"] = $user_token;
    $_SESSION["is_host"] = false;
    $_SESSION["face_image"] = $face_image_path ?? "";

    mysqli_commit($db);

    jsonResponse(true, [
        "message" => "방에 입장했습니다.",
        "room_code" => $room_code,
        "redirect_url" => "room.php?code=" . urlencode($room_code)
    ]);

} catch (Exception $e) {
    mysqli_rollback($db);

    if ($server_save_path && file_exists($server_save_path)) {
        unlink($server_save_path);
    }

    jsonResponse(false, [
        "message" => $e->getMessage()
    ]);
}
?>