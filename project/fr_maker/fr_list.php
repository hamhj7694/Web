<?php
header("Content-Type:text/html; charset=utf-8");

$db = mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');
mysqli_query($db, "set names utf8");

if(isset($_POST['comment_submit'])){
    $fr_no = $_POST['fr_no'];
    $nickname = $_POST['nickname'];
    $cmt = $_POST['cmt'];
    $parent_no = isset($_POST['parent_no']) ? $_POST['parent_no'] : 0;

    $sql = "INSERT INTO comment(nickname, cmt, `now`, fr_no, parent_no)
            VALUES('$nickname', '$cmt', NOW(), '$fr_no', '$parent_no')";
    mysqli_query($db, $sql);

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['comment_delete_submit'])){
    $comment_no = $_POST['comment_no'];
    $delete_word = $_POST['delete_word'];

    if($delete_word == '댓글 삭제'){
        $sql = "DELETE FROM comment WHERE no='$comment_no' OR parent_no='$comment_no'";
        mysqli_query($db, $sql);
    }

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['reply_delete_submit'])){
    $reply_no = $_POST['reply_no'];
    $delete_word = $_POST['delete_word'];

    if($delete_word == '댓글 삭제'){
        $sql = "DELETE FROM comment WHERE no='$reply_no' AND parent_no != 0";
        mysqli_query($db, $sql);
    }

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['heart_ajax'])){
    $fr_no = $_POST['fr_no'];

    $sql = "UPDATE fr_maker SET harts = harts + 1 WHERE no = '$fr_no'";
    mysqli_query($db, $sql);

    $result = mysqli_query($db, "SELECT harts FROM fr_maker WHERE no = '$fr_no'");
    $row = mysqli_fetch_array($result, MYSQLI_ASSOC);

    echo $row['harts'];
    exit;
}

