/**
 * 회원가입 STEP 3 — 완료 안내.
 */
export default function SignupComplete({ empNo }) {
  return (
    <section className="card complete-card">
      <div className="card-title">
        <p>STEP 3</p>
        <h1>회원가입이 완료되었습니다</h1>
        <span>이제 로그인하고 민원 접수와 처리 현황 확인을 이용하실 수 있습니다.</span>
      </div>

      {empNo != null && <p className="complete-no">회원번호 <strong>{empNo}</strong></p>}

      <div className="actions">
        <a className="secondary" href="/">홈으로</a>
        <a className="primary" href="/login">로그인하기</a>
      </div>
    </section>
  );
}
