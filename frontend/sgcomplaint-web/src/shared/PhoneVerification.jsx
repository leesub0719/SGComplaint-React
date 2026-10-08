import { useCallback, useEffect, useRef, useState } from 'react';
import { postPhoneVerification } from './api.js';
import useCountdown from './useCountdown.js';
import { CODE_PATTERN, PHONE_PATTERN, digitsOnly, formatTimer } from './format.js';

/**
 * 휴대전화 인증 블록 (인증번호 요청 → 입력 → 확인).
 *
 * 통합 전에는 마이페이지 앱이 자체 setInterval 타이머를 들고 있었고,
 * 계정 찾기·비밀번호 재설정은 각자 같은 로직을 반복하고 있었다.
 * 지금은 타이머를 shared/useCountdown 훅에 위임한다.
 *
 * @param {string} phone 현재 입력된 번호
 * @param {string} originalPhone 변경 전 번호 (같으면 인증이 필요 없다)
 * @param {string} token 발급된 인증 토큰
 * @param {(token: string) => void} onTokenChange
 */
export default function PhoneVerification({
  phone,
  originalPhone,
  token,
  onTokenChange,
  serverError,
}) {
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState('');
  const [phoneMessage, setPhoneMessage] = useState({ text: '', ok: false });
  const [codeMessage, setCodeMessage] = useState({ text: '', ok: false });
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const codeInputRef = useRef(null);

  const unchanged = digitsOnly(phone) === digitsOnly(originalPhone);

  const expire = useCallback(() => {
    onTokenChange('');
    setCodeMessage({ text: '인증시간이 만료되었습니다. 인증번호를 다시 요청해 주세요.', ok: false });
  }, [onTokenChange]);

  const timer = useCountdown(180, expire);

  // 번호를 고치면 이전 인증 결과를 모두 무효화한다.
  useEffect(() => {
    onTokenChange('');
    setVisible(false);
    setCode('');
    timer.stop();
    setCodeMessage({ text: '', ok: false });
    setPhoneMessage(unchanged
      ? { text: '현재 등록된 연락처입니다.', ok: true }
      : { text: '연락처를 변경하려면 휴대전화 인증이 필요합니다.', ok: false });
    // timer.stop은 useCallback으로 고정돼 있어 의존성에 넣어도 안전하다.
  }, [phone, originalPhone, unchanged, onTokenChange, timer.stop]); // eslint-disable-line react-hooks/exhaustive-deps

  async function requestCode() {
    const phoneNumber = digitsOnly(phone);
    if (!PHONE_PATTERN.test(phoneNumber)) {
      setPhoneMessage({ text: '올바른 휴대전화 번호를 입력해 주세요.', ok: false });
      return;
    }
    if (unchanged) {
      setPhoneMessage({ text: '현재 등록된 연락처와 같습니다.', ok: true });
      return;
    }

    setRequesting(true);
    setPhoneMessage({ text: '인증번호를 발송하고 있습니다.', ok: false });
    try {
      const result = await postPhoneVerification('/api/phone-verifications/request', {
        phone: phoneNumber,
      });
      setVisible(true);
      setCode('');
      setCodeMessage({ text: '', ok: false });
      timer.start();
      setPhoneMessage({ text: result.message, ok: true });
      window.setTimeout(() => codeInputRef.current?.focus(), 0);
    } catch (exception) {
      setPhoneMessage({ text: exception.message, ok: false });
    } finally {
      setRequesting(false);
    }
  }

  async function verifyCode() {
    const verificationCode = digitsOnly(code);
    if (!CODE_PATTERN.test(verificationCode)) {
      setCodeMessage({ text: '인증번호 6자리를 입력해 주세요.', ok: false });
      return;
    }

    setVerifying(true);
    try {
      const result = await postPhoneVerification('/api/phone-verifications/verify', {
        phone: digitsOnly(phone),
        code: verificationCode,
      });
      onTokenChange(result.verificationToken);
      timer.stop();
      setCodeMessage({ text: result.message, ok: true });
    } catch (exception) {
      onTokenChange('');
      setCodeMessage({ text: exception.message, ok: false });
    } finally {
      setVerifying(false);
    }
  }

  const verified = Boolean(token);

  return (
    <>
      {phoneMessage.text && (
        <p className={phoneMessage.ok ? 'field-message success' : 'field-error'}>
          {phoneMessage.text}
        </p>
      )}

      <div className="field-inline">
        <button type="button" onClick={requestCode} disabled={requesting || unchanged}>
          {requesting ? '발송 중…' : '인증번호 요청'}
        </button>
      </div>

      {visible && (
        <div className={verified ? 'field verification is-verified' : 'field verification'}>
          <label htmlFor="profile-phone-code">휴대전화 인증</label>
          <div className="field-inline">
            <div className="code-wrap">
              <input
                id="profile-phone-code"
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="인증번호 6자리"
                value={code}
                disabled={verified}
                onChange={(event) => {
                  setCode(digitsOnly(event.target.value).slice(0, 6));
                  onTokenChange('');
                }}
              />
              <span className="timer">{formatTimer(timer.remaining)}</span>
            </div>
            <button type="button" onClick={verifyCode} disabled={verifying || verified}>
              {verified ? '인증완료' : '인증확인'}
            </button>
          </div>
          {(codeMessage.text || serverError) && (
            <p className={codeMessage.ok ? 'field-message success' : 'field-error'}>
              {codeMessage.text || serverError}
            </p>
          )}
        </div>
      )}
    </>
  );
}
