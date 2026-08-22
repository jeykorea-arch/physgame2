# PROJECT ECHO: 흔적 기록소 — web-app

고등학교 물리학 II `파동과 물질의 성질` 3차시 WebAR 학습 게임의 구현체. React + TypeScript + Vite 기반 정적 웹앱이다.

상위 PRD·데이터 계약·QA 기준은 `../docs/`, `../data/`, `../qa/`를 따른다.

## 빠른 시작

```bash
npm install
cp .env.example .env   # 필요 시 값 수정. 비워 두어도 핵심 수업 경로는 완전히 동작한다.
npm run dev
```

## 시험·빌드

```bash
npm run test           # vitest: 과학 계산 회귀 시험, 콘텐츠 계약 검증, 개인정보 시험 — 38개 통과
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run build           # 콘텐츠 계약 검증 → 정적 빌드(dist/) → dist/version.json 기록
npm run preview         # 빌드 결과 로컬 미리보기
npm run release:check   # lint + typecheck + test + build를 한 번에 (배포 전 확인용)
npm run release:archive # dist/를 releases/<버전>_<시각>/로 보관(롤백 대비)
npm run dev:mobile      # 자체 서명 HTTPS + LAN 접속 — 스마트폰 실기기(카메라·AR) 시험용
```

`npm run build`는 `physgame2/data/content_contract.json`, `marker_manifest.json`을 읽어 검증한 뒤
`public/data/`로 동기화한다. 즉 **PRD의 `data/` 폴더가 유일한 원본**이며, 이 폴더를 수정한 뒤
`npm run build`(또는 `npm run validate:content`)를 실행해야 앱에 반영된다.

## 환경 변수 (`.env`)

`.env.example`을 복사해 사용한다. 값을 채우지 않아도 핵심 수업(3차시, AR·비AR, 퀴즈, 채점, 저장, 익명
결과 내보내기)은 전부 로컬에서 동작한다. `VITE_FIREBASE_*`는 **사용자 승인 후** 실시간 교사용
진행판을 붙일 때만 채운다. 비밀 키를 소스 코드에 직접 넣지 않는다(`src/env.ts`가 유일한 접근 지점).

## 구현 범위 (2026-08-22 기준)

### 구현 완료 (자동 시험 통과)

- 3차시 전체 콘텐츠(선수학습 회상 → 20분 게임 → 교사 설명 → 확인 → 저장) 흐름
- 9개 미니 미션 + 보스 활동, 핵심 12문항(차시당 4개) — 전부 `docs/00`, `docs/02`의 과학 규칙을 반영
- 과학 계산 순수 함수 계층(`src/science/`)과 `docs/04`의 수치 회귀 시험 전부 통과
- 콘텐츠 계약(`content_contract.json`)·마커 매니페스트 검증기, 위반 fixture 실패 확인
- AR(MindAR 이미지 추적) 컨트롤러: 카메라 명시적 시작, 10초/20초 미인식 안내, 권한 거부·WebGL
  실패 시 비AR 전환, 마커 유실 시 진행 상태 유지
- 비AR 대체 경로(동일 콘텐츠·동일 채점)
- 로컬 저장(진행·답안·기술 이벤트), `physgame2.project-echo.*` 키 네임스페이스로 `physgame`과 분리
- 개인정보 시험: 실명·학번·사진·영상·카메라 프레임·위치 필드 자체가 데이터 모델에 없음을 코드로 보증
- 20분 강제 종료(18분 안내 배너 포함), 새로고침·화면 잠금 복귀 후 경과 시간 유지
- 교사용 화면: 45분 타이머, 차시별 설명 카드, 학생 익명 결과 JSON 여러 개 불러오기, 문항별 첫 시도
  정답률 집계, CSV/JSON 내보내기
- PWA 골격: `vite-plugin-pwa`(injectManifest) + Workbox. 앱 셸만 프리캐시하고, AR 번들·마커 자산은
  차시 진입 시에만 지연 로딩
- Vite `base: "./"` 상대 경로로 하위 경로 배포(GitHub Pages 등) 대응

### 아직 구현하지 않았거나 실제 기기 확인이 필요한 것 (완료로 보고하지 않음)

