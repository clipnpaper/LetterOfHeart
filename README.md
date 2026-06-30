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
   - 관리자 로그인(닉네임 + 코드)으로 진입하는 포털(`http://localhost:5173/admin`)을 통해... (도둑이야 / 10293847)

---

## 🛠️ 기술 스택 (Tech Stack)

### Front-End (클라이언트)
- **Framework**: React (v18.x) & Vite (v6.x)
- **Routing**: React Router (v7.x)
- **Styling**: Vanilla CSS, Tailwind CSS (v4.x)
- **Icons**: Lucide React
- **Animation**: Motion (Framer Motion v12.x)

### The App (Go + React)
- **Runtime**: Go 1.26+ (single binary)
- **Web UI**: React + Vite (source lives in `web/`)
- **Database**: SQLite (embedded via modernc.org/sqlite)
- **Serving**: Go server handles both API (`/api`) and frontend (SPA)
- **Note**: One project for easy maintenance. Frontend is built into the Go binary or served by it.

---

## 📂 프로젝트 구조 (Directory Structure)

```bash
LetterOfHeart/                  # Modern Go full-stack app
├── cmd/
│   └── server/
│       └── main.go             # Entry point + HTTP handlers
├── internal/
│   └── db/
│       └── db.go               # SQLite + all data logic
├── web/                        # React + Vite frontend sources
│   └── src/ ...
├── data/                       # SQLite DB (letterofheart.db)
├── go.mod
├── Makefile                    # make dev | make build
├── dev.sh
└── README.md
```

---

## ⚙️ 실행 방법 (Getting Started)

### 1. Run Backend + Frontend on ONE single URL

The project is now set up so you only need to visit **one address** in the browser.

#### Development mode (recommended)
* **macOS / Linux**:
  ```bash
  make dev
  # or
  ./dev.sh
  ```
* **Windows (PowerShell)**:
  ```powershell
  # Go 컴파일러 설치가 필요합니다. (설치: winget install GoLang.Go)
  # Bash 환경(Git Bash 등)이 없을 경우 터미널 창을 각각 열어 다음 명령을 실행합니다:
  
  # 터미널 1 (Go 백엔드 실행)
  go run ./cmd/server
  
  # 터미널 2 (Vite 프론트엔드 실행)
  cd web
  npm run dev
  ```

- Visit: **http://localhost:5173**
- Vite automatically forwards all `/api` calls to the Go backend (same-origin, no CORS)
- You get fast hot-reload for the React frontend

#### Single binary (everything from one Go process)
* **macOS / Linux**:
  ```bash
  make build
  ./letterofheart
  ```
* **Windows (PowerShell)**:
  ```powershell
  # 1. 빌드 스크립트 실행 (권한 우회 포함)
  Set-ExecutionPolicy -Scope Process Bypass
  .\build.ps1
  
  # 2. 빌드된 바이너리 실행
  .\letterofheart.exe
  ```
→ Visit **http://localhost:5000**

### 2. Install dependencies (first time)
```bash
cd web && npm install   # or pnpm install
```

### 3. Admin access
> Admin login: 닉네임 + 코드 (예: 도둑이야 / 10293847)
> 첫 관리자 계정은 시드되어 있습니다. Backend verifies via /api/admin/login.

### 4. Other useful commands
* **macOS / Linux**:
  ```bash
  make dev          # dev on http://localhost:5173 (one URL)
  make build        # build full single binary (./letterofheart)
  make install      # install UI deps
  make clean
  ```
* **Windows (PowerShell)**:
  ```powershell
  # 빌드
  .\build.ps1
  
  # 청소 (Clean)
  Remove-Item -Recurse -Force web/dist
  Remove-Item -Force letterofheart.exe
  ```

## 🗄️ 데이터베이스 관리 (Database Administration)

SQLite 데이터베이스(`data/letterofheart.db`)를 웹 브라우저에서 편리하게 조회하고 관리할 수 있는 도구를 지원합니다.

* **macOS / Linux**:
  ```bash
  pip install sqlite-web
  sqlite-web data/letterofheart.db --port 8200
  ```
* **Windows (PowerShell)**:
  ```powershell
  # 제공된 데이터베이스 관리 스크립트 실행 (필요한 패키지를 자동 설치하고 실행합니다.)
  Set-ExecutionPolicy -Scope Process Bypass
  .\db-admin.ps1
  ```
→ 실행 후 브라우저에서 **http://localhost:8200**으로 접속하여 테이블 데이터 조회, 추가, 삭제, SQL 쿼리 작성을 수행할 수 있습니다.

---

## 🔒 깃허브 업로드 가이드 (.gitignore 설정)

프로젝트 루트에 생성된 `.gitignore` 템플릿 파일은 깃허브 업로드 시 민감 정보 및 불필요한 캐시 에셋이 올라가는 것을 차단합니다. 주요 필터링 항목은 다음과 같습니다:

- `node_modules/`: 의존성 패키지 폴더 제외 (보안 및 용량 확보)
- `web/dist/`: build output (embedded into Go binary)
- `.env`: optional environment file
- `data/*.db*`: local SQLite database


# 비밀번호 관리

- 관리자 로그인: 닉네임 + 코드
- 관리자 포털 주소: http://localhost:5173/admin
- 관리자 닉네임은 게시물 작성 및 댓글(답변) 시 표시됩니다.
