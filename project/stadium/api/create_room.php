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

$face_image_path = null;
$server_save_path = null;

/*
  얼굴 이미지 업로드 처리

  실제 서버 저장 위치:
  api/create_room.php 기준 ../uploads/faces/

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


/*
  같은 닉네임으로 이미 만든 방이 있는지 확인
  - 같은 nickname
  - 방장 is_host = 1
  - 기존 방이 있으면 새 방을 만들지 않고 그 방으로 이동
*/
$existing_room_sql = "
    SELECT
        r.id AS room_id,
        r.room_code,
        p.id AS participant_id,
        p.user_token,
        p.face_image
    FROM stadium_rooms r
    INNER JOIN stadium_participants p
        ON r.id = p.room_id
    WHERE p.nickname = ?
      AND p.is_host = 1
    ORDER BY r.id DESC
    LIMIT 1
";

$existing_room_stmt = mysqli_prepare($db, $existing_room_sql);

if (!$existing_room_stmt) {
    jsonResponse(false, [
        "message" => "기존 방 확인 쿼리 준비 실패"
    ]);
}

mysqli_stmt_bind_param($existing_room_stmt, "s", $nickname);
mysqli_stmt_execute($existing_room_stmt);

$existing_room_result = mysqli_stmt_get_result($existing_room_stmt);
$existing_room = mysqli_fetch_assoc($existing_room_result);

if ($existing_room) {
    /*
    같은 닉네임으로 기존 방이 있으면
    기존 방장 얼굴을 최신 이미지로 업데이트
    */
    $update_face_sql = "
        UPDATE stadium_participants
        SET face_image = ?,
            last_seen = NOW()
        WHERE id = ?
        AND is_host = 1
    ";

    $update_face_stmt = mysqli_prepare($db, $update_face_sql);

    if (!$update_face_stmt) {
        jsonResponse(false, [
            "message" => "기존 얼굴 이미지 업데이트 쿼리 준비 실패"
        ]);
    }

    $existing_participant_id = (int)$existing_room["participant_id"];

    mysqli_stmt_bind_param(
        $update_face_stmt,
        "si",
        $face_image_path,
        $existing_participant_id
    );

    mysqli_stmt_execute($update_face_stmt);

    $existing_room["face_image"] = $face_image_path;
    $_SESSION["room_code"] = $existing_room["room_code"];
    $_SESSION["room_id"] = (int)$existing_room["room_id"];
    $_SESSION["participant_id"] = (int)$existing_room["participant_id"];
    $_SESSION["user_token"] = $existing_room["user_token"];
    $_SESSION["is_host"] = true;
    $_SESSION["face_image"] = $existing_room["face_image"] ?? "";

    jsonResponse(true, [
        "message" => "이미 만든 방이 있어 기존 방으로 이동합니다.",
        "room_code" => $existing_room["room_code"],
        "redirect_url" => "room.php?code=" . urlencode($existing_room["room_code"])
    ]);
}

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

        if (!$check_stmt) {
            throw new Exception("방 코드 확인 쿼리 준비 실패");
        }

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

    $_SESSION["room_code"] = $room_code;
    $_SESSION["room_id"] = $room_id;
    $_SESSION["participant_id"] = $participant_id;
    $_SESSION["user_token"] = $user_token;
    $_SESSION["is_host"] = true;
    $_SESSION["face_image"] = $face_image_path ?? "";

    mysqli_commit($db);

    jsonResponse(true, [
        "message" => "방이 생성되었습니다.",
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