import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';

export default function Login() {
  const [csrf, setCsrf] = useState(null); const [empId, setEmpId] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false);
  const error = new URLSearchParams(window.location.search).has('error');
  useEffect(() => { apiGet('/api/csrf', { redirectOnExpire: false }).then(setCsrf); }, []);
  return <main className="login-page"><Link className="login-brand" to="/" aria-label="(주) 서경 마을버스 메인으로"><span className="brand-symbol">013</span><span>(주) 서경 마을버스</span></Link>
    <section className="login-card"><div className="login-heading"><h1>로그인</h1><span>가입하신 아이디와 비밀번호를 입력해 주세요.</span></div>{error && <div className="alert alert-error" role="alert">아이디 또는 비밀번호가 일치하지 않습니다.</div>}
      <form method="post" action="/login" id="login-form">{csrf && <input type="hidden" name={csrf.parameterName || '_csrf'} value={csrf.token} />}<div className="credential-box"><div className="login-field"><label htmlFor="emp-id">아이디</label><div className="input-wrap"><input id="emp-id" name="empId" autoComplete="username" maxLength="20" placeholder="아이디를 입력해 주세요" required autoFocus value={empId} onChange={(event) => setEmpId(event.target.value)} />{empId && <button className="input-icon clear-button" type="button" aria-label="아이디 지우기" onClick={() => setEmpId('')}>×</button>}</div></div>
        <div className="login-field password-field"><label htmlFor="emp-password">비밀번호</label><div className="input-wrap"><input id="emp-password" name="empPassword" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="비밀번호를 입력해 주세요" required value={password} onChange={(event) => setPassword(event.target.value)} /><button className="input-icon password-button" type="button" aria-label="비밀번호 표시" aria-pressed={show} onClick={() => setShow(!show)}><svg className="eye-open" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.6" /></svg></button></div></div></div>
        <label className="remember-option"><input type="checkbox" name="remember-me" /><span className="checkmark" /><span>로그인 상태 유지</span></label><button id="login-button" className="login-button" type="submit" disabled={!csrf}>로그인</button></form>
    </section><nav className="account-links" aria-label="회원 도움말"><Link to="/account/find-id">아이디 찾기</Link><span className="divider" /><Link to="/account/reset-password">비밀번호 찾기</Link><span className="divider" /><Link to="/account/signup">회원가입</Link></nav><Link className="home-link" to="/">← 메인 화면으로 돌아가기</Link>
  </main>;
}
