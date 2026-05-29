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
        }

        .friend-card img {
            transition: all 0.3s ease;
            cursor: zoom-in;
        }

        .friend-card img {
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

        .comment-form {
            display: none;
            margin-top: 12px;
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

        .comment-form input[type='submit'] {
            display: block;
            margin-left: auto;
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
    </style>";

    echo "<div class='container'>";

    echo "<div class='title-row'>";
    echo "<h2 id='title'>함형준의 보석함</h2>";
    echo "<h3 class='subtitle'>우리 형준이의 멋진 친구들을 만나보세요!</h3>";
    echo "</div><hr>";

    while($row = mysqli_fetch_array($result_table, MYSQLI_ASSOC)){
        $no = $row['no'];
        $name = $row['name'];
        $gender = $row['gender'];
        $age = $row['age'];
        $msg2 = nl2br($row['msg2']);
        $file_path = $row['file_path'];

        echo "<div class='friend-card'>";

        echo "<div class='friend-main'>";

        echo "<div class='friend-text'>";
        echo "<h2 class='friend-name'>$name | $age 살 | $gender</h2>";
        echo "<h4 class='friend-section-title'>'$name'가 직접 적은 성격 및 매력 포인트</h4>";
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

        echo "<button type='button' class='comment-toggle'>코멘트 쓰기</button>";
        echo "<form class='comment-form' action='fr_list.php' method='post'>";
        echo "<input type='hidden' name='fr_no' value='$no'>";
        echo "<input type='text' name='nickname' placeholder='닉네임'>";
        echo "<textarea name='cmt' placeholder='내용 입력'></textarea>";
        echo "<input type='submit' name='comment_submit' value='남기기'>";
        echo "</form>";

        echo "<button type='button' class='comment-view-toggle' data-default-text='코멘트 보기($comment_count)'>코멘트 보기($comment_count)</button>";
        echo "<div class='comment-list'>";

        $comment_sql = "SELECT * FROM comment WHERE fr_no='$no' ORDER BY no DESC";
        $comment_result = mysqli_query($db, $comment_sql);

        while($comment = mysqli_fetch_array($comment_result, MYSQLI_ASSOC)){
            echo "<div class='comment-box'>";
            echo "<strong>".$comment['nickname']."</strong>";
            echo "<p>".nl2br($comment['cmt'])."</p>";
            echo "<small>".$comment['now']."</small>";
            echo "</div>";
        }

        echo "</div>";
        echo "</div>";

        echo "</div>";
    }

    echo "</div>";

} else {
    echo "게시글 리스트를 불러오는 중 오류가 발생했습니다.";
}

mysqli_close($db);

echo "<script>
    const writeButtons = document.querySelectorAll('.comment-toggle');

    writeButtons.forEach(function(button) {
        button.addEventListener('click', function() {

            const form = button.nextElementSibling;

            if(form.style.display === 'block') {
                form.style.display = 'none';
                button.textContent = '코멘트 쓰기';
            } else {
                form.style.display = 'block';
                button.textContent = '쓰기 취소';
            }

        });
    });

    const viewButtons = document.querySelectorAll('.comment-view-toggle');

    viewButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const commentList = button.nextElementSibling;

            if(commentList.style.display === 'block') {
                commentList.style.display = 'none';
                button.textContent = button.dataset.defaultText;
            } else {
                commentList.style.display = 'block';
                button.textContent = '코멘트 닫기';
            }
        });
    });
</script>";
?>