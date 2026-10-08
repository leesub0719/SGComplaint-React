import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import SignupTerms from './SignupTerms.jsx';
import SignupForm from './SignupForm.jsx';
import SignupComplete from './SignupComplete.jsx';
import FindId from './FindId.jsx';
import ResetPassword from './ResetPassword.jsx';

const TABS = [
  ['signup', '회원가입'],
  ['find-id', '아이디 찾기'],
  ['reset-password', '비밀번호 재설정'],
];

/**
 * 계정 화면 컨테이너.
 *
 * /account/:tab 하나의 라우트로 세 화면을 처리한다. 화면 사이에 공유하는
 * 상태가 없고 탭 UI로 묶여 있어서 라우트를 셋으로 쪼갤 이유가 없다.
 */
export default function Account() {
  const { tab } = useParams();

  return (
    <main className="page account-page">
      <nav className="tabs">
        {TABS.map(([key, label]) => (
          <NavLink
            key={key}
            to={`/account/${key}`}
            className={({ isActive }) => (isActive ? 'chip is-active' : 'chip')}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {tab === 'find-id' && <FindId />}
      {tab === 'reset-password' && <ResetPassword />}
      {(!tab || tab === 'signup') && <Signup />}
    </main>
  );
}

/** 회원가입 3단계를 하나의 상태로 묶는다. */
function Signup() {
  const [stage, setStage] = useState(null); // 'terms' | 'form' | 'complete'
  const [empNo, setEmpNo] = useState(null);
  const [error, setError] = useState('');

  // 서버 세션에 유효한 동의 증적이 있으면 STEP 2부터 시작한다.
  // 새로고침해도 단계가 유지되는 이유다.
  useEffect(() => {
    apiGet('/api/signup/state', { redirectOnExpire: false })
      .then((state) => setStage(state.agreed ? 'form' : 'terms'))
      .catch((exception) => setError(exception.message));
  }, []);

  if (error) return <p className="message error">{error}</p>;
  if (!stage) return <p className="message">잠시만 기다려 주세요.</p>;

  if (stage === 'complete') return <SignupComplete empNo={empNo} />;
  if (stage === 'form') {
    return (
      <SignupForm
        onComplete={(createdEmpNo) => { setEmpNo(createdEmpNo); setStage('complete'); }}
        onAgreementExpired={() => setStage('terms')}
      />
    );
  }
  return <SignupTerms onAgreed={() => setStage('form')} />;
}
