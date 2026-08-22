# 실시간 교사용 진행판 켜는 방법

기본값은 꺼짐이다. 아래를 하지 않아도 앱은 로컬 저장·파일 내보내기로 완전히 동작한다.

현재 공개 배포는 `physgame-live-class-2026` 프로젝트를 기존 `physgame`과 공유한다. 배포 규칙에는
기존 `classes`와 `physgame2` 전용 `projectEchoClasses`가 함께 있으며, `firebase deploy --only database`
시 어느 한쪽을 삭제하지 않도록 `database.rules.json` 전체를 유지해야 한다.

## 1. Firebase 프로젝트 만들기 (직접 해야 하는 단계)

Claude는 여러분의 Google 계정에 로그인할 수 없어 이 단계는 직접 해야 한다.

1. https://console.firebase.google.com 에서 새 프로젝트를 만든다(무료 Spark 요금제로 충분하다).
2. 왼쪽 메뉴에서 **Build → Realtime Database**를 열고 데이터베이스를 만든다(위치는 서울 등 가까운 곳).
3. **규칙(Rules)** 탭에서 이 폴더의 `database.rules.json` 내용을 그대로 붙여넣고 게시한다.
4. **Build → Authentication**을 열고 로그인 방법에서 **익명(Anonymous)**을 사용 설정한다.
5. 프로젝트 설정(톱니바퀴) → **일반** 탭 → "내 앱"에서 웹 앱을 추가한다(앱 닉네임은 아무거나).
6. 나오는 `firebaseConfig` 값 6개 중 5개(apiKey, authDomain, databaseURL, projectId, appId)를 기록해 둔다.

이 값들은 비밀 키가 아니다. 브라우저 코드에 그대로 보이는 공개 웹 설정값이며, 실제 접근 제어는
`database.rules.json`의 규칙이 담당한다. 데이터는 `physgame`의 `classes`와 섞이지 않도록
`projectEchoClasses` 루트에만 저장된다.

## 2. 로컬에서 켜보기

### 실행 패키지에서 바로 설정

압축을 푼 뒤 `dist/firebase-config.json`을 열어 `enabled`를 `true`로 바꾸고 Firebase 웹 설정값 5개를
채운다. 다시 빌드할 필요 없이 `PROJECT_ECHO_실행.cmd`를 실행하면 된다. 이 파일의 값은 브라우저에
공개되는 Firebase 웹 설정값이며, 관리자 비밀 키를 넣으면 안 된다.

### 소스 개발 환경에서 설정

`web-app/.env`에 값을 채운다.

```bash
VITE_ENABLE_REALTIME_TEACHER_BOARD=true
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

`npm run dev` 후 교사용 화면에서 다음이 보이면 성공이다.

1. 1·2·3차시 탭 중 수업할 차시를 선택한다.
2. **실시간 수업 열기**를 누르면 6자리 코드와 해당 차시 QR이 생성된다.
3. 학생이 QR을 스캔하고 수업용 별칭을 입력하면 현재 접속 인원과 학생별 미션·문항 진행률이 표시된다.
4. 차시 탭을 바꾸면 같은 수업 코드를 유지하면서 Firebase 활성 차시와 QR이 함께 바뀐다.
5. 수업이 끝나면 **실시간 수업 종료**를 눌러 새 학생 참가를 막는다.

## 3. 배포(GitHub Pages)에서 켜기

저장소 **Settings → Secrets and variables → Actions**에서:

- **Secrets**(값이 가려짐, 그래도 최종 번들엔 노출된다는 점은 동일하다)에 `FIREBASE_API_KEY`,
  `FIREBASE_AUTH_DOMAIN`, `FIREBASE_DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` 추가
- **Variables**에 `VITE_ENABLE_REALTIME_TEACHER_BOARD` = `true` 추가

그 뒤 Actions 탭에서 `Deploy GitHub Pages` 워크플로를 다시 실행하면(또는 아무 커밋이나 push하면)
반영된다.

다른 정적 호스팅에 `dist`를 직접 올릴 때는 `dist/firebase-config.json`을 채운 상태로 업로드해도 된다.

## 개인정보 범위 (`database.rules.json`이 강제하는 것)

- 학생은 실명·학번이 아닌 2~12자 "수업용 별칭"만 입력한다.
- 전송되는 값: 별칭, 접속 여부, 차시, 단계, AR/비AR 모드, 완료 미션·문항 수, 현재 미션 ID,
  점수, 문항별 선택 번호·정오·시도 횟수, 마지막 접속 시각.
- 전송하지 않는 값: 실명, 학번, 사진·영상, 카메라 프레임, 위치, 자유서술·수치 입력 원문.
- 학생은 자기 자신의 데이터만 쓸 수 있고 다른 학생 데이터를 읽을 수 없다. 수업을 연 교사만 전체
  명단을 읽을 수 있다(모두 `database.rules.json`의 `.read`/`.write`/`.validate` 규칙으로 강제됨).

## 무료 한도

Firebase Spark 요금제 무료 한도는 동시 연결 100개다. 한 학급 단위로 사용한다.
