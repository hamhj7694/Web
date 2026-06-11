<?php
session_start();

$room_code = $_GET["code"] ?? "";
$is_host = $_SESSION["is_host"] ?? false;
$participant_id = $_SESSION["participant_id"] ?? "";
$face_image = $_SESSION["face_image"] ?? "";

if ($room_code === "") {
    echo "입장코드가 없습니다.";
    exit;
}

$safe_room_code = htmlspecialchars($room_code, ENT_QUOTES, "UTF-8");
$safe_face_image = htmlspecialchars($face_image, ENT_QUOTES, "UTF-8");
$has_face_image = $safe_face_image !== "";
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
      background: #f7fff3;
      color: #23352c;
      overflow: hidden;
    }

    .room-page {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at top left, rgba(255, 218, 121, 0.45), transparent 28%),
        radial-gradient(circle at top right, rgba(137, 232, 183, 0.45), transparent 28%),
        linear-gradient(#f7fff3, #e7f8df);
    }

    .top-bar {
      height: 76px;
      padding: 0 24px;
      background: rgba(255, 255, 255, 0.9);
      border-bottom: 3px solid rgba(58, 128, 82, 0.14);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(68, 118, 79, 0.08);
    }

    .room-info {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .room-title {
      font-size: 24px;
      font-weight: 900;
      white-space: nowrap;
      color: #245538;
      letter-spacing: -0.04em;
    }

    .room-code {
      padding: 9px 14px;
      border-radius: 999px;
      background: #e1f8d7;
      color: #2c8b45;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 1px;
      white-space: nowrap;
      border: 2px solid rgba(44, 139, 69, 0.16);
    }

    .host-badge {
      padding: 9px 14px;
      border-radius: 999px;
      background: #fff1b8;
      color: #9b6b00;
      font-size: 16px;
      font-weight: 900;
      white-space: nowrap;
      border: 2px solid rgba(155, 107, 0, 0.14);
    }

    .leave-room-btn {
      padding: 9px 14px;
      border: none;
      border-radius: 999px;
      background: #ffe4e4;
      color: #b53434;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      white-space: nowrap;
      border: 2px solid rgba(181, 52, 52, 0.14);
      box-shadow: 0 5px 0 rgba(181, 52, 52, 0.18);
    }

    .leave-room-btn:active {
      transform: translateY(3px);
      box-shadow: 0 2px 0 rgba(181, 52, 52, 0.18);
    }

    .stadium-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8), transparent 24%),
        linear-gradient(#c9f3bd, #8fdc95);
      position: relative;
      overflow: hidden;
    }

    .viewer-area {
      flex: 1 1 auto;
      min-height: 0;
      padding: 12px 18px 10px;
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 28%),
        linear-gradient(#efffe9, #d8f6cf);
      border-bottom: 3px solid rgba(52, 122, 70, 0.12);
      display: flex;
      flex-direction: column;
    }

    .controls-toggle-btn {
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      background: #eef7ff;
      color: #356485;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      border: 2px solid rgba(53, 100, 133, 0.12);
      box-shadow: 0 6px 12px rgba(53, 100, 133, 0.08);
    }

    .stadium-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .viewer-toolbar {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 10px;
      align-items: center;
      flex-shrink: 0;
    }

    .top-right-tools {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .header-zoom-toolbar {
      margin-bottom: 0;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    .header-zoom-toolbar button {
      height: 42px;
      min-width: 42px;
    }

    .header-zoom-toolbar #iframeZoomLabel {
      min-width: 54px;
    }

    .top-viewer-toolbar {
      width: min(680px, 52vw);
      grid-template-columns: minmax(220px, 1fr) auto auto;
    }

    .top-viewer-toolbar input {
      height: 46px;
      font-size: 15px;
      border-radius: 15px;
    }

    .top-viewer-toolbar button {
      height: 46px;
      padding: 0 14px;
      font-size: 15px;
      border-radius: 15px;
      box-shadow: 0 5px 0 #319851;
    }

    .top-viewer-toolbar button.secondary {
      box-shadow: 0 5px 0 rgba(53, 100, 133, 0.22);
    }

    .local-viewer-toolbar {
      margin-bottom: 12px;
      grid-template-columns: minmax(220px, 1fr) auto auto;
    }

    .local-viewer-toolbar input {
      height: 46px;
      font-size: 15px;
      border-radius: 15px;
    }

    .local-viewer-toolbar button {
      height: 46px;
      padding: 0 14px;
      font-size: 15px;
      border-radius: 15px;
      box-shadow: 0 5px 0 #319851;
    }

    .local-viewer-toolbar button.secondary {
      box-shadow: 0 5px 0 rgba(53, 100, 133, 0.22);
    }

    .viewer-toolbar input {
      height: 54px;
      border: none;
      border-radius: 18px;
      padding: 0 18px;
      background: #ffffff;
      color: #26342d;
      font-size: 18px;
      font-weight: 800;
      outline: 3px solid rgba(52, 122, 70, 0.12);
      box-shadow: inset 0 4px 12px rgba(68, 118, 79, 0.06);
      min-width: 0;
    }

    .viewer-toolbar input::placeholder {
      color: #8ba697;
    }

    .viewer-toolbar button {
      height: 54px;
      padding: 0 18px;
      border: none;
      border-radius: 18px;
      background: #55c878;
      color: #ffffff;
      font-size: 18px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 7px 0 #319851;
      white-space: nowrap;
    }

    .viewer-toolbar button.secondary {
      background: #eef7ff;
      color: #356485;
      box-shadow: 0 7px 0 rgba(53, 100, 133, 0.22);
      border: 3px solid rgba(53, 100, 133, 0.12);
    }

    .viewer-toolbar button:active {
      transform: translateY(4px);
      box-shadow: 0 3px 0 rgba(49, 152, 81, 0.7);
    }

    .viewer-frame-wrap {
      flex: 1 1 auto;
      min-height: 360px;
      border-radius: 26px;
      background: #ffffff;
      border: 4px solid rgba(52, 122, 70, 0.16);
      overflow: hidden;
      box-shadow: 0 14px 34px rgba(41, 82, 49, 0.14);
      position: relative;
    }

    .room-page.is-controls-hidden .controls {
      display: none;
    }

    .iframe-zoom-toolbar {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    .iframe-zoom-toolbar button {
      min-width: 42px;
      height: 38px;
      padding: 0 12px;
      border: none;
      border-radius: 13px;
      background: #eef7ff;
      color: #356485;
      font-size: 18px;
      font-weight: 900;
      cursor: pointer;
      border: 2px solid rgba(53, 100, 133, 0.12);
      box-shadow: 0 4px 0 rgba(53, 100, 133, 0.18);
    }

    .iframe-zoom-toolbar button:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 rgba(53, 100, 133, 0.18);
    }

    #iframeZoomLabel {
      min-width: 58px;
      text-align: center;
      font-size: 15px;
      font-weight: 900;
      color: #356485;
    }

    .viewer-frame-wrap {
      overflow: auto;
    }

    .viewer-frame-inner {
      width: 100%;
      height: 100%;
      transform-origin: top left;
    }

    .viewer-placeholder {
      width: 100%;
      height: 100%;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: #5f7f6b;
      font-size: 20px;
      font-weight: 900;
      line-height: 1.5;
      background:
        radial-gradient(circle at top, rgba(85, 200, 120, 0.12), transparent 36%),
        #ffffff;
    }

    .viewer-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      background: #ffffff;
    }

    .audience-area {
    flex: none;
    height: 150px;
    position: relative;
    overflow: visible;
    z-index: 30;
      background:
        radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.55), transparent 24%),
        linear-gradient(rgba(255,255,255,0.22) 2px, transparent 2px),
        linear-gradient(90deg, rgba(255,255,255,0.18) 2px, transparent 2px),
        linear-gradient(#b9ecaa, #73cd82);
      background-size: auto, 54px 54px, 54px 54px, auto;
    }

    .stand-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 42px;
      background: rgba(255, 255, 255, 0.14);
      border-top: 2px solid rgba(255,255,255,0.28);
      border-bottom: 2px solid rgba(60, 120, 74, 0.12);
    }

    .stand-line.line-1 {
      bottom: 0;
    }

    .stand-line.line-2 {
      bottom: 42px;
      opacity: 0.72;
    }

    .stand-line.line-3 {
      bottom: 84px;
      opacity: 0.42;
    }

    .effect-layer {
      position: absolute;
      left: 0;
      right: 0;
      top: -200px;
      bottom: 0;
      pointer-events: none;
      z-index: 90;
      overflow: visible;
    }

    .characters-layer {
      position: absolute;
      inset: 0;
      z-index: 20;
      pointer-events: none;
    }

    .character {
      position: absolute;
      left: 50%;
      bottom: 24px;
      width: 108px;
      height: 170px;
      transform: translate(-50%, var(--jump-y, 0px));
      text-align: center;
      transition: none;
      z-index: 20;
      will-change: left, transform;
    }

    .fire-aura {
      position: absolute;
      left: 50%;
      bottom: 2px;
      width: 160px;
      height: 160px;
      transform: translateX(-50%) scale(0.9);
      pointer-events: none;
      opacity: 0;
      z-index: 2;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 128px;
      line-height: 1;
      filter: drop-shadow(0 12px 18px rgba(255, 86, 34, 0.38));
    }

    .character.is-burning .fire-aura {
      opacity: 0.5;
      animation: bigFirePulse 0.42s ease-in-out infinite alternate;
    }

    @keyframes bigFirePulse {
      from {
        transform: translateX(-50%) scale(0.9) rotate(-3deg);
      }

      to {
        transform: translateX(-50%) scale(1.05) rotate(3deg);
      }
    }

    .bubble-stack {
      position: absolute;
      left: 50%;
      bottom: 130px;
      transform: translateX(-50%);
      width: 230px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 100;
      pointer-events: none;
    }

    .speech-bubble {
      position: relative;
      max-width: 210px;
      min-width: 86px;
      padding: 10px 14px;
      border-radius: 18px;
      background: #ffffff;
      color: #26342d;
      font-size: 16px;
      font-weight: 900;
      line-height: 1.3;
      word-break: break-word;
      box-shadow: 0 10px 22px rgba(50, 94, 59, 0.18);
      border: 3px solid rgba(48, 112, 68, 0.1);
      opacity: 0;
      transform: translateY(8px) scale(0.96);
      animation: bubbleIn 0.18s ease-out forwards;

      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .speech-bubble:last-child::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -9px;
      width: 18px;
      height: 18px;
      background: #ffffff;
      border-right: 3px solid rgba(48, 112, 68, 0.08);
      border-bottom: 3px solid rgba(48, 112, 68, 0.08);
      transform: translateX(-50%) rotate(45deg);
    }

    .speech-bubble.is-removing {
      animation: bubbleOut 0.18s ease-in forwards;
    }

    @keyframes bubbleIn {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes bubbleOut {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      to {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
    }

    .nickname {
      position: absolute;
      left: 50%;
      bottom: 96px;
      transform: translateX(-50%);
      display: inline-block;
      max-width: 130px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(36, 85, 56, 0.82);
      color: #ffffff;
      font-size: 16px;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 6;
      box-shadow: 0 8px 16px rgba(39, 94, 54, 0.16);
    }

    .avatar {
      position: absolute;
      left: 50%;
      bottom: 40px;
      transform: translateX(-50%);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 4px solid #fff;
      background: #ffd7a8;
      box-shadow: 0 8px 18px rgba(38, 87, 51, 0.18);
      z-index: 4;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .avatar::before,
    .avatar::after {
      content: "";
      position: absolute;
      top: 20px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #26342d;
    }

    .avatar::before {
      left: 15px;
    }

    .avatar::after {
      right: 15px;
    }

    .avatar-mouth {
      position: absolute;
      left: 50%;
      top: 34px;
      width: 16px;
      height: 8px;
      border-bottom: 3px solid #26342d;
      border-radius: 0 0 999px 999px;
      transform: translateX(-50%);
      z-index: 5;
    }

    .avatar.has-face-image {
      background-color: #ffffff;
    }

    .avatar.has-face-image::before,
    .avatar.has-face-image::after,
    .avatar.has-face-image .avatar-mouth {
      display: none;
    }

    .body {
      position: absolute;
      left: 50%;
      bottom: 8px;
      transform: translateX(-50%);
      width: 48px;
      height: 40px;
      border-radius: 20px 20px 16px 16px;
      background: red;
      box-shadow: 0 10px 18px rgba(38, 87, 51, 0.16);
      z-index: 3;
      border: 4px solid rgba(255,255,255,0.8);
    }

    .particle {
      position: absolute;
      font-size: 42px;
      animation: particlePop 1.15s ease-out forwards;
      will-change: transform, opacity;
      filter: drop-shadow(0 8px 10px rgba(45, 88, 54, 0.18));
    }
    .particle.is-small-reaction {
      font-size: 26px;
    }

    @keyframes particlePop {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(0.65) rotate(0deg);
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(var(--x), var(--y)) scale(1.55) rotate(var(--r));
      }
    }

    .ball {
      position: absolute;
      font-size: 44px;
      animation: ballFly 1.15s ease-out forwards;
      will-change: transform, opacity;
      filter: drop-shadow(0 8px 10px rgba(45, 88, 54, 0.2));
    }

    @keyframes ballFly {
      0% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1) rotate(0deg);
      }

      100% {
        opacity: 0;
        transform:
          translate(
            calc(-50% + var(--ball-x, 0px)),
            var(--ball-y, -130px)
          )
          scale(0.9)
          rotate(var(--ball-rotate, 520deg));
      }
    }

    .chat-log {
      position: absolute;
      right: 18px;
      bottom: 18px;
      width: 390px;
      max-height: 210px;
      padding: 16px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.94);
      border: 3px solid rgba(52, 122, 70, 0.16);
      display: none;
      overflow: hidden;
      z-index: 80;
      box-shadow: 0 14px 34px rgba(41, 82, 49, 0.18);
    }

    .chat-log.is-open {
      display: block;
    }

    .chat-log-title {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 900;
      color: #39754c;
    }

    .chat-log-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 17px;
      line-height: 1.35;
    }

    .chat-line {
      color: #26342d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 700;
    }

    .chat-line strong {
      color: #2c9b51;
      margin-right: 4px;
    }

    .stadium-header {
      height: 52px;
      padding: 0 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.88);
      border-top: 3px solid rgba(52, 122, 70, 0.12);
      border-bottom: 3px solid rgba(52, 122, 70, 0.1);
      flex-shrink: 0;
      z-index: 12;
      box-shadow: 0 -6px 18px rgba(41, 82, 49, 0.06);
    }

    .stadium-title {
      font-size: 20px;
      font-weight: 900;
      color: #245538;
      letter-spacing: -0.04em;
    }

    .chat-log-toggle {
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      background: #e1f8d7;
      color: #2d7d43;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      border: 2px solid rgba(45, 125, 67, 0.12);
      box-shadow: 0 6px 12px rgba(45, 125, 67, 0.08);
    }

    .controls {
      min-height: 118px;
      padding: 16px 18px;
      background: rgba(255, 255, 255, 0.92);
      border-top: 3px solid rgba(52, 122, 70, 0.1);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 14px;
      align-items: center;
      flex-shrink: 0;
      z-index: 10;
    }

    .reaction-row {
      display: flex;
      gap: 10px;
    }

    .reaction-btn,
    .move-btn {
      min-width: 58px;
      height: 58px;
      border: none;
      border-radius: 18px;
      background: #f0ffe9;
      color: #245538;
      font-size: 28px;
      font-weight: 900;
      cursor: pointer;
      border: 3px solid rgba(52, 122, 70, 0.14);
      box-shadow: 0 8px 0 rgba(52, 122, 70, 0.16);
    }

    .move-btn {
      padding: 0 16px;
      font-size: 22px;
      background: #eef7ff;
      color: #356485;
      border-color: rgba(53, 100, 133, 0.15);
      box-shadow: 0 8px 0 rgba(53, 100, 133, 0.14);
    }

    .reaction-btn:active,
    .move-btn:active {
      transform: translateY(5px);
      box-shadow: 0 3px 0 rgba(52, 122, 70, 0.16);
    }

    .chat-form {
      display: flex;
      gap: 10px;
      min-width: 0;
    }

    .chat-form input {
      flex: 1;
      height: 62px;
      min-width: 0;
      border: none;
      border-radius: 20px;
      padding: 0 20px;
      background: #ffffff;
      color: #26342d;
      outline: 3px solid rgba(52, 122, 70, 0.12);
      font-size: 20px;
      font-weight: 800;
      box-shadow: inset 0 4px 12px rgba(68, 118, 79, 0.06);
    }

    .chat-form input::placeholder {
      color: #8ba697;
    }

    .chat-form input:focus {
      outline: 4px solid rgba(83, 198, 116, 0.35);
    }

    .chat-form button {
      width: 86px;
      height: 62px;
      border: none;
      border-radius: 20px;
      background: #55c878;
      color: #ffffff;
      font-size: 20px;
      font-weight: 900;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: 0 8px 0 #319851;
    }

    .chat-form button:active {
      transform: translateY(5px);
      box-shadow: 0 3px 0 #319851;
    }

    .move-row {
      display: flex;
      gap: 10px;
    }

    @media (max-width: 720px) {
      body {
        overflow: auto;
      }

      .room-page {
        min-height: 100vh;
        height: auto;
      }

      .top-bar {
        height: auto;
        min-height: 72px;
        padding: 14px;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 12px;
      }

      .room-info {
        width: 100%;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 8px;
      }

      .room-title {
        font-size: 22px;
      }

      .room-code,
      .host-badge {
        font-size: 15px;
      }

      .viewer-area {
        min-height: 260px;
        padding: 12px;
      }

      .viewer-toolbar {
        grid-template-columns: 1fr;
      }

      .viewer-toolbar input,
      .viewer-toolbar button {
        width: 100%;
        height: 52px;
        font-size: 16px;
      }

      .audience-area {
        height: 300px;
      }

      .character {
        width: 100px;
        height: 160px;
      }

      .bubble-stack {
        bottom: 124px;
        width: 210px;
        gap: 5px;
      }

      .speech-bubble {
        max-width: 185px;
        font-size: 14px;
        padding: 9px 12px;
      }

      .nickname {
        font-size: 15px;
        bottom: 91px;
      }

      .avatar {
        width: 56px;
        height: 56px;
        bottom: 38px;
      }

      .avatar::before,
      .avatar::after {
        top: 20px;
      }

      .body {
        width: 44px;
        height: 36px;
      }

      .controls {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 14px;
      }

      .reaction-row,
      .move-row {
        justify-content: center;
      }

      .reaction-btn,
      .move-btn {
        flex: 1;
        max-width: 86px;
        height: 56px;
      }

      .chat-form input {
        height: 58px;
        font-size: 18px;
      }

      .chat-form button {
        height: 58px;
        font-size: 18px;
      }

      .stadium-header {
        height: 50px;
      }

      .stadium-title {
        font-size: 18px;
      }

      .chat-log-toggle {
        font-size: 15px;
      }

      .chat-log {
        left: 14px;
        right: 14px;
        bottom: 14px;
        width: auto;
      }

      .stadium-header {
        gap: 10px;
      }

      .stadium-header-actions {
        gap: 8px;
      }

      .iframe-zoom-toolbar button,
      .controls-toggle-btn,
      .chat-log-toggle {
        padding: 9px 12px;
        font-size: 14px;
      }

      .top-right-tools {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .header-zoom-toolbar {
        width: 100%;
        margin-bottom: 0;
        justify-content: flex-end;
        padding-right: 2px;
      }

      .header-zoom-toolbar button {
        height: 40px;
        min-width: 42px;
        padding: 0 12px;
      }

      .header-zoom-toolbar #iframeZoomLabel {
        min-width: 54px;
      }

    .local-toast {
      position: fixed;
      left: 50%;
      bottom: 150px;
      transform: translateX(-50%) translateY(12px);
      padding: 12px 18px;
      border-radius: 999px;
      background: rgba(16, 24, 32, 0.9);
      color: #ffffff;
      font-size: 16px;
      font-weight: 900;
      line-height: 1.3;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .local-toast.is-show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .top-viewer-toolbar {
      width: 100%;
      grid-template-columns: 1fr;
    }

    .top-viewer-toolbar input,
    .top-viewer-toolbar button {
      width: 100%;
    }
  </style>
</head>

<body>
  <div class="room-page">
    <header class="top-bar">
      <div class="room-info">
        <div class="room-title">온라인 구장</div>
        <div class="room-code">방 코드 <?php echo $safe_room_code; ?></div>
        
        <button type="button" class="leave-room-btn" id="leaveRoomBtn">
          나가기
        </button>

        <?php if ($is_host): ?>
          <div class="host-badge">방장</div>
        <?php endif; ?>
      </div>

    <div class="top-right-tools">
      <?php if ($is_host): ?>
        <div class="viewer-toolbar top-viewer-toolbar">
          <input
            type="url"
            id="viewerUrlInput"
            placeholder="관전할 웹 링크를 입력하세요. 예) https://example.com"
          />
          <button type="button" id="viewerApplyBtn">화면 공유</button>
          <button type="button" class="secondary" id="viewerOpenBtn">새 창</button>
        </div>
      <?php endif; ?>

      <div class="iframe-zoom-toolbar header-zoom-toolbar">
        <button type="button" id="iframeZoomOutBtn">-</button>
        <span id="iframeZoomLabel">100%</span>
        <button type="button" id="iframeZoomInBtn">+</button>
        <button type="button" id="iframeZoomResetBtn">초기화</button>
      </div>
    </div>
  </header>

    <section class="stadium-section">
      <div class="viewer-area">
        <?php if (!$is_host): ?>
          <div class="viewer-toolbar local-viewer-toolbar">
            <input
              type="url"
              id="localViewerUrlInput"
              placeholder="내 화면에서만 볼 링크를 입력하세요. 예) https://example.com"
            />
            <button type="button" id="localViewerApplyBtn">내 화면 열기</button>
            <button type="button" class="secondary" id="globalViewerReturnBtn">공용 화면 보기</button>
          </div>
        <?php endif; ?>
                
        <div class="viewer-frame-wrap" id="viewerFrameWrap">
          <div class="viewer-placeholder">
            여기에 관전할 웹 화면이 크게 표시됩니다.<br>
            일부 사이트는 iframe 표시가 차단될 수 있어요.
          </div>
        </div>
      </div>

      <div class="audience-area" id="audienceArea">
        <div class="stand-line line-1"></div>
        <div class="stand-line line-2"></div>
        <div class="stand-line line-3"></div>

        <div class="effect-layer" id="effectLayer"></div>

        <div class="characters-layer" id="charactersLayer"></div>

        <div class="chat-log" id="chatLog">
          <div class="chat-log-title">최근 채팅</div>
          <div class="chat-log-list" id="chatLogList">
            <div class="chat-line">방 입장!</div>
          </div>
        </div>
      </div>

      <div class="stadium-header">
        <div class="stadium-title">가상 관중석</div>

        <div class="stadium-header-actions">
        
          <button type="button" class="chat-log-toggle" id="chatLogToggle">
            채팅 로그 보기
          </button>

          <button type="button" class="controls-toggle-btn" id="controlsToggleBtn">
            버튼 숨기기
          </button>
        </div>
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
          <button type="button" class="move-btn" id="jumpBtn">점프</button>
          <button type="button" class="move-btn" id="moveRightBtn">▶</button>
        </div>
      </div>
    </section>
  </div>

  <div class="local-toast" id="localToast"></div>

  <script>
    let myCharacter = null;
    let myBubbleStack = null;
    let myNickname = null;

    const audienceArea = document.getElementById("audienceArea");
    const effectLayer = document.getElementById("effectLayer");
    const charactersLayer = document.getElementById("charactersLayer");

    const roomCode = "<?php echo $safe_room_code; ?>";
    let myParticipantId = <?php echo (int)$participant_id; ?>;

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatLogToggle = document.getElementById("chatLogToggle");
    const chatLog = document.getElementById("chatLog");
    const chatLogList = document.getElementById("chatLogList");

    const roomPage = document.querySelector(".room-page");
    const controlsToggleBtn = document.getElementById("controlsToggleBtn");

    const moveLeftBtn = document.getElementById("moveLeftBtn");
    const moveRightBtn = document.getElementById("moveRightBtn");
    const jumpBtn = document.getElementById("jumpBtn");
    const leaveRoomBtn = document.getElementById("leaveRoomBtn");

    const viewerUrlInput = document.getElementById("viewerUrlInput");
    const viewerApplyBtn = document.getElementById("viewerApplyBtn");
    const viewerOpenBtn = document.getElementById("viewerOpenBtn");
    const viewerFrameWrap = document.getElementById("viewerFrameWrap");

    const iframeZoomOutBtn = document.getElementById("iframeZoomOutBtn");
    const iframeZoomInBtn = document.getElementById("iframeZoomInBtn");
    const iframeZoomResetBtn = document.getElementById("iframeZoomResetBtn");
    const iframeZoomLabel = document.getElementById("iframeZoomLabel");
    
    const localViewerUrlInput = document.getElementById("localViewerUrlInput");
    const localViewerApplyBtn = document.getElementById("localViewerApplyBtn");
    const globalViewerReturnBtn = document.getElementById("globalViewerReturnBtn");

    const savedNickname = localStorage.getItem("stadium_nickname");

    const localToast = document.getElementById("localToast");
    const displayNickname = savedNickname || "나";

    let myX = 50;
    let jumpY = 0;
    let fireTimer = null;
    let currentViewerUrl = "";
    let lastAppliedViewerUrl = "";

    let iframeZoom = 1;
    let iframeZoomHoldTimer = null;
    let iframeZoomHoldInterval = null;

    let isLocalViewerMode = false;
    let latestGlobalViewerUrl = "";

    const handledEventIds = new Set();
    const handledMessageIds = new Set();

    const reactionCooldowns = {
      "❤️": 0,
      "🎉": 0
    };

    const REACTION_COOLDOWN_TIME = 5000;

    let isMovingLeft = false;
    let isMovingRight = false;
    let lastMoveDirection = "up";

    let isJumping = false;
    let jumpStartTime = 0;

    let animationFrameId = null;

    let lastPositionSendAt = 0;
    let lastSentX = null;
    const POSITION_SEND_INTERVAL = 80;

    const MOVE_SPEED = 0.18;
    const REMOTE_SMOOTH_AMOUNT = 0.18;

    const MIN_X = 6;
    const MAX_X = 94;

    const JUMP_DURATION = 520;
    const JUMP_HEIGHT = 58;

    function setMyPosition() {
      if (!myCharacter) {
        return;
      }

      myCharacter.style.left = myX + "%";
      myCharacter.style.setProperty("--jump-y", `${jumpY}px`);
    }

    function updateRemoteCharactersSmoothly() {
      document.querySelectorAll(".character[data-participant-id]:not(.is-me)").forEach((character) => {
        const targetX = Number(character.dataset.targetX || 50);
        let currentX = Number(character.dataset.currentX || targetX);

        const nextX = currentX + (targetX - currentX) * REMOTE_SMOOTH_AMOUNT;

        if (targetX < currentX - 0.05) {
          character.dataset.lastMoveDirection = "left";
        }

        if (targetX > currentX + 0.05) {
          character.dataset.lastMoveDirection = "right";
        }

        if (Math.abs(targetX - nextX) < 0.05) {
          currentX = targetX;
        } else {
          currentX = nextX;
        }

        character.dataset.currentX = currentX;
        character.style.left = currentX + "%";
      });
    }
    
    function triggerCharacterJumpByParticipantId(participantId) {
      const character = document.querySelector(`.character[data-participant-id="${participantId}"]`);

      if (!character) {
        return;
      }

      const jumpStart = performance.now();

      function animateRemoteJump(now) {
        const elapsed = now - jumpStart;
        const progress = Math.min(elapsed / JUMP_DURATION, 1);
        const jumpCurve = Math.sin(progress * Math.PI);
        const remoteJumpY = -JUMP_HEIGHT * jumpCurve;

        character.style.setProperty("--jump-y", `${remoteJumpY}px`);

        if (progress < 1) {
          requestAnimationFrame(animateRemoteJump);
        } else {
          character.style.setProperty("--jump-y", "0px");
        }
      }

      requestAnimationFrame(animateRemoteJump);
    }

    function handleRoomEvents(events) {
      events.forEach((event) => {
        const eventId = Number(event.id);

        if (handledEventIds.has(eventId)) {
          return;
        }

        handledEventIds.add(eventId);

        const participantId = Number(event.participant_id);

        /*
          내 이벤트는 이미 내 화면에서 즉시 실행했으니까 다시 실행하지 않음
        */
        if (participantId === Number(myParticipantId)) {
          return;
        }

        if (event.event_type === "jump") {
          triggerCharacterJumpByParticipantId(participantId);
          return;
        }

        triggerReactionByEventType(participantId, event.event_type);
      });

      if (handledEventIds.size > 200) {
        handledEventIds.clear();
      }
    }

    function handleRoomMessages(messages) {
      messages.forEach((messageItem) => {
        const messageId = Number(messageItem.id);

        if (handledMessageIds.has(messageId)) {
          return;
        }

        handledMessageIds.add(messageId);

        const participantId = Number(messageItem.participant_id);
        const nickname = messageItem.nickname || "익명";
        const message = messageItem.message || "";

        /*
          내 메시지는 이미 내 화면에서 즉시 표시했으니까 다시 표시하지 않음
        */
        if (participantId === Number(myParticipantId)) {
          return;
        }

        const character = document.querySelector(`.character[data-participant-id="${participantId}"]`);

        if (character) {
          showBubbleForCharacter(character, message);
        }

        addChatLog(nickname, message);
      });

      if (handledMessageIds.size > 300) {
        handledMessageIds.clear();
      }
    }
    
    function triggerReactionByEventType(participantId, eventType) {
      const character = document.querySelector(`.character[data-participant-id="${participantId}"]`);

      if (!character) {
        return;
      }

      if (eventType === "heart") {
        createReactionParticlesForCharacter(character, "❤️");
        return;
      }

      if (eventType === "fire") {
        showFireAuraForCharacter(character);
        return;
      }

      if (eventType === "party") {
        createReactionParticlesForCharacter(character, "🎉");
        return;
      }

      if (eventType === "ball") {
        shootBallForCharacter(character);
        return;
      }
    }

    function sendMyPositionIfNeeded() {
      if (!myCharacter) {
        return;
      }

      const now = Date.now();

      if (now - lastPositionSendAt < POSITION_SEND_INTERVAL) {
        return;
      }

      if (lastSentX !== null && Math.abs(lastSentX - myX) < 0.4) {
        return;
      }

      lastPositionSendAt = now;
      lastSentX = myX;

      const formData = new FormData();
      formData.append("x_position", myX);

      fetch("api/update_position.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.warn(data.message || "위치 저장 실패");
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
        
    function jump(options = {}) {
      const shouldSendEvent = options.sendEvent !== false;

      if (isJumping) {
        return;
      }

      isJumping = true;
      jumpStartTime = performance.now();

      if (shouldSendEvent) {
        sendJumpEvent();
      }
    }

    function sendJumpEvent() {
      const formData = new FormData();
      formData.append("event_type", "jump");

      fetch("api/send_event.php", {
        method: "POST",
        body: formData
      })
        .then(response => {
          return response.text();
        })
        .then(text => {

          let data;

          try {
            data = JSON.parse(text);
          } catch (error) {
            console.error("send_event.php JSON 파싱 실패:", error);
            return;
          }

          if (!data.success) {
            console.warn(data.message || "점프 이벤트 저장 실패");
          }
        })
        .catch(error => {
          console.error("점프 이벤트 요청 실패:", error);
        });
    }

    function getEventTypeFromReaction(reaction) {
      if (reaction === "❤️") {
        return "heart";
      }

      if (reaction === "🔥") {
        return "fire";
      }

      if (reaction === "🎉") {
        return "party";
      }

      if (reaction === "⚽") {
        return "ball";
      }

      return "";
    }

    function sendReactionEvent(reaction) {
      const eventType = getEventTypeFromReaction(reaction);

      if (!eventType) {
        return;
      }

      const formData = new FormData();
      formData.append("event_type", eventType);

      fetch("api/send_event.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.warn(data.message || "이모티콘 이벤트 저장 실패");
          }
        })
        .catch(error => {
          console.error(error);
        });
    }

    function sendChatMessage(message) {
      const formData = new FormData();
      formData.append("message", message);

      fetch("api/send_message.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.warn(data.message || "메시지 저장 실패");
          }
        })
        .catch(error => {
          console.error("메시지 요청 실패:", error);
        });
    }

    function setLastMoveDirection(direction) {
      lastMoveDirection = direction;

      if (myCharacter) {
        myCharacter.dataset.lastMoveDirection = direction;
      }
    }

    function updateCharacterMotion(now) {
      if (isMovingLeft && !isMovingRight) {
        myX = Math.max(MIN_X, myX - MOVE_SPEED);
        setLastMoveDirection("left");
      }

      if (isMovingRight && !isMovingLeft) {
        myX = Math.min(MAX_X, myX + MOVE_SPEED);
        setLastMoveDirection("right");
      }

      if (isJumping) {
        const elapsed = now - jumpStartTime;
        const progress = Math.min(elapsed / JUMP_DURATION, 1);

        // 0 → 1 → 0 형태의 부드러운 점프 곡선
        const jumpCurve = Math.sin(progress * Math.PI);

        jumpY = -JUMP_HEIGHT * jumpCurve;

        if (progress >= 1) {
          isJumping = false;
          jumpY = 0;
        }
      }

      setMyPosition();
      updateRemoteCharactersSmoothly();

      if (isMovingLeft || isMovingRight) {
        sendMyPositionIfNeeded();
      }

      animationFrameId = requestAnimationFrame(updateCharacterMotion);
    }

    function startCharacterLoop() {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = requestAnimationFrame(updateCharacterMotion);
    }

    let isFetchingRoomState = false;
    function fetchRoomState() {
      if (isFetchingRoomState) {
        return;
      }

      isFetchingRoomState = true;

      fetch(`api/get_state.php?code=${encodeURIComponent(roomCode)}&_=${Date.now()}`, {
        cache: "no-store"
      })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.warn(data.message || "방 상태를 가져오지 못했습니다.");
            return;
          }

          if (data.me && data.me.participant_id) {
            myParticipantId = Number(data.me.participant_id);
          }

          if (data.room && data.room.iframe_url) {
            latestGlobalViewerUrl = data.room.iframe_url;

            if (!isLocalViewerMode) {
              renderViewerUrl(data.room.iframe_url);
            }
          }

          renderParticipants(data.participants || []);
          handleRoomEvents(data.events || []);
          handleRoomMessages(data.messages || []);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          isFetchingRoomState = false;
        });
    }

    function renderParticipants(participants) {
      const aliveIds = new Set();
      const total = participants.length;

      participants.forEach((participant, index) => {
        const participantId = Number(participant.id);
        const isMe = participantId === Number(myParticipantId);

        aliveIds.add(String(participantId));

        let character = document.querySelector(`.character[data-participant-id="${participantId}"]`);

        if (!character) {
          character = createCharacterElement(participant, isMe);
          charactersLayer.appendChild(character);
        }

        character.dataset.participantId = participantId;
        character.classList.toggle("is-me", isMe);

        const nicknameEl = character.querySelector(".nickname");
        const avatarEl = character.querySelector(".avatar");

        const nicknameText = participant.nickname || "익명";
        const isHost = Number(participant.is_host) === 1;

        nicknameEl.textContent = isHost ? `👑 ${nicknameText}` : nicknameText;

        const faceImage = participant.face_image || "";

        if (faceImage) {
          avatarEl.classList.add("has-face-image");
          avatarEl.style.backgroundImage = `url("${faceImage}")`;
        } else {
          avatarEl.classList.remove("has-face-image");
          avatarEl.style.backgroundImage = "";
        }

        let displayX = Number(participant.x_position || 50);

        if (isMe) {
          if (!myCharacter) {
            myX = displayX;
          }

          displayX = myX;

          myCharacter = character;
          myBubbleStack = character.querySelector(".bubble-stack");
          myNickname = character.querySelector(".nickname");

          character.dataset.currentX = displayX;
          character.dataset.targetX = displayX;
          character.style.left = displayX + "%";
        } else {
          character.dataset.targetX = displayX;

          if (!character.dataset.currentX) {
            character.dataset.currentX = displayX;
            character.style.left = displayX + "%";
          }
        }
      });

      document.querySelectorAll(".character[data-participant-id]").forEach(character => {
        if (!aliveIds.has(character.dataset.participantId)) {
          character.remove();
        }
      });
    }

    function createCharacterElement(participant, isMe) {
      const character = document.createElement("div");
      character.className = isMe ? "character is-me" : "character";
      character.dataset.participantId = participant.id;
      character.style.left = (participant.x_position || 50) + "%";
      character.style.setProperty("--jump-y", "0px");

      const fireAura = document.createElement("div");
      fireAura.className = "fire-aura";
      fireAura.textContent = "🔥";

      const bubbleStack = document.createElement("div");
      bubbleStack.className = "bubble-stack";

      const nickname = document.createElement("div");
      nickname.className = "nickname";
      const nicknameText = participant.nickname || "익명";
      const isHost = Number(participant.is_host) === 1;

      nickname.textContent = isHost ? `👑 ${nicknameText}` : nicknameText;

      const avatar = document.createElement("div");
      avatar.className = "avatar";

      if (participant.face_image) {
        avatar.classList.add("has-face-image");
        avatar.style.backgroundImage = `url("${participant.face_image}")`;
      }

      const mouth = document.createElement("div");
      mouth.className = "avatar-mouth";

      const body = document.createElement("div");
      body.className = "body";

      avatar.appendChild(mouth);

      character.appendChild(fireAura);
      character.appendChild(bubbleStack);
      character.appendChild(nickname);
      character.appendChild(avatar);
      character.appendChild(body);

      return character;
    }

    function showBubble(message) {
      if (!myBubbleStack) {
        return;
      }

      while (myBubbleStack.children.length >= 2) {
        const oldestBubble = myBubbleStack.firstElementChild;

        if (oldestBubble) {
          oldestBubble.remove();
        } else {
          break;
        }
      }

      const bubble = document.createElement("div");
      bubble.className = "speech-bubble";
      bubble.textContent = message;

      myBubbleStack.appendChild(bubble);

      setTimeout(() => {
        removeBubble(bubble);
      }, 5000);
    }

    function showBubbleForCharacter(character, message) {
      if (!character) {
        return;
      }

      const bubbleStack = character.querySelector(".bubble-stack");

      if (!bubbleStack) {
        return;
      }

      while (bubbleStack.children.length >= 2) {
        const oldestBubble = bubbleStack.firstElementChild;

        if (oldestBubble) {
          oldestBubble.remove();
        } else {
          break;
        }
      }

      const bubble = document.createElement("div");
      bubble.className = "speech-bubble";
      bubble.textContent = message;

      bubbleStack.appendChild(bubble);

      setTimeout(() => {
        removeBubble(bubble);
      }, 5000);
    }

    function removeBubble(bubble) {
      if (!bubble || !bubble.parentElement) {
        return;
      }

      bubble.classList.add("is-removing");

      setTimeout(() => {
        if (bubble.parentElement) {
          bubble.remove();
        }
      }, 180);
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

    function normalizeUrl(url) {
      const trimmed = url.trim();

      if (!trimmed) {
        return "";
      }

      const withProtocol =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : "https://" + trimmed;

      try {
        const parsed = new URL(withProtocol);

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return "";
        }

        return parsed.href;
      } catch (error) {
        return "";
      }
    }

    function updateIframeZoom() {
      const inner = viewerFrameWrap.querySelector(".viewer-frame-inner");

      if (!inner) {
        if (iframeZoomLabel) {
          iframeZoomLabel.textContent = `${Math.round(iframeZoom * 100)}%`;
        }

        return;
      }

      inner.style.width = `${100 / iframeZoom}%`;
      inner.style.height = `${100 / iframeZoom}%`;
      inner.style.transform = `scale(${iframeZoom})`;

      if (iframeZoomLabel) {
        iframeZoomLabel.textContent = `${Math.round(iframeZoom * 100)}%`;
      }
    }

    function zoomIframe(delta) {
      iframeZoom = Math.max(0.5, Math.min(2.5, iframeZoom + delta));
      iframeZoom = Math.round(iframeZoom * 10) / 10;

      updateIframeZoom();
    }

    function resetIframeZoom() {
      iframeZoom = 1;
      updateIframeZoom();

      viewerFrameWrap.scrollLeft = 0;
      viewerFrameWrap.scrollTop = 0;
    }

    function startIframeZoomHold(delta) {
      zoomIframe(delta);

      clearTimeout(iframeZoomHoldTimer);
      clearInterval(iframeZoomHoldInterval);

      iframeZoomHoldTimer = setTimeout(() => {
        iframeZoomHoldInterval = setInterval(() => {
          zoomIframe(delta);
        }, 90);
      }, 280);
    }

    function stopIframeZoomHold() {
      clearTimeout(iframeZoomHoldTimer);
      clearInterval(iframeZoomHoldInterval);

      iframeZoomHoldTimer = null;
      iframeZoomHoldInterval = null;
    }

    function bindIframeZoomHoldButton(button, delta) {
      if (!button) {
        return;
      }

      const start = (e) => {
        e.preventDefault();
        startIframeZoomHold(delta);
      };

      button.addEventListener("mousedown", start);
      button.addEventListener("touchstart", start, { passive: false });

      window.addEventListener("mouseup", stopIframeZoomHold);
      window.addEventListener("touchend", stopIframeZoomHold);
      window.addEventListener("touchcancel", stopIframeZoomHold);
    }

    function renderViewerUrl(url) {
      const normalizedUrl = normalizeUrl(url);

      if (!normalizedUrl) {
        return;
      }

      if (lastAppliedViewerUrl === normalizedUrl) {
        return;
      }

      lastAppliedViewerUrl = normalizedUrl;
      currentViewerUrl = normalizedUrl;

      if (viewerUrlInput) {
        viewerUrlInput.value = normalizedUrl;
      }

      viewerFrameWrap.innerHTML = "";

      const inner = document.createElement("div");
      inner.className = "viewer-frame-inner";

      const iframe = document.createElement("iframe");
      iframe.className = "viewer-frame";
      iframe.src = normalizedUrl;
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";

      inner.appendChild(iframe);
      viewerFrameWrap.appendChild(inner);

      updateIframeZoom();
    }

    function applyLocalViewerUrl() {
      if (!localViewerUrlInput) {
        return;
      }

      const url = normalizeUrl(localViewerUrlInput.value);

      if (!url) {
        alert("올바른 링크를 입력해주세요.");
        localViewerUrlInput.focus();
        return;
      }

      isLocalViewerMode = true;
      renderViewerUrl(url);
    }

    function returnToGlobalViewer() {
      isLocalViewerMode = false;

      if (latestGlobalViewerUrl) {
        renderViewerUrl(latestGlobalViewerUrl);
        return;
      }

      viewerFrameWrap.innerHTML = `
        <div class="viewer-placeholder">
          여기에 관전할 웹 화면이 크게 표시됩니다.<br>
          일부 사이트는 iframe 표시가 차단될 수 있어요.
        </div>
      `;

      currentViewerUrl = "";
      lastAppliedViewerUrl = "";
      resetIframeZoom();
    }

    function applyViewerUrl() {
      if (!viewerUrlInput) {
        return;
      }

      const url = normalizeUrl(viewerUrlInput.value);

      if (!url) {
        alert("올바른 링크를 입력해주세요.");
        viewerUrlInput.focus();
        return;
      }

      renderViewerUrl(url);

      const formData = new FormData();
      formData.append("iframe_url", url);

      fetch("api/update_viewer.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            console.warn(data.message || "화면 링크 저장 실패");
            alert(data.message || "화면 링크 저장에 실패했습니다.");
            return;
          }

          currentViewerUrl = data.iframe_url || url;
          lastAppliedViewerUrl = currentViewerUrl;
        })
        .catch(error => {
          console.error("화면 링크 저장 실패:", error);
        });
    }

    function openViewerUrl() {
      if (!currentViewerUrl && viewerUrlInput) {
        const url = normalizeUrl(viewerUrlInput.value);

        if (!url) {
          alert("먼저 올바른 링크를 입력해주세요.");
          viewerUrlInput.focus();
          return;
        }

        currentViewerUrl = url;
      }

      if (!currentViewerUrl) {
        return;
      }

      window.open(currentViewerUrl, "_blank", "noopener,noreferrer");
    }

    function createReactionParticles(emoji) {
      if (!myCharacter) {
        return;
      }

      const layerRect = effectLayer.getBoundingClientRect();
      const charRect = myCharacter.getBoundingClientRect();

      const originX = charRect.left - layerRect.left + charRect.width / 2;
      const originY = charRect.top - layerRect.top + 120;

      const isSmallReaction = emoji === "❤️" || emoji === "🎉";
      const particleCount = isSmallReaction ? 8 : 18;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = isSmallReaction
          ? "particle is-small-reaction"
          : "particle";

        particle.textContent = emoji;

        const spreadX = isSmallReaction ? 130 : 220;
        const spreadYStart = isSmallReaction ? 55 : 90;
        const spreadYRange = isSmallReaction ? 80 : 130;

        const randomX = (Math.random() * spreadX - spreadX / 2).toFixed(0) + "px";
        const randomY = (-spreadYStart - Math.random() * spreadYRange).toFixed(0) + "px";
        const randomRotate = (Math.random() * 360 - 180).toFixed(0) + "deg";

        particle.style.left = originX + "px";
        particle.style.top = originY + "px";
        particle.style.setProperty("--x", randomX);
        particle.style.setProperty("--y", randomY);
        particle.style.setProperty("--r", randomRotate);

        effectLayer.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 1200);
      }
    }

    function createReactionParticlesForCharacter(character, emoji) {
      if (!character) {
        return;
      }

      const layerRect = effectLayer.getBoundingClientRect();
      const charRect = character.getBoundingClientRect();

      const originX = charRect.left - layerRect.left + charRect.width / 2;
      const originY = charRect.top - layerRect.top + 120;

      const isSmallReaction = emoji === "❤️" || emoji === "🎉";
      const particleCount = isSmallReaction ? 8 : 18;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = isSmallReaction
          ? "particle is-small-reaction"
          : "particle";

        particle.textContent = emoji;

        const spreadX = isSmallReaction ? 130 : 220;
        const spreadYStart = isSmallReaction ? 55 : 90;
        const spreadYRange = isSmallReaction ? 80 : 130;

        const randomX = (Math.random() * spreadX - spreadX / 2).toFixed(0) + "px";
        const randomY = (-spreadYStart - Math.random() * spreadYRange).toFixed(0) + "px";
        const randomRotate = (Math.random() * 360 - 180).toFixed(0) + "deg";

        particle.style.left = originX + "px";
        particle.style.top = originY + "px";
        particle.style.setProperty("--x", randomX);
        particle.style.setProperty("--y", randomY);
        particle.style.setProperty("--r", randomRotate);

        effectLayer.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 1200);
      }
    }

    function triggerReaction(reaction, options = {}) {
      const shouldSendEvent = options.sendEvent !== false;

      if (!canUseCooldownReaction(reaction)) {
        return;
      }

      if (reaction === "🔥") {
        showFireAura();

        if (shouldSendEvent) {
          sendReactionEvent(reaction);
        }

        return;
      }

      if (reaction === "⚽") {
        shootBall();

        if (shouldSendEvent) {
          sendReactionEvent(reaction);
        }

        return;
      }

      createReactionParticles(reaction);

      if (shouldSendEvent) {
        sendReactionEvent(reaction);
      }
    }

    function canUseCooldownReaction(reaction) {
      if (!(reaction in reactionCooldowns)) {
        return true;
      }

      const now = Date.now();
      const lastUsedAt = reactionCooldowns[reaction];
      const elapsed = now - lastUsedAt;

      if (elapsed < REACTION_COOLDOWN_TIME) {
        const remainSeconds = Math.ceil((REACTION_COOLDOWN_TIME - elapsed) / 1000);
        showLocalToast(`${remainSeconds}초 후 다시 사용 가능합니다.`);
        return false;
      }

      reactionCooldowns[reaction] = now;
      return true;
    }
    function showFireAura() {
      if (!myCharacter) {
        return;
      }
      myCharacter.classList.add("is-burning");

      clearTimeout(fireTimer);

      fireTimer = setTimeout(() => {
        myCharacter.classList.remove("is-burning");
      }, 3000);
    }

    function getBallDirectionValues(direction) {
      if (direction === "left") {
        return {
          x: "-260px",
          y: "-40px",
          rotate: "-520deg"
        };
      }

      if (direction === "right") {
        return {
          x: "210px",
          y: "-40px",
          rotate: "520deg"
        };
      }

      return {
        x: "0px",
        y: "-130px",
        rotate: "520deg"
      };
    }

    function shootBall() {
      if (!myCharacter) {
        return;
      }

      const layerRect = effectLayer.getBoundingClientRect();
      const charRect = myCharacter.getBoundingClientRect();

      const originX = charRect.left - layerRect.left + charRect.width / 2;
      const originY = charRect.top - layerRect.top + 135;

      const direction = myCharacter.dataset.lastMoveDirection || lastMoveDirection || "up";
      const ballValues = getBallDirectionValues(direction);

      const ball = document.createElement("div");
      ball.className = "ball";
      ball.textContent = "⚽";
      ball.style.left = originX + "px";
      ball.style.top = originY + "px";
      ball.style.setProperty("--ball-x", ballValues.x);
      ball.style.setProperty("--ball-y", ballValues.y);
      ball.style.setProperty("--ball-rotate", ballValues.rotate);

      effectLayer.appendChild(ball);

      setTimeout(() => {
        ball.remove();
      }, 1200);
    }

    function showFireAuraForCharacter(character) {
      if (!character) {
        return;
      }

      character.classList.add("is-burning");

      clearTimeout(character._fireTimer);

      character._fireTimer = setTimeout(() => {
        character.classList.remove("is-burning");
      }, 3000);
    }

    function shootBallForCharacter(character) {
      if (!character) {
        return;
      }

      const layerRect = effectLayer.getBoundingClientRect();
      const charRect = character.getBoundingClientRect();

      const originX = charRect.left - layerRect.left + charRect.width / 2;
      const originY = charRect.top - layerRect.top + 135;

      const direction = character.dataset.lastMoveDirection || "up";
      const ballValues = getBallDirectionValues(direction);

      const ball = document.createElement("div");
      ball.className = "ball";
      ball.textContent = "⚽";
      ball.style.left = originX + "px";
      ball.style.top = originY + "px";
      ball.style.setProperty("--ball-x", ballValues.x);
      ball.style.setProperty("--ball-y", ballValues.y);
      ball.style.setProperty("--ball-rotate", ballValues.rotate);

      effectLayer.appendChild(ball);

      setTimeout(() => {
        ball.remove();
      }, 1200);
    }

    if (viewerApplyBtn) {
      viewerApplyBtn.addEventListener("click", applyViewerUrl);
    }

    if (viewerOpenBtn) {
      viewerOpenBtn.addEventListener("click", openViewerUrl);
    }

    if (viewerUrlInput) {
      viewerUrlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyViewerUrl();
        }
      });
    }

    if (localViewerApplyBtn) {
      localViewerApplyBtn.addEventListener("click", applyLocalViewerUrl);
    }

    if (globalViewerReturnBtn) {
      globalViewerReturnBtn.addEventListener("click", returnToGlobalViewer);
    }

    if (localViewerUrlInput) {
      localViewerUrlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyLocalViewerUrl();
        }
      });
    }

    bindIframeZoomHoldButton(iframeZoomOutBtn, -0.1);
    bindIframeZoomHoldButton(iframeZoomInBtn, 0.1);

    if (iframeZoomResetBtn) {
      iframeZoomResetBtn.addEventListener("click", resetIframeZoom);
    }

    function bindHoldButton(button, direction) {
      const start = (e) => {
        e.preventDefault();

        if (direction === "left") {
          isMovingLeft = true;
          setLastMoveDirection("left");
        }

        if (direction === "right") {
          isMovingRight = true;
          setLastMoveDirection("right");
        }
      };

      const stop = () => {
        if (direction === "left") {
          isMovingLeft = false;
        }

        if (direction === "right") {
          isMovingRight = false;
        }
      };

      button.addEventListener("mousedown", start);
      button.addEventListener("touchstart", start, { passive: false });

      window.addEventListener("mouseup", stop);
      window.addEventListener("touchend", stop);
      window.addEventListener("touchcancel", stop);
    }

    bindHoldButton(moveLeftBtn, "left");
    bindHoldButton(moveRightBtn, "right");

    jumpBtn.addEventListener("click", jump);
    leaveRoomBtn.addEventListener("click", leaveRoom);

    document.addEventListener("keydown", (e) => {
      if (
        document.activeElement === chatInput ||
        (viewerUrlInput && document.activeElement === viewerUrlInput) ||
        (localViewerUrlInput && document.activeElement === localViewerUrlInput)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "-" || key === "_") {
        e.preventDefault();

        if (!e.repeat) {
          startIframeZoomHold(-0.1);
        }

        return;
      }

      if (key === "+" || key === "=") {
        e.preventDefault();

        if (!e.repeat) {
          startIframeZoomHold(0.1);
        }

        return;
      }

      if (key === "0") {
        e.preventDefault();
        resetIframeZoom();
        return;
      }

    if (key === " ") {
      e.preventDefault();
      jump();
      return;
    }

    if (key === "enter") {
      e.preventDefault();
      chatInput.focus();
      return;
    }

      if (key === "q") {
        e.preventDefault();

        if (!e.repeat) {
          triggerReaction("❤️");
        }

        return;
      }

      if (key === "w") {
        e.preventDefault();

        if (!e.repeat) {
          triggerReaction("🔥");
        }

        return;
      }

      if (key === "e") {
        e.preventDefault();

        if (!e.repeat) {
          triggerReaction("🎉");
        }

        return;
      }

      if (key === "r") {
        e.preventDefault();

        if (!e.repeat) {
          triggerReaction("⚽");
        }

        return;
      }

      if (key === "arrowleft" || key === "a") {
        e.preventDefault();
        isMovingLeft = true;
        setLastMoveDirection("left");
        return;
      }

      if (key === "arrowright" || key === "d") {
        e.preventDefault();
        isMovingRight = true;
        setLastMoveDirection("right");
        return;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (
        e.key === "-" ||
        e.key === "_" ||
        e.key === "+" ||
        e.key === "="
      ) {
        stopIframeZoomHold();
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        isMovingLeft = false;
      }

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        isMovingRight = false;
      }
    });

    document.querySelectorAll(".reaction-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const reaction = btn.dataset.reaction;
        triggerReaction(reaction);
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
      sendChatMessage(message);

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
    controlsToggleBtn.addEventListener("click", toggleControlsVisibility);

    let localToastTimer = null;

    function toggleControlsVisibility() {
      roomPage.classList.toggle("is-controls-hidden");

      if (roomPage.classList.contains("is-controls-hidden")) {
        controlsToggleBtn.textContent = "버튼 보이기";
      } else {
        controlsToggleBtn.textContent = "버튼 숨기기";
      }
    }

    function showLocalToast(message) {
      localToast.textContent = message;
      localToast.classList.add("is-show");

      clearTimeout(localToastTimer);

      localToastTimer = setTimeout(() => {
        localToast.classList.remove("is-show");
      }, 1600);
    }

    function leaveRoom() {
      const confirmed = confirm("방에서 나가시겠습니까?");

      if (!confirmed) {
        return;
      }

      fetch("api/leave_room.php", {
        method: "POST"
      })
        .then(response => response.json())
        .then(data => {
          window.location.href = "index.html";
        })
        .catch(error => {
          console.error("방 나가기 실패:", error);
          window.location.href = "index.html";
        });
    }

    fetchRoomState();

    setInterval(() => {
      fetchRoomState();
    }, 150);

    startCharacterLoop();

    setTimeout(() => {
      showBubble("방 입장!");
    }, 1000);
  </script>
</body>
</html>