- **실제 스마트폰 카메라·마커 인식 시험 없음.** AR 컨트롤러는 MindAR 공식 API 계약대로 구현했지만,
  iPhone Safari·Android Chrome·인쇄 마커로 시험한 적이 없다(AGENTS.md 규칙 10).
- **차시별 AR 자산 분리 없음.** `targets.mind`는 3개 마커가 합쳐진 단일 파일(2.4MB, PRD 제공본
  그대로)이며, AR 시작 시에만 통째로 지연 로딩된다. 차시별로 다시 컴파일하려면 MindAR의 Node
  오프라인 컴파일러(`canvas` 네이티브 모듈)가 필요한데, 이 개발 환경에는 Visual Studio C++
  빌드 도구가 없어 설치가 실패했다. 브라우저용 사전 컴파일 결과물만 사용했다.
- **오프라인·서비스 워커 캐시 갱신을 실제 기기에서 시험하지 않음.** 빌드는 통과했지만 “최초 온라인
  접속 후 오프라인 재접속” 시나리오는 사람이 확인해야 한다.
- **새로고침 시 미션/문항 단위 재개는 부분적이다.** 차시 단계(진입/회상/게임/설명/확인/저장)와
  게임 20분 타이머는 새로고침 후에도 유지되지만, 게임 진행 중 새로고침하면 현재 진행 중이던 미니
  미션은 처음(관찰 단계)부터 다시 시작한다. 이미 채점된 문항 답안은 유실되지 않는다.
- **320×568 등 작은 화면·확대 200%·감소 모션의 자동 화면 캡처 시험 없음.** CSS로 대응은
  해두었지만(`prefers-reduced-motion`, 44px 터치 영역, `−/+` 대체 조작), 자동 스크린샷 회귀는
  아직 없다.
- **iOS 홈 화면 아이콘은 SVG만 제공한다.** iOS Safari의 "홈 화면에 추가"는 PNG 아이콘을 더 안정적으로
  지원하므로, 실제 배포 전 PNG 아이콘 추가가 필요할 수 있다.
- **실시간 교사용 진행판, Firebase 연결, 공개 배포는 만들지 않았다.** `docs/01`·`AGENTS.md`에 따라
  사용자 승인 없이는 착수하지 않는다.

## 구조

```text
web-app/
├─ src/
│  ├─ science/         파동·전자기파·양자 계산 순수 함수(단일 근거)
│  ├─ content/          콘텐츠 계약 타입·검증기·로더
│  ├─ storage/          progress/answer/session 모델, physgame2.project-echo.* 저장
│  ├─ ar/                MindAR 컨트롤러, 비AR 카드, 마커 레지스트리
│  ├─ lessons/           차시별 화면(진입~저장)과 미니 미션 컴포넌트
│  ├─ quiz/              공통 문항 컴포넌트(재시도·원리 안내·채점)
│  ├─ teacher/           교사용 화면과 결과 집계
│  └─ vendor/mind-ar/    MindAR 브라우저 번들 벤더링본(npm 패키지의 canvas 네이티브 빌드 회피)
├─ public/data/          content_contract.json 등 원본과 동기화되는 런타임 콘텐츠
├─ tests/                과학 회귀·콘텐츠 계약·개인정보 시험
└─ scripts/validate-content.mjs  빌드 전 계약 검증 + public/data 동기화
```

## 왜 `mind-ar` npm 패키지 대신 벤더링했는가

`mind-ar` npm 패키지는 Node 오프라인 컴파일러 의존성으로 `canvas`(네이티브 빌드)를 포함한다. 이
개발 환경(Windows, Visual Studio C++ 빌드 도구 없음)에서 `npm install`이 실패했다. 브라우저에서만
쓰는 이미지 추적 기능은 `mind-ar`가 CDN에 배포하는 사전 컴파일된 브라우저 번들
(`mindar-image-three.prod.js`)로 충분하므로, 이를 `src/vendor/mind-ar/`에 내려받아 사용했다.
Node 전용 폴백 코드(`require("node-fetch")` 등, 브라우저에서는 도달하지 않음)는 Vite 개발 서버의
정적 의존성 스캐너 오탐을 막기 위해 예외를 던지는 헬퍼로 치환했다(동작에는 영향 없음).
