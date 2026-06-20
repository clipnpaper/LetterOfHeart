# ✉️ 마음의 편지함 (Letter of Heart)

> **트릭컬 사도와 호칭 컨셉을 활용한 익명성 기반 마음의 편지함 게시판**
>
> 본 프로젝트는 이야기방 교주님들의 고충, 건의사항, 따뜻한 마음을 완전한 익명성 하에 나눌 수 있도록 설계된 주차별 익명 편지함 시스템입니다.

---

## 🚀 주요 특징 (Key Features)

1. **컨셉형 익명 닉네임 자동 부여**
   - 처음 접속할 때 고유 UUID가 발급되며, `{트릭컬 사도}의{호칭}` 조합으로 생성된 익명 닉네임이 자동으로 부여됩니다. (예: `캬롯의지휘관`, `시스트의대리인` 등)
   - 관리자 포털에서 사도 및 호칭 풀 변수를 완전히 커스터마이징할 수 있어 동적으로 다양한 조합을 만들어낼 수 있습니다.

2. **주차별(시즌제) 운영 및 아카이빙**
   - 매주 월요일 00시를 기점으로 신규 주차가 활성화되며, 작성 기능은 현재 주차에서만 지원합니다.
   - 지난 주차의 모든 글은 자동으로 읽기 전용 모드(아카이브)로 변경되어 안전하게 보존됩니다.

3. **마크다운/블록 기반 에디터**
   - 단순 텍스트뿐만 아니라 미디어(이미지/비디오 URL) 및 유튜브 비디오 임베드를 지원하는 반응형 블록형 에디터를 내장했습니다.
   - 자동 임시 저장 기능을 지원하여 작성 중 페이지가 이탈하더라도 유실되지 않습니다.

4. **강력한 콘텐츠 및 사용자 제재 시스템 (관리 데스크)**
   - 관리자 패스코드를 통해 진입하는 전용 포털(`http://localhost:5173/admin`)을 통해 부적절한 사용자 정지(Banned), 닉네임 강제 변경, 글 영구 삭제(Hard Delete), 공식 답변 댓글 작성을 지원합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Front-End (클라이언트)
- **Framework**: React (v18.x) & Vite (v6.x)
- **Routing**: React Router (v7.x)
- **Styling**: Vanilla CSS, Tailwind CSS (v4.x)
- **Icons**: Lucide React
- **Animation**: Motion (Framer Motion v12.x)

### Back-End (서버)
- **Runtime**: Node.js (Express v5.x)
- **Database**: 파일 기반 경량 JSON Database (`data/*.json`)
- **Environment**: Dotenv, CORS
- **Process Manager**: Nodemon (개발용)

---

## 📂 프로젝트 구조 (Directory Structure)

```bash
LetterOfHeart/
├── BackEnd/               # Express 백엔드 서버
│   ├── data/              # JSON 파일 DB (users, posts, reactions, settings)
│   ├── db.js              # 데이터베이스 매니저 모듈
│   ├── server.js          # 백엔드 API 서버 진입점
│   ├── package.json
│   └── .env
│
├── FrontEnd/              # React/Vite 프론트엔드 클라이언트
│   ├── src/
│   │   ├── app/           # React 컴포넌트, 라우터, 페이지
│   │   │   ├── pages/     # Admin, Board, GraphicKit, WritePost 페이지
│   │   │   └── Root.tsx   # 최상단 글로벌 레이아웃 (테마 및 닉네임 공유)
│   │   └── styles/        # CSS 디자인 시스템
│   ├── package.json
│   └── vite.config.ts
│
├── README.md              # 프로젝트 안내서
├── requirements.txt       # 시스템 및 종속성 사양서
└── .gitignore             # 깃 허브 업로드 제외 템플릿
```

---

## ⚙️ 실행 방법 (Getting Started)

### 1. 백엔드 서버 실행
```bash
cd BackEnd
npm install
npm run dev
```
> 백엔드 서버는 `http://localhost:5000`에서 대기하며 API 엔드포인트들을 노출합니다.

### 2. 프론트엔드 실행
```bash
cd FrontEnd
npm install
npm run dev
```
> 프론트엔드는 `http://localhost:5173` 브라우저 환경에서 로컬 테스트를 진행할 수 있습니다.

---

## 🔒 깃허브 업로드 가이드 (.gitignore 설정)

프로젝트 루트에 생성된 `.gitignore` 템플릿 파일은 깃허브 업로드 시 민감 정보 및 불필요한 캐시 에셋이 올라가는 것을 차단합니다. 주요 필터링 항목은 다음과 같습니다:

- `node_modules/`: 의존성 패키지 폴더 제외 (보안 및 용량 확보)
- `FrontEnd/dist/`: 빌드 압축 번들 제외
- `BackEnd/.env`: 관리자 패스코드나 API 포트 번호 등 환경 변수 파일 유출 방지
- `BackEnd/data/*.json`: 사용자 정보(`users.json`), 게시글 리스트(`posts.json`), 리액션 이력(`reactions.json`)과 같이 **동적으로 갱신되는 로컬 DB 파일** 업로드 방지 (단, 닉네임 변수 풀을 담고 있는 `settings.json`은 보존하여 기본값을 유지하도록 설정)

# 비밀번호 관리

- 관리자 비밀번호: "bolttaguneedmoney!"
- 관리자 포털 주소: http://localhost:5173/admin
- 부방장인 관리자의 아이디를 받을 경우, users.json의 해당 아이디의 role을 admin으로 수동으로 바꿔주시길 바랍니다. 또한 닉네임을 변경해주고 싶은 대상에게 닉네임을 바꿔줄 수 있습니다.