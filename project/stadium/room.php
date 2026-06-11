<?php
session_start();

$room_code = $_GET["code"] ?? "";
$is_host = $_SESSION["is_host"] ?? false;
$participant_id = $_SESSION["participant_id"] ?? "";

if ($room_code === "") {
    echo "입장코드가 없습니다.";
    exit;
}

$safe_room_code = htmlspecialchars($room_code, ENT_QUOTES, "UTF-8");
?>

<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>온라인 구장 - 관중석</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 100%;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background: #101820;
      color: #ffffff;
      overflow: hidden;
    }

    .room-page {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #101820;
    }

    .top-bar {
      height: 58px;
      padding: 0 18px;
      background: #0d151d;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .room-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .room-title {
      font-size: 16px;
      font-weight: 900;
    }

    .room-code {
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(46, 204, 113, 0.12);
      color: #2ecc71;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
    }

    .host-badge {
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255, 209, 102, 0.14);
      color: #ffd166;
      font-size: 12px;
      font-weight: 900;
    }

    .stadium-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at top, rgba(46, 204, 113, 0.16), transparent 38%),
        linear-gradient(#1c3126, #0c1a13);
      position: relative;
      overflow: hidden;
    }

    .audience-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 44px 44px;
    }

    .stand-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 70px;
      background: rgba(0, 0, 0, 0.12);
      border-top: 1px solid rgba(255,255,255,0.07);
      border-bottom: 1px solid rgba(0,0,0,0.2);
    }

    .stand-line.line-1 {
      bottom: 0;
    }

    .stand-line.line-2 {
      bottom: 70px;
      opacity: 0.7;
    }

    .stand-line.line-3 {
      bottom: 140px;
      opacity: 0.45;
    }

    .character {
      position: absolute;
      left: 50%;
      bottom: 36px;
      width: 68px;
      height: 94px;
      transform: translateX(-50%);
      text-align: center;
      transition: left 0.12s linear, bottom 0.12s linear;
      z-index: 10;
    }

    .character.is-jumping {
      animation: jump 0.42s ease-out;
    }

    @keyframes jump {
      0% {
        margin-bottom: 0;
      }
      45% {
        margin-bottom: 38px;
      }
      100% {
        margin-bottom: 0;
      }
    }

    .nickname {
      display: inline-block;
      max-width: 96px;
      margin-bottom: 5px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(0,0,0,0.62);
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .speech-bubble {
      position: absolute;
      left: 50%;
      bottom: 92px;
      transform: translateX(-50%);
      min-width: 64px;
      max-width: 160px;
      padding: 8px 10px;
      border-radius: 14px;
      background: #ffffff;
      color: #101820;
      font-size: 12px;
      font-weight: 800;
      line-height: 1.35;
      word-break: break-word;
      box-shadow: 0 8px 18px rgba(0,0,0,0.25);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;

      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .speech-bubble.is-show {
      opacity: 1;
    }

    .avatar {
      width: 42px;
      height: 42px;
      margin: 0 auto;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.95);
      background: #ffd6a5;
      box-shadow: 0 8px 18px rgba(0,0,0,0.25);
      position: relative;
    }

    .avatar::before,
    .avatar::after {
      content: "";
      position: absolute;
      top: 14px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #101820;
    }

    .avatar::before {
      left: 11px;
    }

    .avatar::after {
      right: 11px;
    }

    .body {
      width: 30px;
      height: 24px;
      margin: -2px auto 0;
      border-radius: 10px 10px 8px 8px;
      background: #2ecc71;
      box-shadow: 0 6px 12px rgba(0,0,0,0.18);
    }

    .arm {
      position: absolute;
      width: 12px;
      height: 22px;
      top: 57px;
      border-radius: 999px;
      background: #2ecc71;
      transform-origin: top;
    }

    .arm.left {
      left: 17px;
      transform: rotate(24deg);
    }

    .arm.right {
      right: 17px;
      transform: rotate(-24deg);
    }

    .character.friend-1 {
      bottom: 126px;
      transform: translateX(-50%) scale(0.86);
      opacity: 0.86;
      z-index: 8;
    }

    .character.friend-1 .avatar {
      background: #bde0fe;
    }

    .character.friend-1 .body,
    .character.friend-1 .arm {
      background: #4dabf7;
    }

    .character.friend-2 {
      bottom: 206px;
      transform: translateX(-50%) scale(0.76);
      opacity: 0.72;
      z-index: 6;
    }

    .character.friend-2 .avatar {
      background: #ffc8dd;
    }

    .character.friend-2 .body,
    .character.friend-2 .arm {
      background: #ff7aa2;
    }

    .effect-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 30;
    }

    .particle {
      position: absolute;
      font-size: 20px;
      animation: particlePop 1s ease-out forwards;
      will-change: transform, opacity;
    }

    @keyframes particlePop {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(0.8);
      }
      100% {
        opacity: 0;
        transform: translate(var(--x), var(--y)) scale(1.35);
      }
    }

    .ball {
      position: absolute;
      font-size: 24px;
      animation: ballFly 1s ease-out forwards;
      will-change: transform, opacity;
    }

    @keyframes ballFly {
      0% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -220px) scale(0.8) rotate(360deg);
      }
    }

    .chat-log {
      position: absolute;
      right: 16px;
      bottom: 16px;
      width: 300px;
      max-height: 158px;
      padding: 10px;
      border-radius: 14px;
      background: rgba(7, 12, 16, 0.94);
      border: 1px solid rgba(255,255,255,0.12);
      display: none;
      overflow: hidden;
      z-index: 40;
    }

    .chat-log.is-open {
      display: block;
    }

    .chat-log-title {
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 900;
      color: #b8c3cc;
    }

    .chat-log-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 12px;
      line-height: 1.35;
    }

    .chat-line {
      color: #e7eef5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-line strong {
      color: #2ecc71;
    }

    .controls {
      min-height: 78px;
      padding: 10px 14px;
      background: rgba(5, 10, 14, 0.94);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      flex-shrink: 0;
      z-index: 10;
    }

    .reaction-row {
      display: flex;
      gap: 6px;
    }

    .reaction-btn,
    .move-btn {
      min-width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #243545;
      color: #ffffff;
      font-size: 18px;
      font-weight: 900;
      cursor: pointer;
    }

    .move-btn {
      padding: 0 10px;
    }

    .reaction-btn:active,
    .move-btn:active {
      transform: translateY(1px);
      opacity: 0.85;
    }

    .chat-form {
      display: flex;
      gap: 8px;
      min-width: 0;
    }

    .chat-form input {
      flex: 1;
      height: 42px;
      min-width: 0;
      border: none;
      border-radius: 12px;
      padding: 0 13px;
      background: #0f1821;
      color: #ffffff;
      outline: 1px solid rgba(255,255,255,0.1);
      font-size: 14px;
    }

    .chat-form input:focus {
      outline: 2px solid #2ecc71;
    }

    .chat-form button {
      width: 60px;
      height: 42px;
      border: none;
      border-radius: 12px;
      background: #2ecc71;
      color: #0b1a10;
      font-weight: 900;
      cursor: pointer;
      flex-shrink: 0;
    }

    .move-row {
      display: flex;
      gap: 6px;
    }

    .stadium-header {
      height: 34px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(8, 28, 18, 0.98);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
      z-index: 12;
    }

    .stadium-title {
      font-size: 13px;
      font-weight: 900;
    }

    .chat-log-toggle {
      border: none;
      border-radius: 999px;
      padding: 5px 9px;
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }

    .cooltime-text {
      position: absolute;
      left: 50%;
      bottom: 96px;
      transform: translateX(-50%);
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(0,0,0,0.72);
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      opacity: 0;
      pointer-events: none;
      z-index: 50;
      transition: opacity 0.2s ease;
    }

    .cooltime-text.is-show {
      opacity: 1;
    }

    @media (max-width: 720px) {
      body {
        overflow: auto;
      }

      .room-page {
        min-height: 100vh;
        height: 100vh;
      }

      .top-bar {
        height: auto;
        min-height: 56px;
        padding: 10px 12px;
      }

      .room-info {
        flex-wrap: wrap;
      }

      .controls {
        grid-template-columns: 1fr;
        gap: 8px;
        padding-bottom: 10px;
      }

      .reaction-row,
      .move-row {
        justify-content: center;
      }

      .reaction-btn,
      .move-btn {
        flex: 1;
        max-width: 64px;
      }

      .chat-log {
        left: 12px;
        right: 12px;
        bottom: 12px;
        width: auto;
      }

      .character {
        transform: translateX(-50%) scale(0.9);
      }

      .character.friend-1 {
        transform: translateX(-50%) scale(0.78);
      }

      .character.friend-2 {
        transform: translateX(-50%) scale(0.68);
      }
    }
  </style>
