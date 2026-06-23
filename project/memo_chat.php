<?php
header("Content-Type:text/html; charset=utf-8");

$db = mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');

if(!$db){
    die("DB 연결 실패: " . mysqli_connect_error());
}

mysqli_set_charset($db, "utf8mb4");

/* 닉네임마다 고정 색상 부여 */
function getUserColor($nickname){
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

/* HTML 특수문자 처리 */
function cleanText($text){
    return htmlspecialchars($text, ENT_QUOTES, "UTF-8");
}

/* 욕설/음란어 필터링 */
function filterBadWords($text){
    $badWords = [
        '시발', '씨발', '씨팔', '씹', '씹새', '씹새끼', '씹쌔끼',
        'ㅅㅂ', 'ㅆㅂ', 'ㅅ발', 'ㅆ발', '시1발', '씨1발', '시@발', '씨@발',
        '시-발', '씨-발', '시 발', '씨 발', '쉬발', '쒸발', '쒸바',
        '개새끼', '개새', '개색기', '개색끼', '개쌔끼', '개쉐끼',
        '새끼', '색기', '색끼', '쌔끼', '쉐끼',
        '병신', '븅신', '빙신', 'ㅂㅅ', '병1신', '병@신',
        '미친놈', '미친년', '미친새끼', '미친', 'ㅁㅊ',
        '돌아이', '또라이', '또라이새끼',
        '지랄', 'ㅈㄹ', '지1랄', '지@랄',
        '염병', '엠병', '옘병',
        '닥쳐', '꺼져',
        '좆', '좃', 'ㅈ같', '좆같', '좃같', '존나', '졸라', '조낸',
        '썅', '쌍년', '쌍놈', '썅년', '썅놈',
        '개같', '개빡', '개짜증', '개소리'
    ];

    $adultWords = [
        '섹스', '쎅스', '색스', 'sex',
        '야스', '떡치', '떡침', '원나잇',
        '자위', '딸딸이', '딸치', '딸침',
        '포르노', '야동',
        '보지', '보1지', '보@지', 'ㅂㅈ',
        '자지', '자1지', '자@지', 'ㅈㅈ',
        '질싸', '입싸', '노콘',
        '몰카', '리벤지포르노'
    ];

    $patterns = [
        '/시[\s\W_]*[1ㅣiI]*[\s\W_]*발/u',
        '/씨[\s\W_]*[1ㅣiI]*[\s\W_]*발/u',
        '/ㅅ[\s\W_]*ㅂ/u',
        '/ㅆ[\s\W_]*ㅂ/u',

        '/병[\s\W_]*[1ㅣiI]*[\s\W_]*신/u',
        '/ㅂ[\s\W_]*ㅅ/u',

        '/지[\s\W_]*[1ㅣiI]*[\s\W_]*랄/u',
        '/ㅈ[\s\W_]*ㄹ/u',

        '/좆|좃|ㅈ[\s\W_]*같/u',
        '/존[\s\W_]*나/u',
        '/졸[\s\W_]*라/u',

        '/개[\s\W_]*새[\s\W_]*(끼|기)?/u',
        '/씹|ㅆ[\s\W_]*ㅣ[\s\W_]*ㅂ/u',

        '/섹[\s\W_]*스/u',
        '/쎅[\s\W_]*스/u',
        '/ㅅ[\s\W_]*ㅅ/u',
        '/야[\s\W_]*동/u',
        '/포[\s\W_]*르[\s\W_]*노/u',

        '/보[\s\W_]*[1ㅣiI]*[\s\W_]*지/u',
        '/자[\s\W_]*[1ㅣiI]*[\s\W_]*지/u',
        '/ㅂ[\s\W_]*ㅈ/u',
        '/ㅈ[\s\W_]*ㅈ/u',

        '/딸[\s\W_]*(치|침|딸이)/u',
        '/자[\s\W_]*위/u',
        '/떡[\s\W_]*(치|침)/u',
        '/질[\s\W_]*싸/u',
        '/입[\s\W_]*싸/u',
        '/노[\s\W_]*콘/u'
    ];

    $allWords = array_merge($badWords, $adultWords);

    foreach($allWords as $word){
        $safeWord = preg_quote($word, '/');
        $text = preg_replace('/' . $safeWord . '/iu', '***', $text);
    }

    foreach($patterns as $pattern){
        $text = preg_replace($pattern, '***', $text);
    }

    return $text;
}

/* 채팅 저장 */
if(isset($_POST['action']) && $_POST['action'] === 'send'){
    $nickname = trim($_POST['nickname'] ?? '');
    $message = trim($_POST['message'] ?? '');
    $long_message = trim($_POST['long_message'] ?? '');

    $nickname = filterBadWords($nickname);
    $message = filterBadWords($message);
    $long_message = filterBadWords($long_message);

    if($nickname === ''){
        $nickname = '익명';
    }

    if($message !== ''){
        $user_color = getUserColor($nickname);
        $ip_hash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');

        $sql = "INSERT INTO memo_chat (nickname, message, long_message, user_color, ip_hash, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())";

        $stmt = mysqli_prepare($db, $sql);
        mysqli_stmt_bind_param($stmt, "sssss", $nickname, $message, $long_message, $user_color, $ip_hash);
        mysqli_stmt_execute($stmt);
    }

    echo "ok";
    exit;
}

/* 메모 동의 / 취소 */
if(isset($_POST['action']) && $_POST['action'] === 'agree_memo'){
    $memo_id = (int)($_POST['memo_id'] ?? 0);
    $nickname = trim($_POST['nickname'] ?? '');

    $nickname = filterBadWords($nickname);

    if($nickname === ''){
        echo "no_nickname";
        exit;
    }

    if($memo_id > 0){
        $check_sql = "SELECT id FROM memo_agree WHERE memo_id = ? AND nickname = ?";
        $check_stmt = mysqli_prepare($db, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "is", $memo_id, $nickname);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);

        if(mysqli_num_rows($check_result) > 0){
            $delete_sql = "DELETE FROM memo_agree WHERE memo_id = ? AND nickname = ?";
            $delete_stmt = mysqli_prepare($db, $delete_sql);
            mysqli_stmt_bind_param($delete_stmt, "is", $memo_id, $nickname);
            mysqli_stmt_execute($delete_stmt);

            echo "canceled";
            exit;
        }

        $insert_sql = "INSERT INTO memo_agree (memo_id, nickname) VALUES (?, ?)";
        $insert_stmt = mysqli_prepare($db, $insert_sql);
        mysqli_stmt_bind_param($insert_stmt, "is", $memo_id, $nickname);
        mysqli_stmt_execute($insert_stmt);

        echo "ok";
    } else {
        echo "fail";
    }

    exit;
}

