<?php
header("Content-Type:text/html; charset=utf-8");

$db = mysqli_connect('localhost', 'testham', 'a1s2d3f4!', 'testham');
mysqli_query($db, "set names utf8");

if(isset($_POST['comment_submit'])){
    $fr_no = $_POST['fr_no'];
    $nickname = $_POST['nickname'];
    $cmt = $_POST['cmt'];

    $sql = "INSERT INTO comment(nickname, cmt, `now`, fr_no)
            VALUES('$nickname', '$cmt', NOW(), '$fr_no')";

    mysqli_query($db, $sql);

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['comment_delete_submit'])){
    $comment_no = $_POST['comment_no'];
    $delete_word = $_POST['delete_word'];

    if($delete_word == '삭제'){
        $sql = "DELETE FROM comment WHERE no='$comment_no'";
        mysqli_query($db, $sql);
    }

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['heart_ajax'])){
    $fr_no = $_POST['fr_no'];

    $sql = "UPDATE fr_maker
            SET harts = harts + 1
            WHERE no = '$fr_no'";
    mysqli_query($db, $sql);

    $result = mysqli_query($db, "SELECT harts FROM fr_maker WHERE no = '$fr_no'");
    $row = mysqli_fetch_array($result, MYSQLI_ASSOC);

    echo $row['harts'];
    exit;
}

if(isset($_POST['delete_submit'])){
    $fr_no = $_POST['fr_no'];
    $phone = $_POST['phone'];

    $sql = "DELETE FROM fr_maker 
            WHERE no='$fr_no' AND phone='$phone'";

    mysqli_query($db, $sql);

    echo "<script>location.href='fr_list.php';</script>";
    exit;
}

