<?php
session_start();

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    jsonResponse(false, [
        "message" => "잘못된 요청입니다."
    ]);
}

$room_code = strtoupper(trim($_GET["code"] ?? ""));

if ($room_code === "") {
    jsonResponse(false, [
        "message" => "입장코드가 없습니다."
    ]);
}

if (!preg_match("/^[A-Z0-9]{4,10}$/", $room_code)) {
    jsonResponse(false, [
        "message" => "올바른 입장코드가 아닙니다."
    ]);
}

$session_room_id = $_SESSION["room_id"] ?? null;
$session_participant_id = $_SESSION["participant_id"] ?? null;
$session_user_token = $_SESSION["user_token"] ?? null;

try {
    /*
      1. 방 정보 가져오기
    */
    $room_sql = "
        SELECT id, room_code, iframe_url, created_at, updated_at
        FROM stadium_rooms
        WHERE room_code = ?
        LIMIT 1
    ";

    $room_stmt = mysqli_prepare($db, $room_sql);

    if (!$room_stmt) {
        throw new Exception("방 정보 조회 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($room_stmt, "s", $room_code);
    mysqli_stmt_execute($room_stmt);

    $room_result = mysqli_stmt_get_result($room_stmt);
    $room = mysqli_fetch_assoc($room_result);

    if (!$room) {
        throw new Exception("존재하지 않는 방입니다.");
    }

    $room_id = (int)$room["id"];

    /*
      2. 세션 검증
      - 같은 방에 들어온 사용자인지 확인
      - 나중에 보안상 중요함
    */
    if (!$session_room_id || !$session_participant_id || !$session_user_token) {
        jsonResponse(false, [
            "message" => "입장 정보가 없습니다. 다시 입장해주세요."
        ]);
    }

    if ((int)$session_room_id !== $room_id) {
        jsonResponse(false, [
            "message" => "현재 세션의 방 정보가 일치하지 않습니다. 다시 입장해주세요."
        ]);
    }

    /*
      3. 내 참여자 정보 확인 + last_seen 갱신
    */
    $me_sql = "
        SELECT id, room_id, user_token, nickname, user_color, face_image, x_position, y_position, is_host, last_seen
        FROM stadium_participants
        WHERE id = ?
          AND room_id = ?
          AND user_token = ?
        LIMIT 1
    ";

    $me_stmt = mysqli_prepare($db, $me_sql);

    if (!$me_stmt) {
        throw new Exception("내 정보 조회 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param(
        $me_stmt,
        "iis",
        $session_participant_id,
        $room_id,
        $session_user_token
    );

    mysqli_stmt_execute($me_stmt);

    $me_result = mysqli_stmt_get_result($me_stmt);
    $me = mysqli_fetch_assoc($me_result);

    if (!$me) {
        jsonResponse(false, [
            "message" => "참여자 정보를 찾을 수 없습니다. 다시 입장해주세요."
        ]);
    }

    $update_seen_sql = "
        UPDATE stadium_participants
        SET last_seen = NOW()
        WHERE id = ?
          AND room_id = ?
          AND user_token = ?
    ";

    $update_seen_stmt = mysqli_prepare($db, $update_seen_sql);

    if (!$update_seen_stmt) {
        throw new Exception("접속 상태 갱신 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param(
        $update_seen_stmt,
        "iis",
        $session_participant_id,
        $room_id,
        $session_user_token
    );

    mysqli_stmt_execute($update_seen_stmt);

    /*
      4. 같은 방의 참여자 목록 가져오기
      - 최근 30초 안에 접속 확인된 사람만 표시
      - 테스트 중 너무 빨리 사라지면 60초로 늘려도 됨
    */
    $participants_sql = "
        SELECT
            id,
            nickname,
            user_color,
            face_image,
            x_position,
            y_position,
            is_host,
            last_seen,
            created_at
        FROM stadium_participants
        WHERE room_id = ?
          AND last_seen >= DATE_SUB(NOW(), INTERVAL 30 SECOND)
        ORDER BY is_host DESC, id ASC
    ";

    $participants_stmt = mysqli_prepare($db, $participants_sql);

    if (!$participants_stmt) {
        throw new Exception("참여자 목록 조회 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($participants_stmt, "i", $room_id);
    mysqli_stmt_execute($participants_stmt);

    $participants_result = mysqli_stmt_get_result($participants_stmt);

    $participants = [];

    while ($participant = mysqli_fetch_assoc($participants_result)) {
        $participants[] = [
            "id" => (int)$participant["id"],
            "nickname" => $participant["nickname"],
            "user_color" => $participant["user_color"],
            "face_image" => $participant["face_image"] ?? "",
            "x_position" => (int)$participant["x_position"],
            "y_position" => (float)$participant["y_position"],
            "is_host" => (int)$participant["is_host"],
            "last_seen" => $participant["last_seen"],
            "created_at" => $participant["created_at"]
        ];
    }

    /*
      5. 응답
    */
    $events_sql = "
        SELECT
            id,
            participant_id,
            event_type,
            created_at
        FROM stadium_events
        WHERE room_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
        ORDER BY id ASC
    ";

    $events_stmt = mysqli_prepare($db, $events_sql);

    if (!$events_stmt) {
        throw new Exception("이벤트 목록 조회 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($events_stmt, "i", $room_id);
    mysqli_stmt_execute($events_stmt);

    $events_result = mysqli_stmt_get_result($events_stmt);

    $events = [];

    while ($event = mysqli_fetch_assoc($events_result)) {
        $events[] = [
            "id" => (int)$event["id"],
            "participant_id" => (int)$event["participant_id"],
            "event_type" => $event["event_type"],
            "created_at" => $event["created_at"]
        ];
    }

    $messages_sql = "
        SELECT
            m.id,
            m.participant_id,
            m.message,
            m.created_at,
            p.nickname
        FROM stadium_messages m
        INNER JOIN stadium_participants p
            ON m.participant_id = p.id
        WHERE m.room_id = ?
        AND m.created_at >= DATE_SUB(NOW(), INTERVAL 10 SECOND)
        ORDER BY m.id ASC
    ";

    $messages_stmt = mysqli_prepare($db, $messages_sql);

    if (!$messages_stmt) {
        throw new Exception("메시지 목록 조회 쿼리 준비 실패");
    }

    mysqli_stmt_bind_param($messages_stmt, "i", $room_id);
    mysqli_stmt_execute($messages_stmt);

    $messages_result = mysqli_stmt_get_result($messages_stmt);

    $messages = [];

    while ($message_row = mysqli_fetch_assoc($messages_result)) {
        $messages[] = [
            "id" => (int)$message_row["id"],
            "participant_id" => (int)$message_row["participant_id"],
            "nickname" => $message_row["nickname"],
            "message" => $message_row["message"],
            "created_at" => $message_row["created_at"]
        ];
    }

    jsonResponse(true, [
        "room" => [
            "id" => $room_id,
            "room_code" => $room["room_code"],
            "iframe_url" => $room["iframe_url"] ?? "",
            "created_at" => $room["created_at"],
            "updated_at" => $room["updated_at"]
        ],
        "me" => [
            "participant_id" => (int)$me["id"],
            "nickname" => $me["nickname"],
            "face_image" => $me["face_image"] ?? "",
            "x_position" => (int)$me["x_position"],
            "y_position" => (float)$me["y_position"],
            "is_host" => (int)$me["is_host"]
        ],
        "participants" => $participants,
        "events" => $events,
        "messages" => $messages
    ]);

} catch (Exception $e) {
    jsonResponse(false, [
        "message" => $e->getMessage()
    ]);
}
?>