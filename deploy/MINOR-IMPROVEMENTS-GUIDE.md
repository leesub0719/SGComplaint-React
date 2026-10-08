# 확인된 소규모 문제 개선 적용 가이드

## 반영된 내용

- 마이페이지 바로가기 링크 CSS 캐시 갱신 및 포커스 때만 노출
- 마이페이지 문의내역 10건 단위 서버 페이징
- 관리자 회원 검색 20건 단위 서버 페이징
- 회원·민원·공지·협력업체 검색을 포함 검색에서 접두어 검색으로 변경하고 인덱스 추가
- DB 영속 토큰 기반 14일 로그인 유지
- 관리자 공지·메인 배너·노선 삭제 스냅샷과 관리자 이력 저장
- 회원탈퇴 시 원래 아이디와 대체 아이디 이력 저장, 관리자 검색·상세화면에서 확인
- 탈퇴 개인정보 30일, 완료 민원 개인정보·첨부파일 365일 정책과 선택적 자동 파기

접두어 검색은 `검색어%` 방식입니다. 따라서 검색어가 중간에만 있는 데이터는 나오지 않습니다.
탈퇴 전 아이디는 보존기간 안에서만 관리자 회원 검색 및 상세화면에 표시됩니다.

## DB 변경

새 Flyway 파일은 `V2__minor_operational_improvements.sql`입니다.
다음 테이블이 추가됩니다.

- `persistent_logins`
- `sgtransit_admin_delete_audit`
- `sgtransit_withdrawal_id_history`

V1 파일은 변경하지 않았습니다. 기존 운영 DB에 baseline을 다시 수행하면 안 됩니다.

## 운영 반영 순서

1. `/etc/sgcomplaint/sgcomplaint.env`에 고정 키를 추가합니다.

```bash
openssl rand -base64 48
sudoedit /etc/sgcomplaint/sgcomplaint.env
```

출력값을 다음 환경변수 값으로 저장하고 이후에도 동일한 값을 유지합니다.

```text
REMEMBER_ME_KEY=생성한_고정값
DATA_RETENTION_CLEANUP_ENABLED=false
WITHDRAWN_PERSONAL_RETENTION_DAYS=30
COMPLAINT_ATTACHMENT_RETENTION_DAYS=365
DATA_RETENTION_BATCH_SIZE=200
```

`REMEMBER_ME_KEY`를 바꾸면 기존 로그인 유지 쿠키는 더 이상 사용할 수 없습니다.

2. 서비스를 중지하고 사용자가 보관한 방식으로 JAR·DB·업로드 파일을 백업합니다.

```bash
sudo touch /run/sgcomplaint-maintenance
sudo systemctl stop sgcomplaint
```

3. 새 JAR와 현재 `db-migrate.sh`를 업로드하고 권한을 확인합니다.

```bash
sudo chgrp sgcomplaint /opt/sgcomplaint/app/sgcomplaint.jar
sudo chmod 640 /opt/sgcomplaint/app/sgcomplaint.jar
sudo -u sgcomplaint test -r /opt/sgcomplaint/app/sgcomplaint.jar && echo READ_OK
```

4. V2를 먼저 적용합니다.

```bash
sudo bash /opt/sgcomplaint/app/db-migrate.sh info
sudo bash /opt/sgcomplaint/app/db-migrate.sh validate
sudo bash /opt/sgcomplaint/app/db-migrate.sh migrate
sudo bash /opt/sgcomplaint/app/db-migrate.sh validate
sudo bash /opt/sgcomplaint/app/db-migrate.sh info
```

운영 DB는 이미 baseline이 등록되어 있으므로 `check`와 `baseline`을 다시 실행하지 않습니다.
마지막 `info` 결과에서 V2가 Success여야 합니다. V2 없이 새 JAR를 먼저 실행하지 마세요.

5. 앱을 시작하고 확인합니다.

```bash
sudo systemctl start sgcomplaint
sudo systemctl status sgcomplaint --no-pager -l
curl --fail --max-time 10 http://127.0.0.1:9081/actuator/health
sudo rm -f /run/sgcomplaint-maintenance
```