/* 메모 글로벌 핀 */
if(isset($_POST['action']) && $_POST['action'] === 'toggle_pin'){
    $memo_id = (int)($_POST['memo_id'] ?? 0);

    if($memo_id > 0){
        $check_sql = "SELECT is_pinned FROM memo_chat WHERE id = ?";
        $check_stmt = mysqli_prepare($db, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "i", $memo_id);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);
        $row = mysqli_fetch_assoc($check_result);

        if($row){
            $next = ((int)$row['is_pinned'] === 1) ? 0 : 1;

            $sql = "UPDATE memo_chat SET is_pinned = ? WHERE id = ?";
            $stmt = mysqli_prepare($db, $sql);
            mysqli_stmt_bind_param($stmt, "ii", $next, $memo_id);
            mysqli_stmt_execute($stmt);

            echo $next;
        } else {
            echo "fail";
        }
    } else {
        echo "fail";
    }

    exit;
}

/* 메모 삭제 */
if(isset($_POST['action']) && $_POST['action'] === 'delete_memo'){
    $memo_id = (int)($_POST['memo_id'] ?? 0);
    $delete_word = trim($_POST['delete_word'] ?? '');

    if($memo_id > 0 && $delete_word === '삭제'){
        $sql = "UPDATE memo_chat SET is_deleted = 1 WHERE id = ?";
        $stmt = mysqli_prepare($db, $sql);
        mysqli_stmt_bind_param($stmt, "i", $memo_id);
        mysqli_stmt_execute($stmt);

        echo "deleted";
    } else {
        echo "fail";
    }

    exit;
}

/* 댓글 / 대댓글 저장 */
if(isset($_POST['action']) && $_POST['action'] === 'add_comment'){
    $memo_id = (int)($_POST['memo_id'] ?? 0);
    $parent_id = (int)($_POST['parent_id'] ?? 0);
    $nickname = trim($_POST['nickname'] ?? '');
    $cmt = trim($_POST['cmt'] ?? '');

    $nickname = filterBadWords($nickname);
    $cmt = filterBadWords($cmt);

    if($nickname === ''){
        $nickname = '익명';
    }

    if($memo_id > 0 && $cmt !== ''){
        $sql = "INSERT INTO memo_comment (memo_id, parent_id, nickname, cmt, created_at)
                VALUES (?, ?, ?, ?, NOW())";

        $stmt = mysqli_prepare($db, $sql);
        mysqli_stmt_bind_param($stmt, "iiss", $memo_id, $parent_id, $nickname, $cmt);
        mysqli_stmt_execute($stmt);

        echo "ok";
    } else {
        echo "fail";
    }

    exit;
}

/* 댓글 / 대댓글 삭제 */
if(isset($_POST['action']) && $_POST['action'] === 'delete_comment'){
    $comment_id = (int)($_POST['comment_id'] ?? 0);
    $delete_word = trim($_POST['delete_word'] ?? '');

    if($comment_id > 0 && $delete_word === '삭제'){
        $check_sql = "SELECT parent_id FROM memo_comment WHERE id = ?";
        $check_stmt = mysqli_prepare($db, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "i", $comment_id);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);
        $comment = mysqli_fetch_assoc($check_result);

        if($comment){
            if((int)$comment['parent_id'] === 0){
                $sql = "UPDATE memo_comment
                        SET is_deleted = 1
                        WHERE id = ? OR parent_id = ?";
                $stmt = mysqli_prepare($db, $sql);
                mysqli_stmt_bind_param($stmt, "ii", $comment_id, $comment_id);
                mysqli_stmt_execute($stmt);
            } else {
                $sql = "UPDATE memo_comment
                        SET is_deleted = 1
                        WHERE id = ?";
                $stmt = mysqli_prepare($db, $sql);
                mysqli_stmt_bind_param($stmt, "i", $comment_id);
                mysqli_stmt_execute($stmt);
            }

            echo "deleted";
        } else {
            echo "fail";
        }
    } else {
        echo "fail";
    }

    exit;
}