if(isset($_POST['delete_submit'])){
    $fr_no = $_POST['fr_no'];
    $phone = $_POST['phone'];

    $sql = "DELETE FROM fr_maker WHERE no='$fr_no' AND phone='$phone'";
    mysqli_query($db, $sql);

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['edit_submit'])){

    $fr_no = $_POST['fr_no'];
    $phone = $_POST['phone'];
    $msg2 = $_POST['msg2'];
    $age = $_POST['age'];

    $sql = "SELECT * FROM fr_maker
            WHERE no='$fr_no'
            AND phone='$phone'";

    $result = mysqli_query($db,$sql);

    if(mysqli_num_rows($result)>0){

        if(isset($_FILES['img1']) &&
           $_FILES['img1']['error']==0){

            $upload_dir = "upload/";

            $file_name =
                time()."_".$_FILES['img1']['name'];

            $file_path =
                $upload_dir.$file_name;

            move_uploaded_file(
                $_FILES['img1']['tmp_name'],
                $file_path
            );

            $update_sql = "
            UPDATE fr_maker
            SET
                msg2='$msg2',
                age='$age',
                file_path='$file_path'
            WHERE
                no='$fr_no'
                AND phone='$phone'
            ";

        }else{

            $update_sql = "
            UPDATE fr_maker
            SET
                msg2='$msg2',
                age='$age'
            WHERE
                no='$fr_no'
                AND phone='$phone'
            ";

        }

        mysqli_query($db,$update_sql);

    }

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

echo "<head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>구조 대기 명단</title>
    </head>";

$data = "SELECT * FROM fr_maker ORDER BY no DESC";
$result_table = mysqli_query($db, $data);

if($result_table){

echo "<style>
    body {
        margin: 0;
        padding: 40px;
        background: linear-gradient(135deg, #fff1f5, #ffe4ec);
        font-family: Arial, sans-serif;
        color: #333;
    }

    .container {
        max-width: 760px;
        margin: 0 auto;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    #title {
        color: rgb(255, 105, 130);
        font-size: 50px;
        margin: 0;
    }

    .subtitle {
        display: inline-block;
    }

    #r_msg {
        margin-left: auto;
        margin-top: 30px;
    }

    #r_msg input {
        padding: 14px 28px;
        border: 2px solid white;
        border-radius: 999px;
        background: #ff6f91;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: 0.2s;
    }

    #r_msg input:hover {
        background: #ff4f7e;
        transform: translateY(-1px);
    }

    .view-switch {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 18px 0 20px;
    }

    .view-switch button {
        padding: 9px 18px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .view-switch button.active {
        background: #ff6f91;
        color: white;
    }

    .friend-card {
        background: white;
        border: 3px solid #ff9aad;
        border-radius: 24px;
        padding: 24px;
        margin: 20px 0;
        box-shadow: 0 12px 30px rgba(255, 128, 160, 0.2);
    }

    .friend-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
    }

    .friend-text {
        flex: 1;
    }

    .friend-photo {
        width: 170px;
        flex-shrink: 0;
        text-align: right;
    }

    .friend-card img {
        width: 160px;
        height: 200px;
        object-fit: cover;
        border-radius: 16px;
        border: 2px solid #ffd1dc;
        transition: transform 0.3s ease;
        cursor: zoom-in;
    }

    .friend-card img:hover {
        transform: scale(2.5);
        transform-origin: center center;
        border: 5px solid #ff9aad;
        box-shadow: 0 0 50px rgba(0,0,0,0.4);
        z-index: 9999;
        position: relative;
        background: white;
    }

    .no-photo {
        width: 160px;
        height: 200px;
        border: 2px dashed #ffd1dc;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #aaa;
    }

    .friend-name {
        margin: 0 0 18px;
        color: #222;
        font-size: 24px;
    }

    .friend-section-title {
        display: inline-block;
        margin: 0 0 10px;
        padding: 6px 12px;
        background: #fff1f5;
        color: #ff6f91;
        border-radius: 999px;
        font-size: 14px;
    }

    .friend-desc {
        margin: 0;
        padding: 16px;
        background: #fff8fa;
        border-left: 4px solid #ff9aad;
        border-radius: 12px;
        line-height: 1.6;
    }

    .comment-area {
        width: 100%;
        margin-top: 20px;
    }

    .bottom-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .action-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .heart-form {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
    }

    .heart-btn {
        width: 42px;
        height: 42px;
        padding: 0;
        border: 2px solid #ff9aad;
        border-radius: 50%;
        background: white;
        color: #ff6f91;
        font-size: 22px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .heart-btn:hover {
        background: #ff6f91;
        color: white;
    }

    .heart-count {
        color: #ff6f91;
        font-size: 18px;
        font-weight: bold;
    }

    .comment-toggle,
    .comment-view-toggle,
    .comment-form input[type='submit'],
    .delete-open-btn,
    .delete-form input[type='submit'],
    .delete-cancel-btn,
    .edit-open-btn,
    .edit-form input[type='submit'],
    .edit-cancel-btn,
    .reply-open-btn,
    .reply-form input[type='submit'] {
        padding: 8px 16px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .comment-toggle:hover,
    .comment-view-toggle:hover,
    .comment-form input[type='submit']:hover,
    .delete-open-btn:hover,
    .delete-form input[type='submit']:hover,
    .delete-cancel-btn:hover,
    .edit-open-btn:hover,
    .edit-form input[type='submit']:hover,
    .edit-cancel-btn:hover,
    .reply-open-btn:hover,
    .reply-form input[type='submit']:hover {
        background: #fff1f5;
    }

    .comment-form {
        display: none;
        margin-top: 12px;
    }

    .comment-form input[type='text'],
    .comment-form textarea,
    .delete-form input[type='text'],
    .edit-form input[type='text'],
    .edit-form textarea,
    .reply-form input[type='text'],
    .reply-form textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: 2px solid #ffd1dc;
        border-radius: 10px;
        box-sizing: border-box;
    }

    .comment-form textarea {
        height: 80px;
        resize: none;
    }

    .comment-submit-btn {
        display: none;
        padding: 8px 16px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .comment-list {
        display: none;
    }

    .comment-box {
        margin-top: 12px;
        padding: 12px;
        background: #fff5f8;
        border-radius: 12px;
    }

    .no-comment {
        margin-top: 12px;
        padding: 18px;
        text-align: center;
        background: #fff5f8;
        border-radius: 12px;
        color: #999;
        font-style: italic;
    }

    .delete-form,
    .edit-form {
        display: none;
        margin-top: 12px;
        padding: 16px;
        background: #fff8fa;
        border: 2px solid #ffd1dc;
        border-radius: 16px;
    }

    .delete-form p,
    .edit-form p {
        color: #ff5f87;
        font-weight: bold;
        margin: 8px 0 12px;
    }

    .delete-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .edit-form textarea {
        height: 100px;
        resize: none;
    }

    .edit-form input[type='number']{
        width:100%;
        padding:10px;
        margin-bottom:10px;
        border:2px solid #ffd1dc;
        border-radius:10px;
    }

    .edit-form input[type='file']{
        width:100%;
        margin-bottom:10px;
    }

    .edit-form input[type='submit'],
    .edit-cancel-btn {
        padding: 8px 18px;
        border: 2px solid white;
        border-radius: 999px;
        background: #ff6f91;
        color: white;
        font-weight: bold;
        cursor: pointer;
    }

    .edit-form input[type='submit']:hover,
    .edit-cancel-btn:hover {
        background: #ff4f7e;
    }

    .comment-delete-open {
        margin-top: 8px;
        margin-left: 10px;
        padding: 6px 12px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .comment-delete-form {
        display: none;
        margin-top: 8px;
    }

    .comment-delete-form input[type='text'] {
        width: 100%;
        padding: 8px;
        margin-bottom: 6px;
        border: 2px solid #ffd1dc;
        border-radius: 10px;
    }

    .comment-delete-form input[type='submit'] {
        padding: 6px 12px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .reply-open-btn {
        margin-left: 8px;
        padding: 6px 12px;
    }

    .reply-form {
        display: none;
        margin-top: 10px;
        padding: 12px;
        background: #fff8fa;
        border: 2px solid #ffd1dc;
        border-radius: 12px;
    }

    .reply-form textarea {
        height: 60px;
        resize: none;
    }

    .reply-box {
        margin-top: 10px;
        margin-left: 24px;
        padding: 10px;
        background: white;
        border-left: 4px solid #ff9aad;
        border-radius: 10px;
    }

    .reply-box strong {
        color: #ff6f91;
    }

    #cardView {
        display: none;
    }

    .mini-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .mini-card {
        padding: 14px;
        background: white;
        border: 3px solid #ff9aad;
        border-radius: 22px;
        text-align: center;
        box-shadow: 0 10px 24px rgba(255, 128, 160, 0.2);
    }

    .mini-card img,
    .mini-no-photo {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 16px;
        border: 2px solid #ffd1dc;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #aaa;
        background: #fff8fa;
    }

    .mini-card h4 {
        margin: 10px 0 4px;
        color: #ff6f91;
        font-size: 18px;
    }

    .mini-card p {
        margin: 0;
        color: #555;
        font-size: 14px;
    }
    #backToCardsBtn {
        display: none;
        margin: 16px auto;
        padding: 9px 18px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: #ff6f91;
        color: white;
        font-weight: bold;
        cursor: pointer;
    }
    .mini-card {
        cursor: pointer;
    }

    .mini-card:hover {
        transform: translateY(-3px);
    }

    .inline-detail-card {
        grid-column: 1 / -1;
        margin: 0 0 12px;
    }

    #backToCardsBtn {
        display: none !important;
    }
    .mini-card {
        cursor: pointer;
    }

    .mini-card.is-open {
        display: none;
    }

    .inline-detail-card {
        grid-column: 1 / -1;
        margin: 0 0 12px;
    }
    .reply-delete-open {
        margin-top: 8px;
        padding: 6px 12px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .reply-delete-form {
        display: none;
        margin-top: 8px;
    }

    .reply-delete-form input[type='text'] {
        width: 100%;
        padding: 8px;
        margin-bottom: 6px;
        border: 2px solid #ffd1dc;
        border-radius: 10px;
        box-sizing: border-box;
    }

    .reply-delete-form input[type='submit'] {
        padding: 6px 12px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }
    .reply-list {
        display: none;
    }

    .reply-list-toggle {
        margin-top: 10px;
        padding: 6px 12px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }
        
    @media all and (max-width: 600px) {
        body {
            padding: 16px;
        }

        .container {
            width: 100%;
            max-width: 100%;
        }

        .title-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
        }

        #title {
            font-size: 34px;
            line-height: 1.2;
        }

        .subtitle {
            font-size: 15px;
        }

        #r_msg {
            margin-left: 0;
            margin-top: 8px;
        }

        #r_msg input {
            width: 100%;
            padding: 12px;
        }

        .friend-main {
            flex-direction: column;
            gap: 16px;
        }

        .friend-photo {
            width: 100%;
            text-align: center;
        }

        .friend-card img,
        .no-photo {
            width: 100%;
            max-width: 260px;
            height: 260px;
        }

        .bottom-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
        }

        .action-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .heart-form {
            flex: 1 1 100%;
            justify-content: center;
        }

        .comment-toggle,
        .comment-view-toggle {
            flex: 1 1 calc(50% - 4px);
        }

        .edit-open-btn,
        .delete-open-btn {
            flex: 1 1 calc(50% - 4px);
        }

        .action-group button {
            min-height: 42px;
        }

        .comment-submit-btn {
            width: 100%;
        }

        .delete-form {
            margin-top: 10px;
        }

        .delete-buttons {
            justify-content: stretch;
        }

        .delete-buttons input,
        .delete-buttons button {
            flex: 1;
        }

        .mini-grid {
            gap: 12px;
        }

        .mini-card {
            padding: 10px;
            border-radius: 18px;
        }

        .mini-card h4 {
            font-size: 15px;
        }

        .mini-card p {
            font-size: 12px;
        }

        .reply-box {
            margin-left: 12px;
        }
        @media all and (max-width: 600px) {
            .friend-card img:hover {
                transform: none;
                border: 2px solid #ffd1dc;
                box-shadow: none;
                z-index: auto;
                position: static;
            }

            .friend-card img {
                cursor: default;
            }
        }
    }
