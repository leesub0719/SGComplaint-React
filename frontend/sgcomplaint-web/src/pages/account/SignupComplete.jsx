/**
 * 회원가입 STEP 3 — 완료 안내.
 */
export default function SignupComplete({ empNo }) {
  return (
    <main className="signup-complete-page">
      <div className="signup-complete-icon" aria-hidden="true">✓</div>
      <h1>회원가입이 완료되었습니다.</h1>
      <p>{empNo != null && <>회원번호 <strong>{empNo}</strong>번으로 가입되었습니다.<br /></>}이제 로그인 후 서비스를 이용할 수 있습니다.</p>
      <a href="/app/login">로그인하기</a>
    </main>
  );
}
