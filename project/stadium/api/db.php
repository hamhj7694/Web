<?php
header("Content-Type: application/json; charset=utf-8");

$db_host = "localhost";
$db_user = "testham";
$db_pass = "a1s2d3f4!";
$db_name = "testham";

$db = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

if (!$db) {
    echo json_encode([
        "success" => false,
        "message" => "DB 연결 실패: " . mysqli_connect_error()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_set_charset($db, "utf8mb4");

function jsonResponse($success, $data = []) {
    echo json_encode(array_merge([
        "success" => $success
    ], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function cleanText($text) {
    return htmlspecialchars(trim($text), ENT_QUOTES, "UTF-8");
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

function generateRoomCode($length = 6) {
    $characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    $code = "";

    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[random_int(0, strlen($characters) - 1)];
    }

    return $code;
}

function getUserColor($nickname) {
    $colors = [
        "#fff3a3",
        "#c7f9cc",
        "#bde0fe",
        "#ffc8dd",
        "#d0bfff",
        "#ffd6a5",
        "#caffbf",
        "#e0fbfc"
    ];

    $hash = crc32($nickname);
    return $colors[$hash % count($colors)];
}
?>