# SGComplaint CI/CD 적용 가이드

## 구성

- CI: GitHub-hosted Ubuntu에서 Java 17, Gradle 테스트, `bootJar` 생성
- CD: 운영 Ubuntu의 `sgadmin` self-hosted runner에서 수동 승인 배포
- 배포 대상: `/opt/sgcomplaint/app/sgcomplaint.jar`
- DB 변경: root 소유 `db-migrate.sh`가 Flyway info/migrate/validate/info 실행
- 검증: `http://127.0.0.1:9081/actuator/health`가 `UP`인지 확인
- 실패: 이전 JAR 복원. 이미 실행된 DB 마이그레이션은 자동 복원하지 않음

운영 배포 워크플로는 `workflow_dispatch` 전용이므로 GitHub에서 버튼을 눌러야 실행됩니다.

## 1. 최초 Git 저장소 생성

현재 프로젝트는 Git 저장소가 아닙니다. PowerShell에서 최초 한 번 실행합니다.

```powershell
cd C:\workspace\SGComplaint-React
git init
git branch -M main
git add .
git status
git commit -m "Add SGComplaint application and CI/CD"
```

GitHub에서 **Private** 빈 저장소를 만든 뒤, GitHub 화면에 표시되는 원격 저장소 주소를 사용합니다.

```powershell
git remote add origin 실제_GitHub_저장소_URL
git push -u origin main
```

첫 push 전에 `git status`에서 `.env`, 인증서, 개인키, 업로드 파일이 포함되지 않았는지 확인합니다.
기존 SOLAPI 키는 소스에 저장되어 있었으므로 반드시 폐기하고 새 키를 발급합니다.

## 2. 운영 환경변수 확인

`/etc/sgcomplaint/sgcomplaint.env`에 실제 값이 있어야 합니다. 값을 화면이나 GitHub에 붙여넣지 않습니다.

```text
DB_URL=...
DB_USERNAME=...
DB_PASSWORD=...
REMEMBER_ME_KEY=...
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
SOLAPI_SENDER=...
```

## 3. 운영 배포 도구 설치

FileZilla로 `deploy` 폴더를 `/home/sgadmin/cicd-deploy`에 업로드한 뒤 실행합니다.

```bash
cd /home/sgadmin/cicd-deploy
sudo bash install-cicd-deployment.sh
sudo -u sgadmin test -w /opt/sgcomplaint/incoming && echo INCOMING_WRITE_OK
sudo -u sgcomplaint test -r /opt/sgcomplaint/app/db-migrate.sh && echo MIGRATION_READ_OK
sudo visudo -cf /etc/sudoers.d/sgcomplaint-deploy
```

`/usr/local/sbin/sgcomplaint-deploy`와 운영의 `db-migrate.sh`는 root 소유입니다.
GitHub Actions는 JAR만 incoming 폴더에 올리고, 제한된 sudo 명령 하나만 실행합니다.
설치 후 app과 backup 폴더는 root 소유가 되므로 FileZilla로 운영 JAR를 직접 덮어쓰지 않습니다.
수동 긴급 배포가 필요하면 incoming 폴더에 JAR를 올린 뒤 배포 명령을 실행합니다.

```bash
sudo /usr/local/sbin/sgcomplaint-deploy
```

## 4. GitHub self-hosted runner 등록

GitHub 저장소에서 다음 메뉴로 이동합니다.

```text
Settings → Actions → Runners → New self-hosted runner → Linux → x64
```

Ubuntu에서 `sgadmin`으로 로그인한 뒤 GitHub 화면에 표시된 명령을 순서대로 실행합니다.
`config.sh` 명령 끝에는 다음 label을 추가합니다.

```text
--labels sgcomplaint-prod
```

등록 후 runner 설치 폴더에서 서비스로 등록합니다.

```bash
sudo ./svc.sh install sgadmin
sudo ./svc.sh start
sudo ./svc.sh status
```

GitHub Runners 화면에서 `Idle`이고 `self-hosted`, `linux`, `x64`, `sgcomplaint-prod` label이 보여야 합니다.
Self-hosted runner는 Private 저장소에서만 사용하고, fork의 workflow를 운영 서버에서 실행하지 않습니다.

## 5. GitHub production 환경 생성

```text
Settings → Environments → New environment → production
```

요금제에서 지원한다면 Required reviewers에 본인을 추가합니다. 운영 배포 전 수동 승인 단계가 됩니다.

## 6. CI 확인

GitHub의 Actions에서 `CI`가 성공해야 합니다.

```text
Checkout → Java 17 → Gradle → test → bootJar → artifact upload
```

CI에는 운영 DB와 SMS 비밀정보를 등록하지 않습니다. 테스트는 운영 DB를 사용하지 않아야 합니다.

## 7. 최초 운영 배포

1. 운영 DB와 업로드 파일을 백업합니다.
2. GitHub `Actions → Deploy production → Run workflow`를 선택합니다.
3. production 승인이 표시되면 승인합니다.
4. 마지막 단계에서 `DEPLOY_SUCCESS`를 확인합니다.

서버에서 확인합니다.

```bash
sudo systemctl status sgcomplaint --no-pager -l
curl --fail --max-time 10 http://127.0.0.1:9081/actuator/health
sudo journalctl -u sgcomplaint -n 100 --no-pager
ls -lh /opt/sgcomplaint/app/sgcomplaint.jar /opt/sgcomplaint/backup/
```

## 8. 실패와 롤백

- 마이그레이션 또는 Health 검증 실패 시 배포 스크립트가 이전 JAR를 복원합니다.
- Flyway DB 변경은 자동으로 되돌리지 않습니다.
- 모든 신규 마이그레이션은 이전 JAR와 호환되는 추가형 변경으로 작성합니다.
- 컬럼 삭제, 이름 변경, 데이터 대량 변경은 별도 DB 백업과 수동 승인 후 처리합니다.
- 실패한 Actions 로그와 `journalctl`의 최초 오류 및 마지막 `Caused by`를 확인합니다.

## 9. 자동 배포 전환 시점

수동 workflow로 정상 배포와 롤백을 각각 3회 이상 검증한 뒤에만 `main` push 자동 배포를 검토합니다.
CI 실패, DB 백업 미확인 또는 운영 runner Offline 상태에서는 배포하지 않습니다.