마이페이지 문의 페이징, 관리자 회원 페이징·검색, 로그인 유지, 공지·배너·노선 삭제를 실제 화면에서 확인합니다.

## 자동 파기 활성화 전 사전 조회

아래 쿼리의 대상 건수와 백업을 먼저 확인합니다.

```sql
SELECT emp_no, emp_id, emp_name, updated_at
FROM sgtransit_employee
WHERE emp_status='N'
  AND updated_at < CURRENT_TIMESTAMP - INTERVAL 30 DAY
ORDER BY updated_at;

SELECT c.complaint_no, c.emp_name, c.updated_at,
       COUNT(DISTINCT a.attachment_no) complaint_files,
       COUNT(DISTINCT aa.answer_attachment_no) answer_files
FROM sgtransit_complaint c
LEFT JOIN sgtransit_complaint_attachment a ON a.complaint_no=c.complaint_no
LEFT JOIN sgtransit_complaint_answer ans ON ans.complaint_no=c.complaint_no
LEFT JOIN sgtransit_complaint_answer_attachment aa ON aa.answer_no=ans.answer_no
WHERE c.complaint_status='COMPLETED'
  AND c.updated_at < CURRENT_TIMESTAMP - INTERVAL 365 DAY
GROUP BY c.complaint_no, c.emp_name, c.updated_at
ORDER BY c.updated_at;
```

확인 후 `/etc/sgcomplaint/sgcomplaint.env`의 값을 바꾸고 서비스를 재시작합니다.

```text
DATA_RETENTION_CLEANUP_ENABLED=true
```

자동 파기는 매일 03:30(Asia/Seoul)에 최대 200건씩 처리합니다.
완료 민원 본문과 처리 이력은 남기되 민원인의 아이디·이름·전화번호를 비식별화하고,
민원 및 답변 첨부파일의 DB 행과 실제 파일을 삭제합니다.
탈퇴 회원은 원래 아이디 이력을 파기하고 이름·이메일·전화번호·주소·비밀번호를 비식별화합니다.

로그 확인:

```bash
sudo journalctl -u sgcomplaint --since today --no-pager | grep 'Retention cleanup'
```

## 삭제 이력 확인

```sql
SELECT audit_no, admin_emp_id, target_type, target_no,
       target_summary, deleted_at
FROM sgtransit_admin_delete_audit
ORDER BY audit_no DESC
LIMIT 100;

SELECT history_no, emp_no, original_emp_id, replacement_emp_id,
       change_reason, created_at, purge_after
FROM sgtransit_withdrawal_id_history
ORDER BY history_no DESC
LIMIT 100;
```

삭제 이력에는 공지 본문 전체를 저장하지 않고 식별에 필요한 제목·설정·파일 또는 노선 메타데이터만 저장합니다.
DB 자동 복원이나 삭제된 실제 파일 복원 기능은 포함하지 않습니다.

## 개발 DB에서 V2가 Duplicate key name으로 실패한 경우

최초 V2는 개발 DB에 이미 존재한 `idx_partner_name`을 다시 만들면서 중단될 수 있었습니다.
수정된 V2는 테이블은 `IF NOT EXISTS`, 인덱스는 `information_schema` 조회 후 없는 것만 생성합니다.

1. 실행 중인 개발 앱을 종료합니다.
2. 최신 `V2__minor_operational_improvements.sql`을 프로젝트에 덮어쓰고 Eclipse에서 프로젝트 새로고침과 Clean을 실행합니다.
3. DBeaver에서 `database/recover-failed-v2.sql`을 확인한 뒤 개발 DB `sgcomplaint`에 실행합니다.
   이 스크립트는 version 2이면서 success=0인 실패 이력만 삭제합니다.
4. PowerShell에서 다시 실행합니다.

```powershell
cd C:\workspace\SGComplaint-React
.\gradlew.bat dbMigrate
.\gradlew.bat dbValidate
.\gradlew.bat dbInfo
```

V2가 `Success`로 표시된 뒤 애플리케이션을 시작합니다.
운영 DB에서 V2를 아직 실행하지 않았다면 실패 이력 삭제 스크립트를 실행할 필요가 없습니다.
