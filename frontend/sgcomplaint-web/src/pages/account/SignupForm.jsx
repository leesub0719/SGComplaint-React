import { useState } from 'react';
import { apiGet, apiPost, ApiError } from '../../shared/api.js';
import {
  EMP_ID_PATTERN,
  isValidPassword,
  normalizeEmpId,
  normalizePhone,
} from '../../shared/format.js';

/**
 * 회원가입 STEP 2 — 회원정보 입력.
 */
export default function SignupForm({ onComplete, onAgreementExpired }) {
  const [form, setForm] = useState({
    empId: '',
    empPassword: '',
    passwordConfirm: '',
    empName: '',
    empEmail: '',
    empPhone: '',
  });
  const [idCheck, setIdCheck] = useState({ checkedId: '', available: false, message: '' });
  const [showPassword, setShowPassword] = useState({ empPassword: false, passwordConfirm: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingId, setCheckingId] = useState(false);

  const update = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  // 아이디를 고치면 이전 중복확인 결과는 무효가 된다.
  const updateEmpId = (raw) => {
    update('empId', normalizeEmpId(raw));
    setIdCheck({ checkedId: '', available: false, message: '' });
  };

  const idConfirmed = idCheck.available && idCheck.checkedId === form.empId;

  async function checkId() {
    const empId = form.empId.trim();
    if (!EMP_ID_PATTERN.test(empId)) {
      setIdCheck({
        checkedId: '',
        available: false,
        message: '영문 소문자와 숫자로 4~20자를 입력해 주세요.',
      });
      return;
    }
    setCheckingId(true);
    try {
      const result = await apiGet(`/api/members/check-id?empId=${encodeURIComponent(empId)}`);
      setIdCheck(
        result.available
          ? { checkedId: empId, available: true, message: '사용 가능한 아이디입니다.' }
          : { checkedId: '', available: false, message: '이미 사용 중인 아이디입니다.' },
      );
    } catch (exception) {
      setIdCheck({ checkedId: '', available: false, message: exception.message });
    } finally {
      setCheckingId(false);
    }
  }

  // 비밀번호 확인은 입력 즉시 피드백을 준다 (기존 validatePasswordMatch 대응).
  function passwordMatchMessage() {
    if (!form.passwordConfirm) return null;
    if (form.empPassword !== form.passwordConfirm) {
      return { ok: false, text: '✕ 비밀번호가 일치하지 않습니다.' };
    }
    if (!isValidPassword(form.empPassword)) {
      return { ok: false, text: '영문과 숫자를 포함해 8자 이상 입력해 주세요.' };
    }
    return { ok: true, text: '✓ 비밀번호가 일치합니다.' };
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!idConfirmed) {
      setIdCheck((previous) => ({
        ...previous,
        message: '현재 아이디의 중복확인을 진행해 주세요.',
      }));
      return;
    }
    const match = passwordMatchMessage();
    if (!match?.ok) {
      setFieldErrors({ passwordConfirm: match?.text || '비밀번호를 확인해 주세요.' });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const result = await apiPost('/api/signup', form);
      onComplete(result.empNo);
    } catch (exception) {
      if (exception instanceof ApiError && exception.status === 403) {
        onAgreementExpired();
        return;
      }
      setFieldErrors(exception instanceof ApiError ? exception.fieldErrors : {});
      setError(exception.message);
    } finally {
      setSubmitting(false);
    }
  }

  const passwordField = (name, label, placeholder) => (
    <div className="field">
      <label htmlFor={name}>
        {label} <em className="required">필수</em>
      </label>
      <div className="password-wrap">
        <input
          id={name}
          type={showPassword[name] ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={placeholder}
          value={form[name]}
          onChange={(event) => update(name, event.target.value)}
          required
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setShowPassword((previous) => ({ ...previous, [name]: !previous[name] }))}
        >
          {showPassword[name] ? '숨기기' : '보기'}
        </button>
      </div>
      {fieldErrors[name] && <p className="field-message">{fieldErrors[name]}</p>}
    </div>
  );

  const match = passwordMatchMessage();

  return (
    <main className="signup-page">
      <section className="signup-card">
        <div className="title-area">
          <p>STEP 2</p>
          <h1>회원정보 입력</h1>
          <span>서비스 이용에 필요한 정보를 입력해 주세요.</span>
        </div>

        <form
          className="signup-form"
          onSubmit={submit}
          noValidate
        >
          <div className="field">
            <label htmlFor="emp-id">
              아이디 <em className="required">필수</em>
            </label>
            <div className="input-action-row">
              <input
                id="emp-id"
                type="text"
                placeholder="영문 소문자와 숫자 4~20자"
                value={form.empId}
                onChange={(event) => updateEmpId(event.target.value)}
                required
              />
              <button
                className="field-button"
                type="button"
                onClick={checkId}
                disabled={checkingId}
              >
                {checkingId ? '확인 중…' : '중복확인'}
              </button>
            </div>
            {idCheck.message && (
              <p className={idConfirmed ? 'field-message success' : 'field-message'}>
                {idCheck.message}
              </p>
            )}
            {fieldErrors.empId && <p className="field-message">{fieldErrors.empId}</p>}
          </div>

          {passwordField('empPassword', '비밀번호', '영문·숫자 포함 8~72자')}

          <div className="field">
            <label htmlFor="passwordConfirm">
              비밀번호 확인 <em className="required">필수</em>
            </label>
            <div className="password-wrap">
              <input
                id="passwordConfirm"
                type={showPassword.passwordConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력해 주세요"
                value={form.passwordConfirm}
                onChange={(event) => update('passwordConfirm', event.target.value)}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowPassword((previous) => ({
                    ...previous,
                    passwordConfirm: !previous.passwordConfirm,
                  }))
                }
              >
                {showPassword.passwordConfirm ? '숨기기' : '보기'}
              </button>
            </div>
            {match && (
              <p className={match.ok ? 'field-message success' : 'field-message'}>{match.text}</p>
            )}
            {fieldErrors.passwordConfirm && (
              <p className="field-message">{fieldErrors.passwordConfirm}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="emp-name">
              이름 <em className="required">필수</em>
            </label>
            <input
              id="emp-name"
              type="text"
              maxLength={50}
              value={form.empName}
              onChange={(event) => update('empName', event.target.value)}
              required
            />
            {fieldErrors.empName && <p className="field-message">{fieldErrors.empName}</p>}
          </div>

          <div className="field">
            <label htmlFor="emp-email">
              이메일 <em className="required">필수</em>
            </label>
            <input
              id="emp-email"
              type="email"
              autoComplete="email"
              maxLength={100}
              value={form.empEmail}
              onChange={(event) => update('empEmail', event.target.value)}
              required
            />
            {fieldErrors.empEmail && <p className="field-message">{fieldErrors.empEmail}</p>}
          </div>

          <div className="field">
            <label htmlFor="emp-phone">
              휴대전화 <em className="required">필수</em>
            </label>
            <input
              id="emp-phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="숫자만 입력"
              value={form.empPhone}
              onChange={(event) => update('empPhone', normalizePhone(event.target.value))}
              required
            />
            {fieldErrors.empPhone && <p className="field-message">{fieldErrors.empPhone}</p>}
          </div>

          {error && <p className="field-message form-error">{error}</p>}

          <div>
            <a
              className="login-guide"
              href="/app/"
            >
              취소
            </a>
            <button
              className="submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? '가입 중…' : '가입하기'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
