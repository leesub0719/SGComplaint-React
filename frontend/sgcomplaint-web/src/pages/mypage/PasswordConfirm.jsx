import { useState } from 'react';
import { apiPost, ApiError } from '../../shared/api.js';

/**
 * 비밀번호 재확인 화면.
 */
export default function PasswordConfirm({ empId, onVerified }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiPost('/api/mypage/profile/confirm-password', { currentPassword });
      onVerified();
    } catch (exception) {
      const message =
        exception instanceof ApiError
          ? exception.fieldErrors.currentPassword || exception.message
          : '요청을 처리하지 못했습니다.';
      setError(message);
      setCurrentPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mypage-content-panel password-confirm-panel">
      <div className="mypage-heading">
        <span>MEMBER INFORMATION</span>
        <h1>비밀번호 재확인</h1>
        <p>회원님의 개인정보를 안전하게 보호하기 위해 비밀번호를 한 번 더 확인합니다.</p>
      </div>

      <form
        className="password-confirm-form"
        onSubmit={submit}
        noValidate
      >
        <label htmlFor="confirm-member-id">아이디</label>
        <input
          id="confirm-member-id"
          type="text"
          value={empId ?? ''}
          readOnly
        />

        <label htmlFor="current-password">현재 비밀번호</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          placeholder="현재 비밀번호를 입력해 주세요"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoFocus
        />
        {error && <p className="mypage-field-error">{error}</p>}

        <div className="mypage-form-actions">
          <button
            className="mypage-primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? '확인 중…' : '확인'}
          </button>
          <a
            className="mypage-secondary-button"
            href="/app/"
          >
            취소
          </a>
        </div>
      </form>
    </section>
  );
}