</style>";

    echo "<div class='container'>";

    echo "<div class='title-row'>";
    echo "<h2 id='title'>구조 대기 명단</h2>";
    echo "<h3 class='subtitle'><br>우리 멋진 친구들을 만나보세요!</h3>";
    echo "<form action='https://testham.dothome.co.kr/fr_maker/' id='r_msg'>";
    echo "<input type='submit' value='나도 글 남기기'>";
    echo "</form>";
    echo "</div><hr>";

    echo "<div class='view-switch'>";
    echo "<button type='button' id='fullViewBtn'>상세 보기</button>";
    echo "<button type='button' id='cardViewBtn'>카드 보기</button>";
    echo "</div>";

    $mini_cards = "";

    echo "<div id='fullView'>";
    echo "<button type='button' id='backToCardsBtn'>카드 목록으로</button>";

    while($row = mysqli_fetch_array($result_table, MYSQLI_ASSOC)){
        $no = $row['no'];
        $name = $row['name'];
        $gender = $row['gender'];
        $age = $row['age'];
        $harts = $row['harts'];
        $msg2_raw = $row['msg2'];
        $msg2 = nl2br($row['msg2']);
        $file_path = $row['file_path'];

        $mini_cards .= "<div class='mini-card' data-target='post-$no'>";

        if(!empty($file_path) && file_exists($file_path)){
            $mini_cards .= "<img src='$file_path' alt='사진'>";
        } else {
            $mini_cards .= "<div class='mini-no-photo'>사진 없음</div>";
        }

        $mini_cards .= "<h4>$name</h4>";
        $mini_cards .= "<p>$age 살 · $gender</p>";
        $mini_cards .= "</div>";

        echo "<div class='friend-card' id='post-$no'>";
        echo "<div class='friend-main'>";

        echo "<div class='friend-text'>";
        echo "<h2 class='friend-name'>$name | $age 살 | $gender</h2>";
        echo "<h4 class='friend-section-title'>'$name'님이 적은 성격 및 매력 포인트</h4>";
        echo "<p class='friend-desc'>$msg2</p>";
        echo "</div>";

        echo "<div class='friend-photo'>";
        if(!empty($file_path) && file_exists($file_path)){
            echo "<img src='$file_path' alt='사진 없음'>";
        } else {
            echo "<div class='no-photo'>사진 없음</div>";
        }
        echo "</div>";

        echo "</div>";

        echo "<div class='comment-area'>";

        $count_sql = "SELECT COUNT(*) AS cnt FROM comment WHERE fr_no='$no'";
        $count_result = mysqli_query($db, $count_sql);
        $count_row = mysqli_fetch_array($count_result, MYSQLI_ASSOC);
        $comment_count = $count_row['cnt'];

        echo "<div class='bottom-actions'>";
        echo "<div class='action-group'>";

        echo "<div class='heart-form'>";
        echo "<button type='button' class='heart-btn' data-no='$no'>♥</button>";
        echo "<span class='heart-count'>$harts</span>";
        echo "</div>";

        echo "<button type='button' class='comment-toggle'>코멘트 쓰기</button>";
        echo "<button type='button' class='comment-view-toggle' data-default-text='코멘트 보기($comment_count)'>코멘트 보기($comment_count)</button>";
        echo "<button type='button' class='edit-open-btn'>수정</button>";
        echo "<button type='button' class='delete-open-btn'>삭제</button>";

        echo "</div>";
        echo "</div>";

        echo "<form class='edit-form' action='fr_list.php' method='post' enctype='multipart/form-data'>";
        echo "<input type='hidden' name='fr_no' value='$no'>";

        echo "<p>작성자 전화번호를 입력하고 수정할 내용을 적어주세요.</p>";

        echo "<input type='text' name='phone' placeholder='010-0000-0000'>";

        echo "<input type='number' name='age' value='$age' min='20' max='40'>";

        echo "<textarea name='msg2'>$msg2_raw</textarea>";

        echo "<label>사진 변경</label>";
        echo "<input type='file' name='img1' accept='image/*'>";

        echo "<div class='delete-buttons'>";
        echo "<input type='submit' name='edit_submit' value='수정'>";
        echo "<button type='button' class='edit-cancel-btn'>취소</button>";
        echo "</div>";
        echo "</form>";

        echo "<form class='delete-form' action='fr_list.php' method='post'>";
        echo "<input type='hidden' name='fr_no' value='$no'>";
        echo "<p>정말 삭제 하시나요? 작성자 전화번호를 입력하고 '네'를 누르면 삭제됩니다. (복구 불가)</p>";
        echo "<input type='text' name='phone' placeholder='010-0000-0000'>";
        echo "<div class='delete-buttons'>";
        echo "<input type='submit' name='delete_submit' value='네'>";
        echo "<button type='button' class='delete-cancel-btn'>아니요</button>";
        echo "</div>";
        echo "</form>";

        echo "<form id='comment-form-$no' class='comment-form' action='fr_list.php' method='post'>";
        echo "<input type='hidden' name='fr_no' value='$no'>";
        echo "<input type='hidden' name='parent_no' value='0'>";
        echo "<div class='comment-inputs'>";
        echo "<input type='text' name='nickname' placeholder='닉네임'>";
        echo "<textarea name='cmt' placeholder='내용 입력'></textarea>";
        echo "<input class='comment-submit-btn' type='submit' name='comment_submit' value='남기기' form='comment-form-$no'>";
        echo "</div>";
        echo "</form>";

        echo "<div class='comment-list'>";

        $comment_sql = "SELECT * FROM comment WHERE fr_no='$no' AND parent_no=0 ORDER BY no DESC";
        $comment_result = mysqli_query($db, $comment_sql);

        if($comment_count == 0){
            echo "<div class='no-comment'>아직 코멘트가 없습니다 🥲</div>";
        }

        while($comment = mysqli_fetch_array($comment_result, MYSQLI_ASSOC)){
            $comment_no = $comment['no'];

            echo "<div class='comment-box'>";
            echo "<strong>".$comment['nickname']."</strong>";
            echo "<p>".nl2br($comment['cmt'])."</p>";
            echo "<small>".$comment['now']."</small>";
            echo "<button type='button' class='reply-open-btn'>답글</button>";
            echo "<button type='button' class='comment-delete-open'>삭제</button>";

            echo "<form class='reply-form' action='fr_list.php' method='post'>";
            echo "<input type='hidden' name='fr_no' value='$no'>";
            echo "<input type='hidden' name='parent_no' value='$comment_no'>";
            echo "<input type='text' name='nickname' placeholder='닉네임'>";
            echo "<textarea name='cmt' placeholder='답글 입력'></textarea>";
            echo "<input type='submit' name='comment_submit' value='답글 남기기'>";
            echo "</form>";

            echo "<form class='comment-delete-form' action='fr_list.php' method='post'>";
            echo "<input type='hidden' name='comment_no' value='$comment_no'>";
            echo "<input type='text' name='delete_word' placeholder=\"'댓글 삭제'를 입력하세요\">";
            echo "<input type='submit' name='comment_delete_submit' value='댓글 삭제'>";
            echo "</form>";

            $reply_sql = "SELECT * FROM comment WHERE parent_no='$comment_no' ORDER BY no ASC";
            $reply_result = mysqli_query($db, $reply_sql);

            while($reply = mysqli_fetch_array($reply_result, MYSQLI_ASSOC)){
                $reply_sql = "SELECT * FROM comment WHERE parent_no='$comment_no' ORDER BY no ASC";
                $reply_result = mysqli_query($db, $reply_sql);
                $reply_count = mysqli_num_rows($reply_result);

                if($reply_count > 0){
                    echo "<button type='button' class='reply-list-toggle'>대댓글 열기($reply_count)</button>";
                }

                echo "<div class='reply-list'>";

                while($reply = mysqli_fetch_array($reply_result, MYSQLI_ASSOC)){
                    $reply_no = $reply['no'];

                    echo "<div class='reply-box'>";
                    echo "<strong>ㄴ ".$reply['nickname']."</strong>";
                    echo "<p>".nl2br($reply['cmt'])."</p>";
                    echo "<small>".$reply['now']."</small>";

                    echo "<br>";
                    echo "<button type='button' class='reply-delete-open'>삭제</button>";

                    echo "<form class='reply-delete-form' action='fr_list.php' method='post'>";
                    echo "<input type='hidden' name='reply_no' value='$reply_no'>";
                    echo "<input type='text' name='delete_word' placeholder=\"'댓글 삭제'를 입력하세요\">";
                    echo "<input type='submit' name='reply_delete_submit' value='삭제'>";
                    echo "</form>";

                    echo "</div>";
                }

                echo "</div>";
        }

        echo "</div>";
        echo "</div>";
        echo "</div>";
    }

    echo "</div>";

    echo "<div id='cardView' class='mini-grid'>";
    echo $mini_cards;
    echo "</div>";

    echo "</div>";

} else {
    echo "게시글 리스트를 불러오는 중 오류가 발생했습니다.";
}

