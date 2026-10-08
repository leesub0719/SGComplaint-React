# 6. 모니터링과 복구

## 추가 내용

- Spring Boot Actuator: 앱/DB 연결/저장 공간 상태 확인
- 관리 전용 주소: http://127.0.0.1:9081/actuator/health
- 노출 범위: health만 공개, 상세 정보는 숨김. env/heapdump/metrics 등은 차단.
- 1분 주기의 systemd 점검: sgcomplaint, mysql, nginx 서비스와 전체 health, 디스크 사용률
- 85% 이상 디스크 사용률 또는 상태 오류가 3회 연속이면 ALERT 기록
- 정상화 시 RECOVERED 기록. 지속 장애는 15회마다 재기록.
- 애플리케이션 프로세스 비정상 종료 시 15초 후 재시작, 5분 내 시작 횟수 최대 3회
- 수동 배포를 위한 점검 일시 중지 표시 파일
- 장애 진단용 상태/최근 로그 수집 명령

문자/메일/외부 알림 서비스는 연결하지 않았습니다. ALERT는 서버 journal 로그입니다.
앱이 살아 있지만 health가 DOWN인 경우에는 자동 재시작하지 않습니다.
DB 장애나 디스크 부족을 앱 재시작으로 해결하려고 반복하지 않도록 했습니다.
기존의 수동 백업 방식을 유지하며 DB 자동 복원/자동 JAR 롤백은 하지 않습니다.

## 운영 최초 적용

서버는 sgcomplaint/mysql/nginx systemd 서비스, 기본 앱 경로 /opt/sgcomplaint, 관리 포트 9081 기준입니다.
다른 서비스명이나 경로는 설치 전 스크립트에서 맞춰 주세요.
새 JAR는 별도로 빌드/업로드합니다. deploy 파일은 JAR에 포함하지 않습니다.
Flyway 테이블/마이그레이션 변경은 없으며 baseline을 다시 실행하지 않습니다.

1. 개발 프로젝트에 변경 파일을 반영하고 Gradle > Refresh Gradle Project 후 JAR를 빌드합니다.
2. 운영 서버에서 점검 일시 중지 표시를 만든 뒤 앱을 내립니다.

```bash
sudo touch /run/sgcomplaint-maintenance
sudo systemctl stop sgcomplaint
```

3. FileZilla로 다음 파일을 업로드합니다.
   - 새 JAR: /opt/sgcomplaint/app/sgcomplaint.jar
   - deploy 폴더: /opt/sgcomplaint/app/monitoring/ 폴더 아래에 내용물 업로드

monitoring/install-monitoring.sh와 monitoring/sgcomplaint-monitor.sh 등이 같은 폴더에 있어야 합니다.
기존 JAR 백업은 사용자의 수동 복사 방식으로 진행합니다.

4. 이전 배포 때 발생한 읽기 권한 문제를 방지합니다.
   sgadmin이 업로드 소유자이고 서비스 그룹이 sgcomplaint인 현재 구성 기준입니다.

```bash
sudo chgrp sgcomplaint /opt/sgcomplaint/app/sgcomplaint.jar
sudo chmod 640 /opt/sgcomplaint/app/sgcomplaint.jar
sudo -u sgcomplaint test -r /opt/sgcomplaint/app/sgcomplaint.jar && echo READ_OK
```

READ_OK가 없으면 서비스 시작 전에 경로/ACL을 확인하세요.

5. 설치합니다. 기존 ExecStart나 DB 환경파일은 덮어쓰지 않습니다.

```bash
sudo bash /opt/sgcomplaint/app/monitoring/install-monitoring.sh
sudo systemctl start sgcomplaint
sudo systemctl status sgcomplaint --no-pager -l
```

설치 도구는 별도 monitor unit과 90-monitoring-recovery.conf 파일을 설치합니다.
기존에 같은 이름의 파일을 직접 수정했다면 먼저 내용을 비교하세요.
기존 서비스의 Restart 설정은 이번 drop-in의 on-failure 정책으로 바뀝니다.

6. 정상 상태를 확인한 뒤 점검을 재개합니다.

```bash
curl --fail --max-time 10 http://127.0.0.1:9081/actuator/health
```

정상 응답에는 "status":"UP"가 포함됩니다. liveness/readiness 그룹 이름이 함께 표시될 수 있습니다. 이 확인이 성공한 뒤 실행하세요.

```bash
sudo rm -f /run/sgcomplaint-maintenance
sudo systemctl start sgcomplaint-monitor.service
sudo systemctl list-timers sgcomplaint-monitor.timer
sudo systemctl show sgcomplaint -p Restart -p RestartUSec -p StartLimitBurst -p StartLimitIntervalUSec
```

9081 포트는 서버의 localhost에서만 사용합니다.
공유기/방화벽에서 열거나 Nginx로 외부에 연결하지 마세요.
관리 포트를 변경하면 애플리케이션 MANAGEMENT_PORT, monitor.service의 MONITOR_PORT,
진단 스크립트의 health URL을 함께 수정해야 합니다.

## 평소 상태 확인

```bash
sudo systemctl status sgcomplaint --no-pager -l
curl --fail --max-time 10 http://127.0.0.1:9081/actuator/health
sudo journalctl -u sgcomplaint-monitor -n 50 --no-pager
sudo cat /var/lib/sgcomplaint-monitor/status
```

실시간 로그:

