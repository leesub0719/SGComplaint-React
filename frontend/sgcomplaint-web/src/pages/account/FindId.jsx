import { useState } from 'react';
import { apiPost } from '../../shared/api.js';
import useCountdown from '../../shared/useCountdown.js';
import {
  CODE_PATTERN, PHONE_PATTERN, digitsOnly, formatPhone, formatTimer, normalizePhone,
} from '../../shared/format.js';

const STEPS = ['휴대전화 입력', '인증번호 확인', '아이디 확인'];

/**
 * 아이디 찾기 3단계 마법사.
 *
 * 기존 코드가 data-step 속성과 hidden 토글로 하던 화면 전환을
 * step 상태값 하나로 처리한다.
 */
export default function FindId() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [foundIds, setFoundIds] = useState([]);
  const [phoneMessage, setPhoneMessage] = useState({ text: '', ok: false });
  const [codeMessage, setCodeMessage] = useState({ text: '', ok: false });
  const [busy, setBusy] = useState(false);

  const timer = useCountdown(180, () => {
    setCodeMessage({ text: '인증번호가 만료되었습니다. 다시 받아 주세요.', ok: false });
  });

  async function requestCode(isResend = false) {
    const target = normalizePhone(phone);
    const setFeedback = isResend ? setCodeMessage : setPhoneMessage;

    if (!PHONE_PATTERN.test(target)) {
      setPhoneMessage({ text: '올바른 휴대전화 번호를 입력해 주세요.', ok: false });
      return;
    }

    setBusy(true);
    setFeedback({ text: '가입된 계정을 확인하고 있습니다.', ok: false });
    try {
      const result = await apiPost('/api/account-recovery/find-id/request', { phone: target });
      setCode('');
      setPhoneMessage({ text: result.message, ok: true });
      setCodeMessage({ text: result.message, ok: true });
      setStep(2);
      timer.start();
    } catch (exception) {
      setFeedback({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!CODE_PATTERN.test(code)) {
      setCodeMessage({ text: '인증번호 6자리를 입력해 주세요.', ok: false });
      return;
    }
    setBusy(true);
    setCodeMessage({ text: '인증번호를 확인하고 있습니다.', ok: false });
    try {
      const result = await apiPost('/api/account-recovery/find-id/verify', {
        phone: normalizePhone(phone),
        code,
      });
      timer.stop();
      setFoundIds(result.employeeIds || []);
      setStep(3);
    } catch (exception) {
      setCodeMessage({ text: exception.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-title">
        <p>ACCOUNT</p>
        <h1>아이디 찾기</h1>
        <span>가입 시 등록한 휴대전화 번호로 본인 확인 후 아이디를 알려드립니다.</span>
      </div>

      <ol className="steps">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const className = stepNumber === step ? 'is-current'
            : (stepNumber < step ? 'is-complete' : '');
          return <li key={label} className={className}>{stepNumber}. {label}</li>;
        })}
      </ol>

      {step === 1 && (
        <div className="field">
          <label htmlFor="find-phone">휴대전화 번호</label>
          <div className="inline">
            <input
              id="find-phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="숫자만 입력"
              value={phone}
              onChange={(event) => {
                setPhone(normalizePhone(event.target.value));
                setPhoneMessage({ text: '', ok: false });
              }}
              autoFocus
            />
            <button type="button" onClick={() => requestCode(false)} disabled={busy}>
              인증번호 받기
            </button>
          </div>
          {phoneMessage.text && (
            <p className={phoneMessage.ok ? 'field-message success' : 'field-error'}>
              {phoneMessage.text}
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="field">
          <p className="summary">{formatPhone(normalizePhone(phone))} 으로 인증번호를 보냈습니다.</p>
          <label htmlFor="find-code">인증번호</label>
          <div className="inline">
            <div className="code-wrap">
              <input
                id="find-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="인증번호 6자리"
                value={code}
                onChange={(event) => {
                  setCode(digitsOnly(event.target.value).slice(0, 6));
                  setCodeMessage({ text: '', ok: false });
                }}
                autoFocus
              />
              <span className="timer">{formatTimer(timer.remaining)}</span>
            </div>
            <button type="button" onClick={verifyCode} disabled={busy}>확인</button>
          </div>
          {codeMessage.text && (
            <p className={codeMessage.ok ? 'field-message success' : 'field-error'}>
              {codeMessage.text}
            </p>
          )}
          <button className="link-button" type="button" onClick={() => requestCode(true)} disabled={busy}>
            인증번호 다시 받기
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="result">
          <p>회원님의 아이디입니다.</p>
          <div className="found-list">
            {foundIds.map((employeeId) => <div key={employeeId}>{employeeId}</div>)}
          </div>
          <div className="actions">
            <a className="secondary" href="/app/account/reset-password">비밀번호 재설정</a>
            <a className="primary" href="/login">로그인하기</a>
          </div>
        </div>
      )}
    </section>
  );
}