if(isset($_POST['edit_submit'])){
    $fr_no = $_POST['fr_no'];
    $phone = $_POST['phone'];
    $msg2 = $_POST['msg2'];

    $sql = "UPDATE fr_maker 
            SET msg2='$msg2'
            WHERE no='$fr_no' AND phone='$phone'";

    mysqli_query($db, $sql);

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
        }

        .friend-card img:hover {
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

        #title {
            color: pink;
            font-size: 50px;
            margin: 0;
        }

        .title-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .subtitle {
            display: inline-block;
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

        .comment-form input[type='text'],
        .comment-form textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 8px;
            border: 2px solid #ffd1dc;
            border-radius: 10px;
            box-sizing: border-box;
        }

        .comment-form textarea {
            height: 80px;
            resize: none;
        }

        .comment-toggle,
        .comment-view-toggle,
        .comment-form input[type='submit'] {
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
        .comment-form input[type='submit']:hover {
            background: #fff1f5;
        }

        .comment-form {
            display: none;
            margin-top: 12px;
            gap: 10px;
            align-items: flex-end;
        }

        .comment-inputs {
            flex: 1;
        }

        .comment-submit-wrap {
            display: flex;
            align-items: flex-end;
        }

        .comment-submit-wrap input[type='submit'] {
            white-space: nowrap;
            height: 42px;
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

        /* 하트 기능 스타일 */
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

        .action-group{
            display:flex;
            align-items:center;
            gap:8px;
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

        .comment-submit-btn:hover {
            background: #fff1f5;
        }

        .heart-form{
            display:flex;
            align-items:center;
            gap:6px;
            margin:0;
        }

        .bottom-actions{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* #r_msg 는 페이지 우측 상단의 '나도 글 남기기' 버튼 */
        #r_msg{
            margin-left: auto;
            margin-top: 30px;
        }

        #r_msg input{
            padding: 14px 28px;
            border: 2px solid white;
            border-radius: 999px;

            background: #ff6f91;
            color: white;

            font-weight: bold;
            cursor: pointer;

            transition: 0.2s;
        }

        #r_msg input:hover{
            background: #ff4f7e;
            transform: translateY(-1px);
        }

        .delete-open-btn,
        .delete-form input[type='submit'],
        .delete-cancel-btn {
            padding: 8px 16px;
            border: 2px solid #ff9aad;
            border-radius: 999px;
            background: white;
            color: #ff6f91;
            font-weight: bold;
            cursor: pointer;
        }

        .delete-open-btn:hover,
        .delete-form input[type='submit']:hover,
        .delete-cancel-btn:hover {
            background: #fff1f5;
        }

        .delete-form {
            display: none;
            margin-top: 12px;
            padding: 16px;
            background: #fff8fa;
            border: 2px solid #ffd1dc;
            border-radius: 16px;
        }

        .delete-form input[type='text'] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 2px solid #ffd1dc;
            border-radius: 10px;
            box-sizing: border-box;
        }

        .delete-form p {
            color: #ff5f87;
            font-weight: bold;
            margin: 8px 0 12px;
        }

        .delete-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
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

        .action-group {
            flex-wrap: wrap;
            gap: 8px;
        }

        .bottom-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
        }

        .comment-submit-btn {
            width: 100%;
        }

        .heart-form {
            justify-content: center;
        }

        .comment-toggle,
        .comment-view-toggle {
            flex: 1;
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
    .edit-open-btn{
        padding: 8px 16px;
        border: 2px solid #ff9aad;
        border-radius: 999px;
        background: white;
        color: #ff6f91;
        font-weight: bold;
        cursor: pointer;
    }

    .edit-open-btn:hover{
        background:#fff1f5;
    }

    .edit-form{
        display:none;
        margin-top:12px;
        padding:16px;
        background:#fff8fa;
        border:2px solid #ffd1dc;
        border-radius:16px;
    }

    .edit-form input[type='text'],
    .edit-form textarea{
        width:100%;
        padding:10px;
        margin-bottom:10px;
        border:2px solid #ffd1dc;
        border-radius:10px;
        box-sizing:border-box;
    }

    .edit-form textarea{
        height:100px;
        resize:none;
    }

    </style>";

    echo "<div class='container'>";

    echo "<div class='title-row'>";
    echo "<h2 id='title' style='color: rgb(255, 105, 130)'>구조 대기 명단</h2>";
    echo "<h3 class='subtitle'> <br> 우리 멋진 친구들을 만나보세요!</h3>";

    echo "<form action='https://testham.dothome.co.kr/fr_maker/' id='r_msg'>";
    echo "<input type='submit' value='나도 글 남기기'>";
    echo "</form>";

    echo "</div><hr>";

    while($row = mysqli_fetch_array($result_table, MYSQLI_ASSOC)){
        $no = $row['no'];
        $name = $row['name'];
        $gender = $row['gender'];
        $age = $row['age'];
        $harts = $row['harts'];
        $msg2 = nl2br($row['msg2']);
        $file_path = $row['file_path'];

        echo "<div class='friend-card'>";

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

            echo "<button type='button' class='comment-view-toggle'
                data-default-text='코멘트 보기($comment_count)'>
                코멘트 보기($comment_count)
                </button>";

            echo "<button type='button' class='edit-open-btn'>수정</button>";
            echo "<button type='button' class='delete-open-btn'>삭제</button>";

            echo "</div>";

        echo "</div>";

        echo "<form class='edit-form' action='fr_list.php' method='post'>";

        echo "<input type='hidden' name='fr_no' value='$no'>";

        echo "<p>작성자 전화번호를 입력하고 수정할 내용을 적어주세요.</p>";

        echo "<input type='text' name='phone' placeholder='010-0000-0000'>";

        echo "<textarea name='msg2' placeholder='수정할 내용'>$msg2</textarea>";

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

        echo "<div class='comment-inputs'>";
        echo "<input type='text' name='nickname' placeholder='닉네임'>";
        echo "<textarea name='cmt' placeholder='내용 입력'></textarea>";
        echo "<input class='comment-submit-btn' type='submit' name='comment_submit' value='남기기' form='comment-form-$no'>";
        echo "</div>";

        echo "</form>";
        echo "<div class='comment-list'>";
        $comment_sql = "SELECT * FROM comment WHERE fr_no='$no' ORDER BY no DESC";
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

            echo "<button type='button' class='comment-delete-open'>삭제</button>";

            echo "<form class='comment-delete-form' action='fr_list.php' method='post'>";
            echo "<input type='hidden' name='comment_no' value='$comment_no'>";
            echo "<input type='text' name='delete_word' placeholder=\"'삭제'를 입력하세요\">";
            echo "<input type='submit' name='comment_delete_submit' value='삭제'>";
            echo "</form>";

            echo "</div>";
        }

        echo "</div>";
        echo "</div>";

        echo "</div>";
    }

    echo "</div>";

    // echo "<div id='go_top'>TOP↑<div>";

} else {
    echo "게시글 리스트를 불러오는 중 오류가 발생했습니다.";
}

mysqli_close($db);

echo "<script>
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
</script>";
?>