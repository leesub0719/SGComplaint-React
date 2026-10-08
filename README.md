# SGComplaint React

Spring Boot·MyBatis 백엔드와 React 프론트엔드를 하나의 저장소에서 관리하는
민원 관리 프로젝트입니다. 모든 사용자·관리자 화면은 React로 구성하고,
백엔드는 JSON REST API와 파일 API를 제공합니다.

## 프로젝트 구조

```text
frontend/sgcomplaint-web/     React 화면
src/main/java/                Controller, Service, DTO, Mapper
src/main/resources/mapper/    MyBatis SQL 매핑
src/main/resources/db/        DB 마이그레이션
src/main/resources/static/app React 빌드 결과
performance/                  k6 성능 테스트
deploy/                       운영 배포 설정
```

화면 코드는 `frontend/sgcomplaint-web/src/pages` 아래에서 기능별로 나뉩니다.
공통 레이아웃과 서버 통신 코드는 `src/shared`에서 관리합니다.

## 실행

```powershell
cd frontend\sgcomplaint-web
npm.cmd install
npm.cmd run build
cd ..\..
.\gradlew.bat bootRun
```

실행 후 `http://localhost:8080/app/`으로 접속합니다. 개발 중 빠른 화면 확인은
React 폴더에서 `npm.cmd run dev`를 실행하고
`http://localhost:5173/app/`으로 접속합니다.

## 검증

```powershell
cd frontend\sgcomplaint-web
npm.cmd run build
cd ..\..
.\gradlew.bat clean test bootJar
```
