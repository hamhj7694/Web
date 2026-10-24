<?php
// Set credentials on the server, not in this public repository.
header('Content-Type: application/json; charset=utf-8');
$host = getenv('OMECHU_DB_HOST');
$user = getenv('OMECHU_DB_USER');
$pass = getenv('OMECHU_DB_PASSWORD');
$name = getenv('OMECHU_DB_NAME');
if (!$host || !$user || $pass === false || !$name) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'DB configuration required.']);
    exit;
}
$db = mysqli_connect($host, $user, $pass, $name);
if (!$db) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'DB connection failed.']);
    exit;
}
mysqli_set_charset($db, 'utf8mb4');
?>