/* 채팅 목록 불러오기 */
if(isset($_GET['action']) && $_GET['action'] === 'list'){
        $sql = "SELECT id, nickname, message, long_message, user_color, created_at, agree_count, is_pinned
        FROM memo_chat
        WHERE is_deleted = 0
        ORDER BY is_pinned DESC, id DESC
        LIMIT 80";

    $result = mysqli_query($db, $sql);

    while($row = mysqli_fetch_assoc($result)){
        $id = (int)$row['id'];
        $nickname = cleanText($row['nickname']);
        $message = nl2br(cleanText($row['message']));
        $long_message_raw = trim($row['long_message'] ?? '');
        $long_message = cleanText($long_message_raw);
        $has_long = $long_message_raw !== '';
        $user_color = cleanText($row['user_color']);
        $created_at = cleanText($row['created_at']);
        $is_pinned = (int)$row['is_pinned'];
        $pin_class = $is_pinned === 1 ? " is-pinned" : "";
        $pin_text = $is_pinned === 1 ? "📌 모두의 안건" : "📌";
        $pin_style = $is_pinned === 1
            ? "border:4px solid #ffda33; box-shadow:7px 7px 0 rgba(252, 255, 75, 0.45);"
            : "";

        $agree_stars = "";

        $agree_sql = "SELECT nickname FROM memo_agree WHERE memo_id = ? ORDER BY id ASC";
        $agree_stmt = mysqli_prepare($db, $agree_sql);
        mysqli_stmt_bind_param($agree_stmt, "i", $id);
        mysqli_stmt_execute($agree_stmt);
        $agree_result = mysqli_stmt_get_result($agree_stmt);

        while($agree = mysqli_fetch_assoc($agree_result)){
            $agree_name = cleanText($agree['nickname']);
            $agree_stars .= "<span class='agree-star' data-name='{$agree_name}'>⭐</span>";
        }

        $long_button = "";
        $long_panel = "";

        if($has_long){
            $long_button = "
            <button type='button' class='long-view-btn'>장문</button>
            ";

            $long_panel = "
            <div class='long-view-panel'>
                <div class='long-view-title'>공유한 장문 / 코드</div>
                <div class='long-view-content'>{$long_message}</div>
            </div>
            ";
        }

        /* 댓글 개수 */
        $count_sql = "SELECT COUNT(*) AS cnt
                    FROM memo_comment
                    WHERE memo_id = ? AND is_deleted = 0";
        $count_stmt = mysqli_prepare($db, $count_sql);
        mysqli_stmt_bind_param($count_stmt, "i", $id);
        mysqli_stmt_execute($count_stmt);
        $count_result = mysqli_stmt_get_result($count_stmt);
        $count_row = mysqli_fetch_assoc($count_result);
        $comment_count = (int)$count_row['cnt'];

        /* 댓글 목록 */
        $comment_html = "";

        $comment_sql = "SELECT id, nickname, cmt, created_at
                        FROM memo_comment
                        WHERE memo_id = ? AND parent_id = 0 AND is_deleted = 0
                        ORDER BY id DESC";
        $comment_stmt = mysqli_prepare($db, $comment_sql);
        mysqli_stmt_bind_param($comment_stmt, "i", $id);
        mysqli_stmt_execute($comment_stmt);
        $comment_result = mysqli_stmt_get_result($comment_stmt);

        while($comment = mysqli_fetch_assoc($comment_result)){
            $comment_id = (int)$comment['id'];
            $comment_nickname = cleanText($comment['nickname']);
            $comment_cmt = nl2br(cleanText($comment['cmt']));
            $comment_time = cleanText($comment['created_at']);

            $reply_html = "";

            $reply_sql = "SELECT id, nickname, cmt, created_at
                        FROM memo_comment
                        WHERE memo_id = ? AND parent_id = ? AND is_deleted = 0
                        ORDER BY id ASC";
            $reply_stmt = mysqli_prepare($db, $reply_sql);
            mysqli_stmt_bind_param($reply_stmt, "ii", $id, $comment_id);
            mysqli_stmt_execute($reply_stmt);
            $reply_result = mysqli_stmt_get_result($reply_stmt);

            while($reply = mysqli_fetch_assoc($reply_result)){
                $reply_id = (int)$reply['id'];
                $reply_nickname = cleanText($reply['nickname']);
                $reply_cmt = nl2br(cleanText($reply['cmt']));
                $reply_time = cleanText($reply['created_at']);

                $reply_html .= "
                <div class='reply-box'>
                    <strong>ㄴ {$reply_nickname}</strong>
                    <p>{$reply_cmt}</p>
                    <small>{$reply_time}</small>

                    <button type='button' class='comment-delete-open'>삭제</button>

                    <form class='comment-delete-form' data-comment-id='{$reply_id}'>
                        <input type='text' class='comment-delete-word' placeholder='삭제 라고 입력'>
                        <div class='comment-form-buttons'>
                            <button type='submit'>삭제 확인</button>
                            <button type='button' class='comment-delete-cancel'>취소</button>
                        </div>
                    </form>
                </div>
                ";
            }

            $comment_html .= "
            <div class='comment-box'>
                <div class='comment-main'>
                    <strong>{$comment_nickname}</strong>
                    <p>{$comment_cmt}</p>
                    <small>{$comment_time}</small>
                </div>

                <div class='comment-actions'>
                    <button type='button' class='reply-open-btn'>대댓글</button>
                    <button type='button' class='comment-delete-open'>삭제</button>
                </div>

                <form class='reply-form' data-memo-id='{$id}' data-parent-id='{$comment_id}'>
                    <input type='text' class='reply-nickname' placeholder='닉네임'>
                    <textarea class='reply-text' placeholder='대댓글 입력'></textarea>
                    <button type='submit'>대댓글 남기기</button>
                </form>

                <form class='comment-delete-form' data-comment-id='{$comment_id}'>
                    <input type='text' class='comment-delete-word' placeholder='삭제 라고 입력'>
                    <div class='comment-form-buttons'>
                        <button type='submit'>삭제 확인</button>
                        <button type='button' class='comment-delete-cancel'>취소</button>
                    </div>
                </form>

                <div class='reply-list'>
                    {$reply_html}
                </div>
            </div>
            ";
        }

        if($comment_html === ""){
            $comment_html = "<div class='no-comment'>아직 댓글이 없습니다.</div>";
        }

        echo "
        <div class='memo-card{$pin_class}' data-id='{$id}' style='background: {$user_color}; {$pin_style}'>
            <div class='memo-top'>
                <div class='memo-top-left'>
                    <button type='button' class='memo-pin-btn'>{$pin_text}</button>
                    <strong class='nickname'>{$nickname}</strong>
                </div>
                <span class='time'>{$created_at}</span>
            </div>

            <div class='memo-message'>{$message}</div>

            <div class='memo-bottom'>
                <div class='memo-action-row'>
                    <button type='button' class='memo-agree-btn'>동의하기</button>
                    <button type='button' class='comment-toggle-btn'>댓글 {$comment_count}</button>
                    {$long_button}
                    <button type='button' class='memo-delete-open'>삭제</button>
                    <button type='button' class='memo-check-btn'>접기</button>
                </div>

                <div class='agree-stars'>{$agree_stars}</div>
                
                {$long_panel}

                <form class='memo-delete-form' data-memo-id='{$id}'>
                    <input type='text' class='memo-delete-word' placeholder='[삭제] 라고 입력'>
                    <div class='comment-form-buttons'>
                        <button type='submit'>삭제 확인</button>
                        <button type='button' class='memo-delete-cancel'>취소</button>
                    </div>
                </form>

                <div class='memo-comment-panel'>
                    <form class='memo-comment-form' data-memo-id='{$id}'>
                        <input type='text' class='comment-nickname' placeholder='닉네임'>
                        <textarea class='comment-text' placeholder='댓글 입력'></textarea>
                        <button type='submit'>댓글 남기기</button>
                    </form>

                    <div class='memo-comment-list'>
                        {$comment_html}
                    </div>
                </div>
            </div>
        </div>
        ";
    }

    exit;
}
?>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>실시간 메모 채팅</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            list-style: none;
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            background: #f4f1e8;
            color: #222;
            font-family: Arial, sans-serif;
        }

        .app {
            width: 100%;
            max-width: 720px;
            margin: 0 auto;
            padding: 28px 18px 120px;
        }

        .header {
            margin-bottom: 28px;
        }

        .label {
            display: inline-block;
            margin-bottom: 10px;
            padding: 7px 12px;
            border: 2px solid #222;
            border-radius: 999px;
            background: white;
            font-size: 16px;
            font-weight: bold;
        }

        h1 {
            font-size: 48px;
            line-height: 1.1;
            letter-spacing: -2px;
            margin-bottom: 14px;
        }

        .subtitle {
            font-size: 22px;
            line-height: 1.4;
            color: #555;
            font-weight: bold;
        }

        .chat-panel {
            border: 3px solid #222;
            border-radius: 24px;
            background: #fffdf5;
            box-shadow: 8px 8px 0 #222;
            overflow: hidden;
        }

        .note-head {
            padding: 18px;
            border-bottom: 3px solid #222;
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .note-title {
            font-size: 28px;
            font-weight: 900;
        }

        .live-dot {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: bold;
            color: #ff4d4d;
        }

        .live-dot::before {
            content: "";
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ff4d4d;
            display: block;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.25; }
        }

        .write-area {
            padding: 18px;
            border-bottom: 3px solid #222;
            background: #fff7cc;
        }

        .input-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }

        input,
        textarea,
        button {
            font-family: inherit;
        }

        .nickname-input {
            width: 34%;
            padding: 14px;
            border: 3px solid #222;
            border-radius: 14px;
            font-size: 22px;
            font-weight: bold;
            background: white;
        }

        .message-input {
            width: 66%;
            min-height: 68px;
            padding: 14px;
            border: 3px solid #222;
            border-radius: 14px;
            font-size: 22px;
            font-weight: bold;
            resize: none;
            background: white;
        }

        .send-btn {
            width: 100%;
            padding: 18px;
            border: 3px solid #222;
            border-radius: 16px;
            background: #222;
            color: white;
            font-size: 24px;
            font-weight: 900;
            cursor: pointer;
        }

        .send-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 0 #000;
        }

        .chat-list {
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background:
                linear-gradient(#e9e3d0 1px, transparent 1px);
            background-size: 100% 42px;
        }

        .memo-card {
            padding: 18px;
            border: 3px solid #222;
            border-radius: 18px;
            box-shadow: 5px 5px 0 rgba(0,0,0,0.85);
        }

        .write-buttons {
            display: flex;
            gap: 10px;
        }

        .send-btn {
            flex: 1;
            width: auto;
        }

        .long-toggle-btn {
            width: 110px;
            padding: 18px;
            border: 3px solid #222;
            border-radius: 16px;
            background: #fff;
            color: #222;
            font-size: 24px;
            font-weight: 900;
            cursor: pointer;
        }

        .long-toggle-btn.is-open {
            background: #222;
            color: #fff;
        }

        .long-write-panel {
            display: none;
            margin-bottom: 10px;
        }

        .long-write-panel.is-open {
            display: block;
        }

        .long-message-input {
            width: 100%;
            min-height: 240px;
            padding: 16px;
            border: 3px solid #222;
            border-radius: 16px;
            background: #fff;
            font-size: 18px;
            line-height: 1.5;
            font-family: Consolas, Monaco, monospace;
            resize: vertical;
        }

        .long-view-btn {
            padding: 8px 14px;
            border: 2px solid #222;
            border-radius: 999px;
            background: rgba(255,255,255,0.75);
            color: #222;
            font-size: 15px;
            font-weight: 900;
            cursor: pointer;
        }

        .memo-bottom {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
        }

        .long-view-btn {
            align-self: flex-end;
        }

        .long-view-panel {
            display: none;
            width: 100%;
            margin-top: 0;
            padding: 16px;
            border: 2px solid #222;
            border-radius: 14px;
            background: rgba(255,255,255,0.86);
        }

        .memo-card.is-long-open .long-view-panel {
            display: block;
        }

        .long-view-title {
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: 900;
        }

        .long-view-content {
            max-height: 480px;
            overflow: auto;
            padding: 14px;
            border: 2px dashed rgba(0,0,0,0.35);
            border-radius: 12px;
            background: #fffdf5;
            font-family: Consolas, Monaco, monospace;
            font-size: 10px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .memo-action-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .memo-pin-btn,
        .memo-check-btn,
        .comment-toggle-btn,
        .memo-delete-open,
        .reply-open-btn,
        .comment-delete-open,
        .memo-comment-form button,
        .reply-form button,
        .memo-delete-form button,
        .comment-delete-form button {
            padding: 7px 12px;
            border: 2px solid #222;
            border-radius: 999px;
            background: rgba(255,255,255,0.75);
            color: #222;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
        }

        .memo-card.is-checked {
            opacity: 0.68;
            padding: 12px 16px;
        }

        .memo-card.is-checked:not(.is-preview-open) {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 10px;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-top {
            display: contents;
        }

        .memo-card.is-checked:not(.is-preview-open) .nickname {
            font-size: 14px;
            white-space: nowrap;
        }

        .memo-card.is-checked:not(.is-preview-open) .time {
            display: none;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-message {
            margin-top: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-bottom {
            margin-top: 0;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-action-row {
            justify-content: flex-end;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-message {
            margin-top: 0;
            max-height: 1.4em;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0.85;
        }

        .memo-card.is-checked:not(.is-preview-open) .long-view-panel,
        .memo-card.is-checked:not(.is-preview-open) .memo-delete-form,
        .memo-card.is-checked:not(.is-preview-open) .memo-comment-panel,
        .memo-card.is-checked:not(.is-preview-open) .agree-stars {
            display: none !important;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-bottom {
            display: flex;
        }

        .memo-card.is-checked:not(.is-preview-open) .memo-action-row {
            justify-content: flex-end;
        }

        .memo-card.is-checked:not(.is-preview-open) .long-view-btn,
        .memo-card.is-checked:not(.is-preview-open) .comment-toggle-btn,
        .memo-card.is-checked:not(.is-preview-open) .memo-delete-open {
            display: none;
        }

        .memo-card.is-checked.is-preview-open {
            opacity: 1;
        }

        .memo-card.is-checked.is-preview-open .memo-message {
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
        }

        .memo-check-btn.is-checked {
            background: #222;
            color: #fff;
        }        

        .memo-comment-panel,
        .memo-delete-form,
        .reply-form,
        .comment-delete-form {
            display: none;
        }

        .memo-card.is-comment-open .memo-comment-panel {
            display: block;
        }

        .memo-delete-form.is-open,
        .reply-form.is-open,
        .comment-delete-form.is-open {
            display: block;
        }

        .memo-comment-panel {
            width: 100%;
            margin-top: 10px;
            padding: 14px;
            border: 2px solid #222;
            border-radius: 14px;
            background: rgba(255,255,255,0.75);
        }

        .memo-comment-form,
        .reply-form,
        .memo-delete-form,
        .comment-delete-form {
            margin-top: 10px;
            padding: 12px;
            border: 2px dashed rgba(0,0,0,0.35);
            border-radius: 12px;
            background: rgba(255,255,255,0.55);
        }

        .memo-comment-form input,
        .memo-comment-form textarea,
        .reply-form input,
        .reply-form textarea,
        .memo-delete-form input,
        .comment-delete-form input {
            width: 100%;
            margin-bottom: 8px;
            padding: 10px;
            border: 2px solid #222;
            border-radius: 10px;
            background: white;
            font-size: 15px;
            font-weight: 700;
        }

        .memo-comment-form textarea,
        .reply-form textarea {
            min-height: 70px;
            resize: vertical;
        }

        .memo-comment-list {
            margin-top: 12px;
        }

        .comment-box {
            padding: 12px;
            margin-top: 10px;
            border: 2px solid rgba(0,0,0,0.25);
            border-radius: 12px;
            background: rgba(255,255,255,0.7);
        }

        .comment-main strong,
        .reply-box strong {
            display: inline-block;
            margin-bottom: 6px;
            font-size: 15px;
            font-weight: 900;
        }

        .comment-main p,
        .reply-box p {
            margin: 4px 0;
            font-size: 15px;
            line-height: 1.45;
            word-break: break-word;
        }

        .comment-main small,
        .reply-box small {
            display: block;
            margin-top: 6px;
            opacity: 0.6;
            font-size: 12px;
            font-weight: 700;
        }

        .comment-actions {
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            margin-top: 8px;
        }

        .reply-list {
            margin-top: 10px;
        }

        .reply-box {
            margin-top: 8px;
            margin-left: 18px;
            padding: 10px;
            border-left: 4px solid #222;
            border-radius: 10px;
            background: rgba(255,255,255,0.85);
        }

        .no-comment {
            padding: 14px;
            text-align: center;
            color: #777;
            font-size: 14px;
            font-weight: 800;
        }

        .comment-form-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .memo-card {
            position: relative;
        }

        .memo-agree-btn {
            padding: 7px 12px;
            border: 2px solid #222;
            border-radius: 999px;
            background: rgba(255,255,255,0.75);
            color: #222;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
        }

        .memo-action-row .memo-agree-btn {
            margin-right: auto;
        }

        .memo-agree-btn.is-agreed {
            background: #222;
            color: white;
        }

        .agree-stars {
            margin-top: 8px;
            min-height: 20px;
            text-align: left;
            font-size: 18px;
            letter-spacing: 2px;
        }

        .agree-star {
            position: relative;
            display: inline-block;
            cursor: pointer;
            margin-right: 4px;
        }

        .agree-star:hover::after {
            content: attr(data-name);
            position: absolute;
            left: 22px;
            top: -8px;
            background: #222;
            color: white;
            padding: 5px 8px;
            border-radius: 8px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 999;
        }

        @keyframes memoPop {
            from {
                opacity: 0;
                transform: translateY(-8px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .memo-top {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px dashed rgba(0,0,0,0.35);
        }

        .memo-top-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .memo-pin-btn {
            padding: 6px 10px;
            font-size: 13px;
        }

        .memo-card.is-pinned {
            border-color: #ffda33 !important;
            border-width: 4px !important;
            border-style: solid !important;
            box-shadow: 7px 7px 0 rgba(252, 255, 75, 0.45) !important;
        }

        .memo-pin-btn.is-pinned {
            background: #222;
            color: #fff;
        }
        .nickname {
            display: inline-block;
            padding: 6px 10px;
            border: 2px solid #222;
            border-radius: 999px;
            background: rgba(255,255,255,0.75);
            font-size: 22px;
            line-height: 1;
        }

        .time {
            font-size: 15px;
            font-weight: bold;
            opacity: 0.65;
            white-space: nowrap;
        }

        .memo-message {
            font-size: 18px;
            line-height: 1.35;
            font-weight: 900;
            letter-spacing: -1px;
            word-break: break-word;
        }

        .empty {
            padding: 30px;
            text-align: center;
            font-size: 26px;
            font-weight: bold;
            color: #888;
        }

        /* 최종 크기 최적화 */
        .app {
            max-width: 600px;
            padding: 22px 14px 90px;
        }

        .header {
            margin-bottom: 20px;
        }

        .label {
            padding: 5px 10px;
            font-size: 13px;
        }

        h1 {
            font-size: 36px;
            letter-spacing: -1.4px;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 16px;
            line-height: 1.45;
        }

        .chat-panel {
            border-width: 2px;
            border-radius: 20px;
            box-shadow: 5px 5px 0 #222;
        }

        .note-head {
            padding: 14px;
            border-bottom-width: 2px;
        }

        .note-title {
            font-size: 22px;
        }

        .live-dot {
            font-size: 13px;
        }

        .write-area {
            padding: 14px;
            border-bottom-width: 2px;
        }

        .input-row {
            gap: 8px;
            margin-bottom: 8px;
        }

        .nickname-input {
            padding: 11px;
            border-width: 2px;
            border-radius: 12px;
            font-size: 16px;
        }

        .message-input {
            min-height: 56px;
            padding: 11px;
            border-width: 2px;
            border-radius: 12px;
            font-size: 16px;
        }

        .write-buttons {
            gap: 8px;
        }

        .send-btn {
            padding: 8px;
            border-width: 2px;
            border-radius: 13px;
            font-size: 14px;
        }

        .long-toggle-btn {
            width: 86px;
            padding: 8px;
            border-width: 2px;
            border-radius: 13px;
            font-size: 14px;
        }

        .long-message-input {
            min-height: 180px;
            padding: 12px;
            border-width: 2px;
            border-radius: 13px;
            font-size: 12px;
            line-height: 1.5;
        }

        .chat-list {
            padding: 14px;
            gap: 12px;
        }

        .memo-card {
            padding: 14px;
            border-width: 2px;
            border-radius: 15px;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.85);
        }

        .memo-top {
            margin-bottom: 9px;
            padding-bottom: 8px;
            gap: 8px;
        }

        .nickname {
            padding: 5px 9px;
            border-width: 2px;
            font-size: 16px;
        }

        .time {
            font-size: 12px;
        }

        .memo-message {
            font-size: 13px;
            line-height: 1.5;
            letter-spacing: -0.2;
        }

        .memo-bottom {
            margin-top: 10px;
            gap: 8px;
        }

        .memo-pin-btn,
        .memo-check-btn,
        .comment-toggle-btn,
        .memo-delete-open,
        .reply-open-btn,
        .comment-delete-open,
        .memo-comment-form button,
        .reply-form button,
        .memo-delete-form button,
        .comment-delete-form button,
        .memo-agree-btn,
        .long-view-btn {
            padding: 6px 10px;
            border-width: 2px;
            font-size: 12px;
        }

        .agree-stars {
            font-size: 15px;
            margin-top: 4px;
        }

        .agree-stars:empty {
            display: none !important;
            margin: 0 !important;
            min-height: 0 !important;
        }

        .memo-comment-panel {
            padding: 11px;
            border-width: 2px;
            border-radius: 12px;
        }

        .memo-comment-form,
        .reply-form,
        .memo-delete-form,
        .comment-delete-form {
            padding: 10px;
            margin-top: 8px;
        }

        .memo-comment-form input,
        .memo-comment-form textarea,
        .reply-form input,
        .reply-form textarea,
        .memo-delete-form input,
        .comment-delete-form input {
            padding: 8px;
            border-width: 2px;
            border-radius: 9px;
            font-size: 13px;
        }

        .memo-comment-form textarea,
        .reply-form textarea {
            min-height: 56px;
        }

        .comment-box {
            padding: 10px;
            margin-top: 8px;
        }

        .comment-main strong,
        .reply-box strong {
            font-size: 13px;
        }

        .comment-main p,
        .reply-box p {
            font-size: 13px;
            line-height: 1.45;
        }

        .comment-main small,
        .reply-box small {
            font-size: 11px;
        }

        .reply-box {
            margin-left: 12px;
            padding: 8px;
        }

        .empty {
            padding: 24px;
            font-size: 20px;
        }

        /* 모바일 최종 최적화 */
        @media all and (max-width: 600px) {
            .app {
                padding: 16px 10px 90px;
            }

            h1 {
                font-size: 32px;
            }

            .subtitle {
                font-size: 15px;
            }

            .note-title {
                font-size: 20px;
            }

            .input-row {
                flex-direction: column;
            }

            .nickname-input,
            .message-input {
                width: 100%;
                font-size: 12px;
            }

            .memo-top {
                flex-direction: column;
                align-items: flex-start;
            }

            .time {
                font-size: 12px;
            }

            .memo-message {
                font-size: 13px;
            }

            .write-buttons {
                flex-direction: column;
            }

            .long-toggle-btn {
                width: 100%;
            }

            .long-message-input {
                min-height: 150px;
                font-size: 13px;
            }

            .memo-action-row {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
                width: 100%;
            }

            .memo-action-row .memo-agree-btn {
                flex: 1 1 calc(66.666% - 7px);
                margin-right: 0;
            }

            .memo-action-row .comment-toggle-btn {
                flex: 1 1 calc(33.333% - 7px);
            }

            .memo-action-row .long-view-btn,
            .memo-action-row .memo-delete-open,
            .memo-action-row .memo-check-btn {
                flex: 1 1 calc(33.333% - 7px);
            }

            .memo-action-row button {
                min-height: 34px;
                padding: 7px 8px;
                font-size: 12px;
                white-space: nowrap;
            }

            .memo-delete-open {
                opacity: 0.55;
                background: rgba(255,255,255,0.45);
            }

            .agree-stars {
                margin-top: 3px;
                font-size: 13px;
                min-height: 0;
            }
        }

    </style>
</head>

<body>
    <div class="app">
        <header class="header">
            <span class="label">MEMO CHAT</span>
            <h1>실시간 메모 채팅</h1>
            <p class="subtitle">최신 메모가 가장 위에 올라옵니다.<br> '장문' 기능으로 코딩을 공유해 보세요!</p>
        </header>

        <main class="chat-panel">
            <div class="note-head">
                <div class="note-title">오늘의 메모</div>
                <div class="live-dot">LIVE</div>
            </div>

            <form class="write-area" id="chatForm">
                <div class="input-row">
                    <input
                        type="text"
                        id="nickname"
                        class="nickname-input"
                        placeholder="닉네임"
                        maxlength="20"
                    >

                    <textarea
                        id="message"
                        class="message-input"
                        placeholder="요약 메모 / 질문을 입력하세요"
                        maxlength="500"
                    ></textarea>
                </div>

                <div class="long-write-panel" id="longWritePanel">
                    <textarea
                        id="longMessage"
                        class="long-message-input"
                        placeholder="장문 설명이나 코드를 입력하세요.&#10;&#10;예) 오류 코드, 풀이 과정, 참고 코드, 질문 상세 내용"
                    ></textarea>
                </div>

                <div class="write-buttons">
                    <button type="submit" class="send-btn">메모 남기기</button>
                    <button type="button" class="long-toggle-btn" id="longToggleBtn">장문</button>
                </div>
            </form>

            <section id="chatList" class="chat-list">
                <div class="empty">메모를 불러오는 중...</div>
            </section>
        </main>
    </div>

    <script>
        const form = document.getElementById('chatForm');
        const nicknameInput = document.getElementById('nickname');
        const messageInput = document.getElementById('message');
        const chatList = document.getElementById('chatList');

        const longToggleBtn = document.getElementById('longToggleBtn');
        const longWritePanel = document.getElementById('longWritePanel');
        const longMessageInput = document.getElementById('longMessage');

        const savedNickname = localStorage.getItem('memo_chat_nickname');

        longToggleBtn.addEventListener('click', function(){
            longWritePanel.classList.toggle('is-open');
            longToggleBtn.classList.toggle('is-open');
        });

        if(savedNickname){
            nicknameInput.value = savedNickname;
        }

        let lastChatHTML = '';

        function loadChats(){
            fetch('memo_chat.php?action=list')
                .then(response => response.text())
                .then(html => {
                    const nextHTML = html.trim() === ''
                        ? '<div class="empty">아직 메모가 없습니다.</div>'
                        : html;

                    if(nextHTML !== lastChatHTML){
                        chatList.innerHTML = nextHTML;
                        lastChatHTML = nextHTML;

                        fillCommentNicknames();
                        applyCheckedMemos();
                        applyAgreeButtons();
                    }
                });
        }

        function fillCommentNicknames(){
            const savedNickname = localStorage.getItem('memo_chat_nickname');

            if(!savedNickname) return;

            document.querySelectorAll('.comment-nickname, .reply-nickname').forEach(function(input){
                if(input.value.trim() === ''){
                    input.value = savedNickname;
                }
            });
        }

        function getCheckedMemoIds(){
            return JSON.parse(localStorage.getItem('memo_checked_ids') || '[]');
        }

        function saveCheckedMemoIds(ids){
            localStorage.setItem('memo_checked_ids', JSON.stringify(ids));
        }

        function applyCheckedMemos(){
            const checkedIds = getCheckedMemoIds();

            document.querySelectorAll('.memo-card').forEach(function(card){
                const memoId = card.dataset.id;
                const checkBtn = card.querySelector('.memo-check-btn');

                if(!checkBtn) return;

                if(checkedIds.includes(memoId)){
                    card.classList.add('is-checked');
                    checkBtn.classList.add('is-checked');
                    checkBtn.textContent = '펼치기';
                } else {
                    card.classList.remove('is-checked');
                    card.classList.remove('is-preview-open');
                    checkBtn.classList.remove('is-checked');
                    checkBtn.textContent = '접기';
                }
            });
        }
        
        form.addEventListener('submit', function(e){
            e.preventDefault();

            const nickname = nicknameInput.value.trim();
            const message = messageInput.value.trim();
            const longMessage = longMessageInput.value.trim();

            if(message === ''){
                alert('메모 내용을 입력하세요.');
                return;
            }

            localStorage.setItem('memo_chat_nickname', nickname);

            const body = new URLSearchParams();
            body.append('action', 'send');
            body.append('nickname', nickname);
            body.append('message', message);
            body.append('long_message', longMessage);

            fetch('memo_chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            })
            .then(response => response.text())
            .then(() => {
                messageInput.value = '';
                longMessageInput.value = '';

                longWritePanel.classList.remove('is-open');
                longToggleBtn.classList.remove('is-open');

                loadChats();
            });
        });

        loadChats();

        setInterval(loadChats, 1500);

        chatList.addEventListener('click', function(e){
            const agreeBtn = e.target.closest('.memo-agree-btn');

            if(agreeBtn){
                const card = agreeBtn.closest('.memo-card');
                const memoId = card.dataset.id;

                const nickname = localStorage.getItem('memo_chat_nickname') || nicknameInput.value.trim();

                if(nickname === ''){
                    alert('닉네임을 먼저 입력하세요.');
                    return;
                }

                localStorage.setItem('memo_chat_nickname', nickname);

                const stars = card.querySelector('.agree-stars');
                let alreadyAgreed = false;

                stars.querySelectorAll('.agree-star').forEach(function(star){
                    if(star.dataset.name === nickname){
                        alreadyAgreed = true;
                    }
                });

                if(alreadyAgreed){
                    const ok = confirm('이미 동의했습니다. 동의를 취소하겠습니까?');

                    if(!ok){
                        return;
                    }
                }

                const body = new URLSearchParams();
                body.append('action', 'agree_memo');
                body.append('memo_id', memoId);
                body.append('nickname', nickname);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(result => {
                    if(result === 'canceled'){
                        agreeBtn.classList.remove('is-agreed');
                        agreeBtn.textContent = '동의하기';

                        stars.querySelectorAll('.agree-star').forEach(function(star){
                            if(star.dataset.name === nickname){
                                star.remove();
                            }
                        });

                        loadChats();
                        return;
                    }

                    if(result === 'ok'){
                        agreeBtn.classList.add('is-agreed');
                        agreeBtn.textContent = '동의 했어요!';

                        stars.innerHTML += `<span class="agree-star" data-name="${nickname}">⭐</span>`;

                        loadChats();
                    }
                });

                return;
            }

            const pinBtn = e.target.closest('.memo-pin-btn');

            if(pinBtn){
                const card = pinBtn.closest('.memo-card');
                const memoId = card.dataset.id;

                const body = new URLSearchParams();
                body.append('action', 'toggle_pin');
                body.append('memo_id', memoId);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(result => {
                    loadChats();
                });

                return;
            }

            const checkBtn = e.target.closest('.memo-check-btn');

            if(checkBtn){
                const card = checkBtn.closest('.memo-card');
                const memoId = card.dataset.id;

                let checkedIds = getCheckedMemoIds();

                if(checkedIds.includes(memoId)){
                    checkedIds = checkedIds.filter(function(id){
                        return id !== memoId;
                    });

                    card.classList.remove('is-checked');
                    card.classList.remove('is-preview-open');
                    checkBtn.classList.remove('is-checked');
                    checkBtn.textContent = '접기';
                } else {
                    checkedIds.push(memoId);

                    card.classList.add('is-checked');
                    card.classList.remove('is-preview-open');
                    checkBtn.classList.add('is-checked');
                    checkBtn.textContent = '펼치기';
                }

                saveCheckedMemoIds(checkedIds);
                return;
            }

            const checkedCard = e.target.closest('.memo-card.is-checked');

            if(checkedCard && !e.target.closest('button, input, textarea, form')){
                checkedCard.classList.toggle('is-preview-open');
                return;
            }

            const longBtn = e.target.closest('.long-view-btn');
            if(longBtn){
                const card = longBtn.closest('.memo-card');
                if(card) card.classList.toggle('is-long-open');
                return;
            }

            const commentToggleBtn = e.target.closest('.comment-toggle-btn');
            if(commentToggleBtn){
                const card = commentToggleBtn.closest('.memo-card');
                if(card) card.classList.toggle('is-comment-open');
                return;
            }

            const memoDeleteOpen = e.target.closest('.memo-delete-open');
            if(memoDeleteOpen){
                const card = memoDeleteOpen.closest('.memo-card');
                const form = card.querySelector('.memo-delete-form');
                if(form) form.classList.add('is-open');
                return;
            }

            const memoDeleteCancel = e.target.closest('.memo-delete-cancel');
            if(memoDeleteCancel){
                const form = memoDeleteCancel.closest('.memo-delete-form');
                if(form) form.classList.remove('is-open');
                return;
            }

            const replyOpenBtn = e.target.closest('.reply-open-btn');
            if(replyOpenBtn){
                const box = replyOpenBtn.closest('.comment-box');
                const form = box.querySelector('.reply-form');
                if(form) form.classList.toggle('is-open');
                return;
            }

            const commentDeleteOpen = e.target.closest('.comment-delete-open');
            if(commentDeleteOpen){
                const parent = commentDeleteOpen.closest('.comment-box, .reply-box');
                const form = parent.querySelector('.comment-delete-form');
                if(form) form.classList.add('is-open');
                return;
            }

            const commentDeleteCancel = e.target.closest('.comment-delete-cancel');
            if(commentDeleteCancel){
                const form = commentDeleteCancel.closest('.comment-delete-form');
                if(form) form.classList.remove('is-open');
                return;
            }
        });

        chatList.addEventListener('submit', function(e){
            const commentForm = e.target.closest('.memo-comment-form');
            if(commentForm){
                e.preventDefault();

                const memoId = commentForm.dataset.memoId;
                const nickname = commentForm.querySelector('.comment-nickname').value.trim();
                const cmt = commentForm.querySelector('.comment-text').value.trim();

                localStorage.setItem('memo_chat_nickname', nickname);

                if(cmt === ''){
                    alert('댓글 내용을 입력하세요.');
                    return;
                }

                const body = new URLSearchParams();
                body.append('action', 'add_comment');
                body.append('memo_id', memoId);
                body.append('parent_id', 0);
                body.append('nickname', nickname);
                body.append('cmt', cmt);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(() => {
                    loadChats();
                });

                return;
            }

            const replyForm = e.target.closest('.reply-form');
            if(replyForm){
                e.preventDefault();

                const memoId = replyForm.dataset.memoId;
                const parentId = replyForm.dataset.parentId;
                const nickname = replyForm.querySelector('.reply-nickname').value.trim();
                const cmt = replyForm.querySelector('.reply-text').value.trim();

                localStorage.setItem('memo_chat_nickname', nickname);
                
                if(cmt === ''){
                    alert('대댓글 내용을 입력하세요.');
                    return;
                }

                const body = new URLSearchParams();
                body.append('action', 'add_comment');
                body.append('memo_id', memoId);
                body.append('parent_id', parentId);
                body.append('nickname', nickname);
                body.append('cmt', cmt);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(() => {
                    loadChats();
                });

                return;
            }

            const memoDeleteForm = e.target.closest('.memo-delete-form');
            if(memoDeleteForm){
                e.preventDefault();

                const memoId = memoDeleteForm.dataset.memoId;
                const deleteWord = memoDeleteForm.querySelector('.memo-delete-word').value.trim();

                if(deleteWord !== '삭제'){
                    alert('"삭제"라고 정확히 입력해야 합니다.');
                    return;
                }

                const body = new URLSearchParams();
                body.append('action', 'delete_memo');
                body.append('memo_id', memoId);
                body.append('delete_word', deleteWord);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(() => {
                    loadChats();
                });

                return;
            }

            const commentDeleteForm = e.target.closest('.comment-delete-form');
            if(commentDeleteForm){
                e.preventDefault();

                const commentId = commentDeleteForm.dataset.commentId;
                const deleteWord = commentDeleteForm.querySelector('.comment-delete-word').value.trim();

                if(deleteWord !== '삭제'){
                    alert('"삭제"라고 정확히 입력해야 합니다.');
                    return;
                }

                const body = new URLSearchParams();
                body.append('action', 'delete_comment');
                body.append('comment_id', commentId);
                body.append('delete_word', deleteWord);

                fetch('memo_chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                })
                .then(response => response.text())
                .then(() => {
                    loadChats();
                });

                return;
            }
        });

        function applyAgreeButtons(){
            const nickname = localStorage.getItem('memo_chat_nickname') || nicknameInput.value.trim();

            document.querySelectorAll('.memo-card').forEach(function(card){
                const btn = card.querySelector('.memo-agree-btn');
                const stars = card.querySelector('.agree-stars');

                if(!btn || !stars || nickname === '') return;

                let alreadyAgreed = false;

                stars.querySelectorAll('.agree-star').forEach(function(star){
                    if(star.dataset.name === nickname){
                        alreadyAgreed = true;
                    }
                });

                if(alreadyAgreed){
                    btn.classList.add('is-agreed');
                    btn.textContent = '동의 했어요!';
                } else {
                    btn.classList.remove('is-agreed');
                    btn.textContent = '동의하기';
                }
            });
        }
    </script>

    <!-- 페이지 하단에 여유 공간 만들어두기 -->
    <div style="width: 100%; height: 400px;"></div>
    
</body>
</html>