import { useState } from 'react';
import { apiPost } from '../../shared/api.js';
import useCountdown from '../../shared/useCountdown.js';
import {
  CODE_PATTERN,
  EMP_ID_PATTERN,
  PHONE_PATTERN,
  digitsOnly,
  formatPhone,
  formatTimer,
  isValidPassword,
  normalizeEmpId,
  normalizePhone,
} from '../../shared/format.js';

const STEPS = ['아이디 확인', '본인 확인', '인증번호 확인', '새 비밀번호', '완료'];

/**
 * 비밀번호 재설정 5단계 마법사.
 */
export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState({ empId: '', empName: '', phone: '' });
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState({ newPassword: '', newPasswordConfirm: '' });
  const [message, setMessage] = useState({ text: '', ok: false });
  const [busy, setBusy] = useState(false);

  const timer = useCountdown(180, () => {
    setVerificationToken('');
    setMessage({ text: '인증번호가 만료되었습니다. 다시 받아 주세요.', ok: false });
  });

  const setIdentityField = (name, value) => {
    setIdentity((previous) => ({ ...previous, [name]: value }));
    setMessage({ text: '', ok: false });
  };

  async function checkId() {
    if (!EMP_ID_PATTERN.test(identity.empId)) {
      setMessage({ text: '영문 소문자와 숫자로 된 아이디를 입력해 주세요.', ok: false });
      return;
    }
    setBusy(true);
    setMessage({ text: '아이디를 확인하고 있습니다.', ok: false });
    try {
      await apiPost('/api/account-recovery/password/check-id', { empId: identity.empId });
      setMessage({ text: '', ok: false });
      setStep(2);
    } catch (exception) {
      setMessage({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function requestCode() {
    const payload = { ...identity, phone: normalizePhone(identity.phone) };
    if (!payload.empName.trim() || !PHONE_PATTERN.test(payload.phone)) {
      setMessage({ text: '이름과 올바른 휴대전화 번호를 입력해 주세요.', ok: false });
      return;
    }
    setBusy(true);
    setMessage({ text: '회원정보를 확인하고 있습니다.', ok: false });
    try {
      const result = await apiPost('/api/account-recovery/password/request', payload);
      setCode('');
      setVerificationToken('');
      setMessage({ text: result.message, ok: true });
      setStep(3);
      timer.start();
    } catch (exception) {
      setMessage({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!CODE_PATTERN.test(code)) {
      setMessage({ text: '인증번호 6자리를 입력해 주세요.', ok: false });
      return;
    }
    setBusy(true);
    setMessage({ text: '인증번호를 확인하고 있습니다.', ok: false });
    try {
      const result = await apiPost('/api/account-recovery/password/verify', {
        identity: { ...identity, phone: normalizePhone(identity.phone) },
        code,
      });
      timer.stop();
      setVerificationToken(result.verificationToken);
      setMessage({ text: '', ok: false });
      setStep(4);
    } catch (exception) {
      setMessage({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword() {
    if (!isValidPassword(password.newPassword)) {
      setMessage({ text: '영문과 숫자를 포함해 8~72자로 입력해 주세요.', ok: false });
      return;
    }
    if (password.newPassword !== password.newPasswordConfirm) {
      setMessage({ text: '새 비밀번호가 서로 일치하지 않습니다.', ok: false });
      return;
    }
    if (!verificationToken) {
      setMessage({
        text: '휴대전화 인증이 만료되었습니다. 처음부터 다시 진행해 주세요.',
        ok: false,
      });
      return;
    }

    setBusy(true);
    setMessage({ text: '비밀번호를 변경하고 있습니다.', ok: false });
    try {
      await apiPost('/api/account-recovery/password/reset', {
        identity: { ...identity, phone: normalizePhone(identity.phone) },
        verificationToken,
        ...password,
      });
      setVerificationToken('');
      setPassword({ newPassword: '', newPasswordConfirm: '' });
      setMessage({ text: '', ok: false });
      setStep(5);
    } catch (exception) {
      setMessage({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep(1);
    setIdentity({ empId: '', empName: '', phone: '' });
    setCode('');
    setVerificationToken('');
    timer.stop();
    setMessage({ text: '', ok: false });
  }

  const feedback = message.text && (
    <p className={message.ok ? 'field-message success' : 'field-error'}>{message.text}</p>
  );

  return (
    <main className="recovery-page recovery-page-wide">
      <section className="recovery-card">
        <div className="recovery-heading">
          <p>ACCOUNT</p>
          <h1>비밀번호 재설정</h1>
          <span>본인 확인 후 새 비밀번호를 설정할 수 있습니다.</span>
        </div>

        <ol className="step-indicator password-steps">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const className =
              stepNumber === step ? 'is-current' : stepNumber < step ? 'is-complete' : '';
            return (
              <li
                key={label}
                className={className}
              >
                <span>{stepNumber}</span>
                {label}
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <div className="field">
            <label htmlFor="reset-emp-id">아이디</label>
            <div className="inline">
              <input
                id="reset-emp-id"
                type="text"
                value={identity.empId}
                onChange={(event) => setIdentityField('empId', normalizeEmpId(event.target.value))}
                autoFocus
              />
              <button
                type="button"
                onClick={checkId}
                disabled={busy}
              >
                확인
              </button>
            </div>
            {feedback}
          </div>
        )}

        {step === 2 && (
          <>
            <p className="summary">
              아이디 <strong>{identity.empId}</strong>
            </p>
            <div className="field">
              <label htmlFor="reset-name">이름</label>
              <input
                id="reset-name"
                type="text"
                maxLength={50}
                value={identity.empName}
                onChange={(event) => setIdentityField('empName', event.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="reset-phone">휴대전화 번호</label>
              <div className="inline">
                <input
                  id="reset-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="숫자만 입력"
                  value={identity.phone}
                  onChange={(event) =>
                    setIdentityField('phone', normalizePhone(event.target.value))
                  }
                />
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={busy}
                >
                  인증번호 받기
                </button>
              </div>
              {feedback}
            </div>
            <button
              className="link-button"
              type="button"
              onClick={restart}
            >
              아이디 다시 입력
            </button>
          </>
        )}

        {step === 3 && (
          <div className="field">
            <p className="summary">
              {formatPhone(normalizePhone(identity.phone))} 으로 인증번호를 보냈습니다.
            </p>
            <label htmlFor="reset-code">인증번호</label>
            <div className="inline">
              <div className="code-wrap">
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="인증번호 6자리"
                  value={code}
                  onChange={(event) => {
                    setCode(digitsOnly(event.target.value).slice(0, 6));
                    setMessage({ text: '', ok: false });
                  }}
                  autoFocus
                />
                <span className="timer">{formatTimer(timer.remaining)}</span>
              </div>
              <button
                type="button"
                onClick={verifyCode}
                disabled={busy}
              >
                확인
              </button>
            </div>
            {feedback}
            <button
              className="link-button"
              type="button"
              onClick={requestCode}
              disabled={busy}
            >
              인증번호 다시 받기
            </button>
          </div>
        )}

        {step === 4 && (
          <>
            <div className="field">
              <label htmlFor="new-password">새 비밀번호</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="영문·숫자 포함 8~72자"
                value={password.newPassword}
                onChange={(event) => {
                  setPassword((previous) => ({ ...previous, newPassword: event.target.value }));
                  setMessage({ text: '', ok: false });
                }}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="new-password-confirm">새 비밀번호 확인</label>
              <input
                id="new-password-confirm"
                type="password"
                autoComplete="new-password"
                value={password.newPasswordConfirm}
                onChange={(event) => {
                  setPassword((previous) => ({
                    ...previous,
                    newPasswordConfirm: event.target.value,
                  }));
                  setMessage({ text: '', ok: false });
                }}
              />
              {feedback}
            </div>
            <div className="actions">
              <button
                className="primary"
                type="button"
                onClick={submitPassword}
                disabled={busy}
              >
                비밀번호 변경
              </button>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="result">
            <p>비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.</p>
            <div className="actions">
              <a
                className="secondary"
                href="/"
              >
                홈으로
              </a>
              <a
                className="primary"
                href="/login"
              >
                로그인하기
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
