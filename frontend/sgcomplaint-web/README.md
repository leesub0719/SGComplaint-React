# SGComplaint React 웹

사용자 화면과 관리자 화면을 하나의 React SPA로 구성합니다. 접속 경로는
`/app`이며, 빌드 결과는 Spring Boot의 `src/main/resources/static/app`에
생성됩니다.

## 기능별 구조

```text
src/
├─ App.jsx                    전체 화면 경로
├─ pages/
│  ├─ home/                   메인
│  ├─ company/                회사소개
│  ├─ routes/                 노선안내
│  ├─ notices/                공지사항
│  ├─ complaints/             민원 목록·상세·작성
│  ├─ mypage/                 정보수정·문의내역
│  ├─ account/                로그인·가입·계정찾기
│  └─ admin/                  관리자 기능
└─ shared/                    API, 레이아웃, 공통 컴포넌트
```

## 로컬 실행

Spring Boot를 8080 포트에서 먼저 실행한 뒤 다음 명령을 실행합니다.

```powershell
cd C:\workspace\SGComplaint-React\frontend\sgcomplaint-web
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:5173/app/`으로 접속합니다.

## 운영 빌드

```powershell
npm.cmd run build
```

생성된 React 파일은 Spring Boot 실행 JAR에 함께 포함됩니다.