```bash
sudo journalctl -u sgcomplaint -u sgcomplaint-monitor -f
```

monitor.service의 failed 상태는 점검에서 이상을 발견했거나 점검 도구에 오류가 있었다는 뜻입니다.
로그의 사유를 확인하세요. timer는 다음 주기에도 다시 점검합니다.
서비스가 active여도 화면의 특정 기능까지 모두 정상이라는 뜻은 아니므로 실제 주요 기능도 확인하세요.

## 장애 발생 시

1. 재시작 전에 진단 자료를 수집합니다.

```bash
sudo bash /usr/local/lib/sgcomplaint/sgcomplaint-diagnose.sh
```

/var/lib/sgcomplaint-monitor/diagnostics/에 상태와 서비스별 최근 30분, 최대 300줄 로그를 저장합니다.
환경파일/DB 행은 수집하지 않지만 로그에는 개인정보가 있을 수 있습니다.
디렉터리는 root만 읽을 수 있도록 만들며 공유 전 민감정보를 가려야 합니다.
진단 자료는 자동 삭제하지 않습니다. 운영자가 필요에 따라 보관/정리하세요.

2. 원인별 조치:
   - 앱 종료: journal 로그의 최초 오류 확인. 설정/파일 권한/포트 충돌 해결 후 재시작.
   - DB 연결 오류: mysql 상태와 DB 접속 설정 확인. DB를 초기화하거나 Flyway repair로 우회하지 않음.
   - health UP인데 웹 접속 실패: Nginx, 외부 DNS/네트워크/인증서 확인.
   - 디스크 사용률 경고: df -h와 파일별 용량 확인. 업로드 파일/DB 파일을 임의로 삭제하지 않음.
   - 재시작 횟수 제한 도달: 원인을 해결한 뒤에만 reset-failed 실행.

```bash
sudo systemctl reset-failed sgcomplaint
sudo systemctl start sgcomplaint
```

3. health UP, active 유지, 로그인/민원 조회/첨부파일 등 실제 기능을 확인합니다.

## 이전 JAR 또는 DB 복구

자동 롤백 기능은 제공하지 않습니다. 먼저 현재 장애 로그와 DB 변경 이력을 확인하세요.

- DB 변경 없는 배포: 서비스를 중지하고 수동 보관한 호환 JAR로 교체 후 시작/기능 확인.
- DB 변경이 있는 배포: 이전 JAR만 덮어쓰면 호환되지 않을 수 있음. Flyway validate 오류를 무시하지 않음.
- DB 손상/데이터 복구: DB 백업뿐 아니라 같은 시점의 업로드 파일과 앱 버전도 확인.
- 복구 검증은 별도 테스트 DB/폴더에서 먼저 수행하고 건수·로그인·민원·첨부파일 연결을 확인.
- 운영 DB 덮어쓰기 복원은 대상/백업 시각/손실 범위를 확인한 뒤 별도 승인과 절차로 진행.

백업은 같은 VM 안의 사본만 두지 말고 별도 저장 위치에도 보관해야 호스트/디스크 장애에 대비할 수 있습니다.
이번 작업은 백업 파일의 존재나 복구 가능성을 확인하지 않았습니다.
호스트 전원 꺼짐/Hyper-V 중단/네트워크 단절은 이 내부 점검기가 외부로 알려줄 수 없습니다.
이러한 장애의 알림은 다른 장비에서 수행하는 외부 모니터링이 추가로 필요합니다.

## 다음 배포

1. sudo touch /run/sgcomplaint-maintenance
2. 서비스 중지, 수동 백업, JAR 업로드
3. 서비스 시작, health와 기능 확인
4. sudo rm -f /run/sgcomplaint-maintenance

유지보수 표시 파일을 남겨두면 모니터링이 일시 중지된 상태로 유지됩니다.
표시 파일은 /run에 있어 OS 재부팅 시 사라집니다.
고의적인 systemctl stop은 Restart=on-failure로 자동 복구하지 않습니다.

## 로그 보관 및 중단

자동 진단 자료 수집/무제한 파일 로그는 추가하지 않았으며 journal의 보관 정책은 현재 서버 설정을 사용합니다.
journalctl --disk-usage로 크기를 확인하고 보관 한도는 서버 전체 서비스에 미치는 영향을 검토해 별도로 정하세요.
모니터링만 중단할 때는 sudo systemctl disable --now sgcomplaint-monitor.timer를 사용합니다.
앱 복구 정책은 별도 drop-in이므로 timer를 꺼도 유지됩니다.

## 검증과 참고

Java HTTP 통합 테스트에서 정상/비정상 health 응답, 상세정보 비공개, 민감 endpoint 차단, 포트 분리를 확인합니다.
이 테스트는 DB 상태를 모의 처리하며 운영 DB를 사용하지 않습니다.
셸 테스트는 systemctl/curl/df/flock을 가짜 명령으로 대체해 상태 전이를 검증합니다.
Linux systemd 서비스 설치/실제 프로세스 자동 재시작/운영 복구 훈련은 이 Windows 환경에서 실행하지 않았습니다.

- [Spring Boot 관리 HTTP 설정](https://docs.spring.io/spring-boot/4.1-SNAPSHOT/reference/actuator/monitoring.html)
- [systemd 서비스 재시작 설정](https://github.com/systemd/systemd/blob/main/man/systemd.service.xml)
