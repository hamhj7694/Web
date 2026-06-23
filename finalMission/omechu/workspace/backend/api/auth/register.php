    <?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db.php';

// JS fetch에서 보낸 JSON 읽기
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// 값 받기
$login_id = trim($data['login_id'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$password_check = trim($data['password_check'] ?? '');
$nickname = trim($data['nickname'] ?? '');

// 빈 값 검사
if ($login_id === '' || $email === '' || $password === '' || $password_check === '' || $nickname === '') {
    echo json_encode([
        'success' => false,
        'message' => '필수 정보를 모두 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 아이디 형식 검사
if (!preg_match('/^[a-zA-Z0-9]{4,}$/', $login_id)) {
    echo json_encode([
        'success' => false,
        'message' => '아이디는 영문, 숫자 조합 4자 이상으로 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 이메일 형식 검사
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => '올바른 이메일 형식으로 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 비밀번호 검사
if (strlen($password) < 4) {
    echo json_encode([
        'success' => false,
        'message' => '비밀번호는 4자 이상 입력해주세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($password !== $password_check) {
    echo json_encode([
        'success' => false,
        'message' => '비밀번호가 서로 달라요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 아이디 중복 검사
$sql = "SELECT no FROM omechu_users WHERE login_id = '$login_id' LIMIT 1";
$result = mysqli_query($db, $sql);

if (mysqli_num_rows($result) > 0) {
    echo json_encode([
        'success' => false,
        'message' => '이미 사용 중인 아이디예요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 이메일 중복 검사
$sql = "SELECT no FROM omechu_users WHERE email = '$email' LIMIT 1";
$result = mysqli_query($db, $sql);

if (mysqli_num_rows($result) > 0) {
    echo json_encode([
        'success' => false,
        'message' => '이미 가입된 이메일이에요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 닉네임 중복 검사
$sql = "SELECT no FROM omechu_users WHERE nickname = '$nickname' LIMIT 1";
$result = mysqli_query($db, $sql);

if (mysqli_num_rows($result) > 0) {
    echo json_encode([
        'success' => false,
        'message' => '이미 사용 중인 닉네임이에요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 비밀번호 암호화
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// 회원 저장
$sql = "
    INSERT INTO omechu_users (
        login_id,
        email,
        password_hash,
        nickname,
        status
    ) VALUES (
        '$login_id',
        '$email',
        '$password_hash',
        '$nickname',
        'active'
    )
";

$result = mysqli_query($db, $sql);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => '회원가입이 완료됐어요! 로그인해주세요.'
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'success' => false,
        'message' => '회원가입 중 오류가 발생했어요.'
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($db);
?>