mysqli_close($db);

echo "<script>
    const fullView = document.getElementById('fullView');
    const cardView = document.getElementById('cardView');
    const fullViewBtn = document.getElementById('fullViewBtn');
    const cardViewBtn = document.getElementById('cardViewBtn');

    fullViewBtn.classList.add('active');

    fullViewBtn.addEventListener('click', function(){
        fullView.style.display = 'block';
        cardView.style.display = 'none';

        fullViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
    });

    cardViewBtn.addEventListener('click', function(){
        fullView.style.display = 'none';
        cardView.style.display = 'grid';

        cardViewBtn.classList.add('active');
        fullViewBtn.classList.remove('active');
    });

    const writeButtons = document.querySelectorAll('.comment-toggle');

    writeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const card = button.closest('.comment-area');
            const form = card.querySelector('.comment-form');
            const submitBtn = card.querySelector('.comment-submit-btn');

            if(form.style.display === 'block') {
                form.style.display = 'none';
                submitBtn.style.display = 'none';
                button.textContent = '코멘트 쓰기';
            } else {
                form.style.display = 'block';
                submitBtn.style.display = 'inline-block';
                button.textContent = '쓰기 취소';
            }
        });
    });

    const viewButtons = document.querySelectorAll('.comment-view-toggle');

    viewButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const card = button.closest('.comment-area');
            const commentList = card.querySelector('.comment-list');

            if(commentList.style.display === 'block') {
                commentList.style.display = 'none';
                button.textContent = button.dataset.defaultText;
            } else {
                commentList.style.display = 'block';
                button.textContent = '코멘트 닫기';
            }
        });
    });

    const heartButtons = document.querySelectorAll('.heart-btn');

    heartButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const frNo = button.dataset.no;
            const countSpan = button.nextElementSibling;

            fetch('fr_list.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'heart_ajax=1&fr_no=' + frNo
            })
            .then(response => response.text())
            .then(count => {
                countSpan.textContent = count;
            });
        });
    });

    const deleteOpenButtons = document.querySelectorAll('.delete-open-btn');

    deleteOpenButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const card = button.closest('.comment-area');
            const deleteForm = card.querySelector('.delete-form');

            deleteForm.style.display = 'block';
            button.style.display = 'none';
        });
    });

    const deleteCancelButtons = document.querySelectorAll('.delete-cancel-btn');

    deleteCancelButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const card = button.closest('.comment-area');
            const deleteForm = card.querySelector('.delete-form');
            const openButton = card.querySelector('.delete-open-btn');

            deleteForm.style.display = 'none';
            openButton.style.display = 'inline-block';
        });
    });

    const commentDeleteButtons = document.querySelectorAll('.comment-delete-open');

    commentDeleteButtons.forEach(function(button){
        button.addEventListener('click', function(){
            const box = button.closest('.comment-box');
            const form = box.querySelector('.comment-delete-form');

            form.style.display = 'block';
            button.style.display = 'none';
        });
    });

    const editOpenButtons = document.querySelectorAll('.edit-open-btn');

    editOpenButtons.forEach(function(button){
        button.addEventListener('click', function(){
            const card = button.closest('.comment-area');
            const form = card.querySelector('.edit-form');

            form.style.display = 'block';
            button.style.display = 'none';
        });
    });

    const editCancelButtons = document.querySelectorAll('.edit-cancel-btn');

    editCancelButtons.forEach(function(button){
        button.addEventListener('click', function(){
            const card = button.closest('.comment-area');
            const form = card.querySelector('.edit-form');
            const openButton = card.querySelector('.edit-open-btn');

            form.style.display = 'none';
            openButton.style.display = 'inline-block';
        });
    });

    const replyOpenButtons = document.querySelectorAll('.reply-open-btn');

    replyOpenButtons.forEach(function(button){
        button.addEventListener('click', function(){
            const box = button.closest('.comment-box');
            const form = box.querySelector('.reply-form');

            if(form.style.display === 'block'){
                form.style.display = 'none';
                button.textContent = '답글';
            } else {
                form.style.display = 'block';
                button.textContent = '답글 취소';
            }
        });
    });

    const miniCards = document.querySelectorAll('.mini-card');
    const detailCards = document.querySelectorAll('.friend-card');

    function closeInlineDetail(){
        miniCards.forEach(function(card){
            card.classList.remove('is-open');
        });

        detailCards.forEach(function(detail){
            detail.classList.remove('inline-detail-card');
            detail.style.display = 'none';
            fullView.appendChild(detail);
        });
    }

    miniCards.forEach(function(card){
        card.addEventListener('click', function(event){
            event.stopPropagation();

            const targetId = card.dataset.target;
            const targetCard = document.getElementById(targetId);

            closeInlineDetail();

            card.classList.add('is-open');

            targetCard.classList.add('inline-detail-card');
            targetCard.style.display = 'block';

            card.insertAdjacentElement('afterend', targetCard);
        });
    });

    detailCards.forEach(function(detail){
        detail.addEventListener('click', function(event){
            event.stopPropagation();
        });
    });

    document.addEventListener('click', function(){
        if(cardView.style.display === 'grid'){
            closeInlineDetail();
        }
    });

    cardViewBtn.addEventListener('click', function(){
        closeInlineDetail();
        fullView.style.display = 'none';
        cardView.style.display = 'grid';

        cardViewBtn.classList.add('active');
        fullViewBtn.classList.remove('active');
    });

    fullViewBtn.addEventListener('click', function(){
        closeInlineDetail();

        detailCards.forEach(function(detail){
            detail.style.display = 'block';
        });

        fullView.style.display = 'block';
        cardView.style.display = 'none';

        fullViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
    });

    const replyDeleteButtons = document.querySelectorAll('.reply-delete-open');

    replyDeleteButtons.forEach(function(button){
        button.addEventListener('click', function(){
            const box = button.closest('.reply-box');
            const form = box.querySelector('.reply-delete-form');

            form.style.display = 'block';
            button.style.display = 'none';
        });
    });
</script>";
?>