</head>

<body>
  <div class="room-page">
    <header class="top-bar">
      <div class="room-info">
        <div class="room-title">온라인 구장</div>
        <div class="room-code">방 코드 <?php echo $safe_room_code; ?></div>

        <?php if ($is_host): ?>
          <div class="host-badge">방장</div>
        <?php endif; ?>
      </div>
    </header>

    <section class="stadium-section">
      <div class="audience-area" id="audienceArea">
        <div class="stand-line line-1"></div>
        <div class="stand-line line-2"></div>
        <div class="stand-line line-3"></div>

        <div class="effect-layer" id="effectLayer"></div>

        <div class="character friend-2" style="left: 70%;">
          <div class="nickname">지윤</div>
          <div class="avatar"></div>
          <div class="body"></div>
          <div class="arm left"></div>
          <div class="arm right"></div>
        </div>

        <div class="character friend-1" style="left: 28%;">
          <div class="nickname">민수</div>
          <div class="avatar"></div>
          <div class="body"></div>
          <div class="arm left"></div>
          <div class="arm right"></div>
        </div>

        <div class="character is-me" id="myCharacter" style="left: 50%;">
          <div class="speech-bubble" id="myBubble">방 생성!</div>
          <div class="nickname" id="myNickname">나</div>
          <div class="avatar"></div>
          <div class="body"></div>
          <div class="arm left"></div>
          <div class="arm right"></div>
        </div>

        <div class="chat-log" id="chatLog">
          <div class="chat-log-title">최근 채팅</div>
          <div class="chat-log-list" id="chatLogList">
            <div class="chat-line"><strong>나</strong> 방 생성!</div>
          </div>
        </div>

        <div class="cooltime-text" id="cooltimeText">축구공은 1분에 한 번만!</div>
      </div>

      <div class="controls">
        <div class="reaction-row">
          <button type="button" class="reaction-btn" data-reaction="❤️">❤️</button>
          <button type="button" class="reaction-btn" data-reaction="🔥">🔥</button>
          <button type="button" class="reaction-btn" data-reaction="🎉">🎉</button>
          <button type="button" class="reaction-btn" data-reaction="⚽">⚽</button>
        </div>

        <form class="chat-form" id="chatForm">
          <input
            type="text"
            id="chatInput"
            placeholder="짧은 응원 메시지"
            maxlength="80"
          />
          <button type="submit">전송</button>
        </form>

        <div class="move-row">
          <button type="button" class="move-btn" id="moveLeftBtn">◀</button>
          <button type="button" class="move-btn" id="moveUpBtn">▲</button>
          <button type="button" class="move-btn" id="jumpBtn">점프</button>
          <button type="button" class="move-btn" id="moveDownBtn">▼</button>
          <button type="button" class="move-btn" id="moveRightBtn">▶</button>
        </div>
      </div>

      <div class="stadium-header">
        <div class="stadium-title">가상 관중석</div>
        <button type="button" class="chat-log-toggle" id="chatLogToggle">
          채팅 로그 보기
        </button>
      </div>
    </section>
  </div>

  <script>
    const myCharacter = document.getElementById("myCharacter");
    const myBubble = document.getElementById("myBubble");
    const myNickname = document.getElementById("myNickname");
    const audienceArea = document.getElementById("audienceArea");
    const effectLayer = document.getElementById("effectLayer");

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatLogToggle = document.getElementById("chatLogToggle");
    const chatLog = document.getElementById("chatLog");
    const chatLogList = document.getElementById("chatLogList");

    const moveLeftBtn = document.getElementById("moveLeftBtn");
    const moveRightBtn = document.getElementById("moveRightBtn");
    const moveUpBtn = document.getElementById("moveUpBtn");
    const moveDownBtn = document.getElementById("moveDownBtn");
    const jumpBtn = document.getElementById("jumpBtn");

    const cooltimeText = document.getElementById("cooltimeText");

    const savedNickname = localStorage.getItem("stadium_nickname");
    const displayNickname = savedNickname || "나";

    myNickname.textContent = displayNickname;

    let myX = 50;
    let myY = 36;
    let bubbleTimer = null;
    let lastBallTime = 0;

    function getMaxY() {
      const maxY = audienceArea.clientHeight - 130;
      return Math.max(36, maxY);
    }

    function setMyPosition() {
      myCharacter.style.left = myX + "%";
      myCharacter.style.bottom = myY + "px";
    }

    function moveLeft() {
      myX = Math.max(5, myX - 5);
      setMyPosition();
    }

    function moveRight() {
      myX = Math.min(95, myX + 5);
      setMyPosition();
    }

    function moveUp() {
      myY = Math.min(getMaxY(), myY + 20);
      setMyPosition();
    }

    function moveDown() {
      myY = Math.max(20, myY - 20);
      setMyPosition();
    }

    function jump() {
      myCharacter.classList.remove("is-jumping");
      void myCharacter.offsetWidth;
      myCharacter.classList.add("is-jumping");
    }

    function showBubble(message) {
      myBubble.textContent = message;
      myBubble.classList.add("is-show");

      clearTimeout(bubbleTimer);

      bubbleTimer = setTimeout(() => {
        myBubble.classList.remove("is-show");
      }, 3500);
    }

    function addChatLog(nickname, message) {
      const line = document.createElement("div");
      line.className = "chat-line";
      line.innerHTML = `<strong>${escapeHTML(nickname)}</strong> ${escapeHTML(message)}`;

      chatLogList.appendChild(line);

      while (chatLogList.children.length > 5) {
        chatLogList.removeChild(chatLogList.firstElementChild);
      }
    }

    function escapeHTML(text) {
      return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function createReactionParticles(emoji) {
      const areaRect = audienceArea.getBoundingClientRect();
      const charRect = myCharacter.getBoundingClientRect();

      const originX = charRect.left - areaRect.left + charRect.width / 2;
      const originY = charRect.top - areaRect.top + 30;

      for (let i = 0; i < 12; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.textContent = emoji;

        const randomX = (Math.random() * 140 - 70).toFixed(0) + "px";
        const randomY = (-60 - Math.random() * 90).toFixed(0) + "px";

        particle.style.left = originX + "px";
        particle.style.top = originY + "px";
        particle.style.setProperty("--x", randomX);
        particle.style.setProperty("--y", randomY);

        effectLayer.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 1000);
      }
    }

    function shootBall() {
      const now = Date.now();

      if (now - lastBallTime < 60000) {
        showCooltimeText();
        return;
      }

      lastBallTime = now;

      const areaRect = audienceArea.getBoundingClientRect();
      const charRect = myCharacter.getBoundingClientRect();

      const originX = charRect.left - areaRect.left + charRect.width / 2;
      const originY = charRect.top - areaRect.top + 18;

      const ball = document.createElement("div");
      ball.className = "ball";
      ball.textContent = "⚽";
      ball.style.left = originX + "px";
      ball.style.top = originY + "px";

      effectLayer.appendChild(ball);

      setTimeout(() => {
        ball.remove();
      }, 1000);
    }

    function showCooltimeText() {
      cooltimeText.classList.add("is-show");

      setTimeout(() => {
        cooltimeText.classList.remove("is-show");
      }, 1200);
    }

    moveLeftBtn.addEventListener("click", moveLeft);
    moveRightBtn.addEventListener("click", moveRight);
    moveUpBtn.addEventListener("click", moveUp);
    moveDownBtn.addEventListener("click", moveDown);
    jumpBtn.addEventListener("click", jump);

    document.addEventListener("keydown", (e) => {
      if (document.activeElement === chatInput) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        moveLeft();
      }

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        moveRight();
      }

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        moveUp();
      }

      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        moveDown();
      }

      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    });

    document.querySelectorAll(".reaction-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const reaction = btn.dataset.reaction;

        if (reaction === "⚽") {
          shootBall();
          return;
        }

        createReactionParticles(reaction);
      });
    });

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const message = chatInput.value.trim();

      if (!message) {
        return;
      }

      showBubble(message);
      addChatLog(displayNickname, message);

      chatInput.value = "";
    });

    chatLogToggle.addEventListener("click", () => {
      chatLog.classList.toggle("is-open");

      if (chatLog.classList.contains("is-open")) {
        chatLogToggle.textContent = "채팅 로그 닫기";
      } else {
        chatLogToggle.textContent = "채팅 로그 보기";
      }
    });

    window.addEventListener("resize", () => {
      myY = Math.min(myY, getMaxY());
      setMyPosition();
    });

    setMyPosition();

    setTimeout(() => {
      myBubble.classList.add("is-show");

      setTimeout(() => {
        myBubble.classList.remove("is-show");
      }, 2500);
    }, 500);
  </script>
</body>
</html>