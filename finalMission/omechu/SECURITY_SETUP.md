# 오메추 보안·배포 설정 안내

이 공개 저장소에는 DB 비밀번호와 외부 서비스의 실제 API 키를 커밋하지 않습니다. 노출됐던 기존 자격 증명은 해당 제공자에서 먼저 폐기하고 재발급해야 합니다.

## 서버 실행 환경변수

- `OMECHU_DB_HOST` — MySQL 호스트
- `OMECHU_DB_USER` — MySQL 계정
- `OMECHU_DB_PASSWORD` — MySQL 비밀번호
- `OMECHU_DB_NAME` — MySQL DB 이름
- `REDTABLE_SERVICE_KEY` — RedTable 발급 키
- `KAKAO_MAPS_JS_KEY` — Kakao Maps JavaScript 앱 키 (브라우저에서 보이는 공개 키: 허용 도메인 제한 필수)

`workspace/backend/config/db.php`와 `workspace/backend/api/redtable_proxy.php`는 실행 환경에서 값을 읽습니다. 값이 없다면 해당 API는 실행되지 않으므로, 배포 호스팅에 위 변수를 설정하거나 공개 저장소 밖의 서버측 설정을 연결해야 합니다.

## Kakao 지도

`workspace/page/map.html`은 더 이상 앱 키를 HTML에 포함하지 않으며 `workspace/js/map_loader.js`를 사용합니다. 로더는 `workspace/backend/api/kakao_maps_config.php`를 호출합니다. **현재 main 브랜치에서는 이 설정 API 파일이 아직 준비되지 않았으므로 지도는 추가 설정 전 정상 동작하지 않습니다.** `project`와 `Project` 브랜치에 관련 구성 파일은 있지만 실서버 동작 검증은 수행하지 않았습니다. Kakao JavaScript 키는 브라우저 SDK 요청에 노출되는 성격이므로 발급처 도메인 제한을 반드시 설정해야 합니다.

## 중요: 이미 노출된 과거 Git 기록

현재 파일에서 값이 없어져도 과거 커밋·PR 캐시·포크는 남아 있을 수 있습니다. `git-filter-repo --sensitive-data-removal`로 **모든 브랜치/태그의 이력 정리**를 수행하고, 정리 후에도 남아 있는 GitHub PR 참조·캐시 제거는 GitHub Support에 문의하세요.

GitHub 공식 가이드: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## 개발 시 주의

- 실제 키·비밀번호를 GitHub 커밋·PR·Issue·Actions 로그에 기록하지 않기
- 노출된 기존 키는 저장소를 수정한 뒤에도 재사용하지 않기
- PHP 사용자 입력을 SQL 문자열에 직접 합치지 않고 Prepared Statement 적용하기
- HTTPS 인증서 검증을 비활성화하지 않기
- 공개 데모의 인증·DB·지도 동작은 별도 통합 테스트로 확인하기
