import { useEffect, useState } from 'react';
import { apiGet } from '../../shared/api.js';
export default function Login() {
  const [csrf, setCsrf] = useState(null); const error = new URLSearchParams(location.search).has('error');
  useEffect(() => { apiGet('/api/csrf', { redirectOnExpire: false }).then(setCsrf); }, []);
  return <main className="page narrow-page"><section className="content-card auth-card"><h1>로그인</h1>{error && <p className="message error">아이디 또는 비밀번호를 확인해 주세요.</p>}<form method="post" action="/login" className="stack-form">{csrf && <input type="hidden" name={csrf.parameterName} value={csrf.token} />}<label>아이디<input name="empId" required /></label><label>비밀번호<input type="password" name="empPassword" required /></label><label className="check-row"><input type="checkbox" name="remember-me" /> 로그인 유지</label><button className="primary" type="submit">로그인</button></form></section></main>;
}
