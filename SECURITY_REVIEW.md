# 공개 홈페이지 보안 검토 — 2026-10-24

## 범위와 결론
검토 대상은 `index.html`, `conversion.html`, `local.js`, `local.css`, `scripts/build.mjs`, package/lock 및 `vercel.json`, 그리고 이들로 생성한 `dist/`입니다. 과거 원본 스냅샷 `evidence/`는 배포하지 않습니다.

현재 서비스는 Vercel이 제공하는 정적 HTML/CSS/JS입니다. PHP 실행 환경, Vercel Function/API, SQL 데이터베이스, 파일 업로드 및 서버측 문의 접수 기능이 없습니다. 따라서 현재 검토 범위에서는 PHP RCE 취약점 적용 대상이나 사용자 입력을 SQL로 실행하는 경로가 없습니다. **서버가 없는 구조라는 뜻이지, 모든 종류의 공격에 안전하다는 보증은 아닙니다.**

## 확인·조치
- PHP: 배포 파일 및 실행 설정에 PHP가 없습니다. PHP 패치 적용을 했다고 표현하지 않습니다. 빌드 시 Node.js 24를 쓰며 Node 서버도 공개하지 않습니다.
- SQL injection: DB 드라이버, SQL 쿼리, 접수 API가 없습니다. 입력 문자열이 SQL 실행 경로에 도달하지 않습니다.
- XSS/코드 실행: 사용자 입력은 `textContent`로만 출력합니다. innerHTML, document.write, eval, 동적 스크립트 생성으로 전달하지 않습니다. SQL/HTML처럼 보이는 문자열도 텍스트로 처리합니다.
- 개인정보 보관: 기존 localStorage 임시 저장을 제거했습니다. 기존 `ceopartners-consultation` 항목은 내용을 읽지 않고 삭제합니다. 닫기 시 입력과 정리 결과를 지우며 서버 전송을 하지 않습니다. 사용자가 직접 누를 때만 정리 내용을 클립보드로 복사합니다.
- 입력 제한: 연락처 형식, 필수 문의 내용, 이름 50자/연락처 20자/문의 2,000자 제한. 이는 현재 UI 검증이며 미래 서버 보안의 대체 수단이 아닙니다.
- CSP: 자기 출처의 JS/CSS/폰트/이미지만 허용합니다. 외부 연결, 인라인 스크립트, eval, object, 외부 frame 삽입 및 폼 전송을 제한합니다. 이를 위해 inline 이벤트·스타일을 사용하지 않습니다.
- 추가 헤더: nosniff, DENY, Referrer-Policy, HSTS, camera/microphone/geolocation 비활성화.
- 공급망: 실행 의존 패키지 없음. SUITE 폰트는 공식 파일을 자체 제공하며 OFL 라이선스도 배포합니다. 외부 폰트/CDN/추적 스크립트 불필요.
- 배포: 참조한 정적 파일만 `dist/`에 포함합니다. 비밀 설정 파일, 연구 스냅샷, 미사용 원본 자산은 제외합니다.

## 한계와 추후 실제 접수 시 필요한 일
이 검토는 Vercel 플랫폼 전체, GitHub/Vercel 계정 권한, 내부 PC, 네이버 메일 보안, 도메인 계정까지 침투 테스트한 결과가 아닙니다. 공개 서비스는 HTTPS로 운영하고 관리자 계정의 다중 인증과 권한 관리를 유지해야 합니다.

실제 상담 접수 서버를 추가할 경우: 서버측 입력 검증, 매개변수화 SQL/안전한 ORM, 저장·열람 권한, 암호화, CSRF/Origin 검증, 요청 제한·스팸 방어, 로깅 시 개인정보 제거, 수집 동의·보관 기간을 함께 설계해야 합니다. 현재는 접수 성공으로 오해할 수 있는 문구를 사용하지 않습니다.

## 참고한 공식 자료
- KISA PHP 보안 업데이트 권고(2026-10-21): https://krcert.or.kr/kr/bbs/view.do?bbsId=B0000133&menuNo=205020&nttId=72230&pageIndex=1
- PHP 공식 2026-10-21 보안 권고 및 2026-10-23 추가 안내: https://www.php.net/archive/2026.php
  - 10월 21일: CVE-2026-109618, CVE-2026-109619. PHP 실행 서버 대상 패치 안내.
  - 10월 23일: 특정 세션 설정 조합의 CVE-2026-115560 관련 session.upload_progress 임시 완화 안내.
- SUITE 공식 배포: https://github.com/sun-typeface/SUITE (assets/SUITE-LICENSE.txt)
- 사업자등록 FAQ 확인: https://s.nts.go.kr/nts/ad/cntnts/cntntsView.do?mi=2445

## 수행한 검증
- `npm run build`: 페이지·CSS·JS·이미지·폰트·사용 허가 등 8개 파일, 약 1.1MB 출력 확인.
- `node --check local.js`, `git diff --check` 통과.
- npm 실행 의존성 0개, npm audit에서 취약 패키지 보고 없음. 이는 플랫폼 또는 자체 코드가 무조건 안전하다는 의미가 아닙니다.
- 로컬 Chromium 실제 문의창에 HTML 이벤트 속성 형태와 SQL 형태의 시험 문자열을 입력: 결과에 문자열 그대로 표시되고 생성된 자식 HTML 요소 0개, 이벤트 실행 흔적 없음.
- 세무 관리·법인 전환별 제목 및 선택 값 변경 확인. 닫은 뒤 입력값과 정리 결과 초기화 확인.
- 작은 모바일 화면에서 메뉴 열기 → 법인 전환 이동 → 해당 분야 문의창 열기/닫기 확인.
