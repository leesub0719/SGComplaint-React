import { useState } from 'react';
import { apiPost, ApiError } from '../../shared/api.js';
import { REQUIRED_AGREEMENTS } from './agreements.js';

/**
 * 회원가입 STEP 1 — 약관 동의.
 */
export default function SignupTerms({ onAgreed }) {
  const [checked, setChecked] = useState({
    termsAgreed: false,
    privacyAgreed: false,
    ageConfirmed: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allChecked = REQUIRED_AGREEMENTS.every((item) => checked[item.name]);
  const someChecked = REQUIRED_AGREEMENTS.some((item) => checked[item.name]);

  const toggleAll = (value) => {
    setChecked({
      termsAgreed: value,
      privacyAgreed: value,
      ageConfirmed: value,
    });
  };

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiPost('/api/signup/terms', checked);
      onAgreed();
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : '요청을 처리하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="card-title">
        <p>STEP 1</p>
        <h1>약관 및 개인정보 동의</h1>
        <span>회원가입을 계속하려면 필수 내용을 확인하고 동의해 주세요.</span>
      </div>

      <form onSubmit={submit}>
        <label className="agree-all">
          <input
            type="checkbox"
            checked={allChecked}
            // 일부만 체크된 상태를 시각적으로 표시 (기존 agreeAll.indeterminate 대응)
            ref={(node) => { if (node) node.indeterminate = !allChecked && someChecked; }}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          <span>이용약관 및 개인정보 수집·이용에 모두 동의합니다.</span>
        </label>

        {REQUIRED_AGREEMENTS.map((item) => (
          <section className="agree-section" key={item.name}>
            <label className="agree-check">
              <input
                type="checkbox"
                checked={checked[item.name]}
                onChange={(event) => setChecked((previous) => ({
                  ...previous,
                  [item.name]: event.target.checked,
                }))}
              />
              <span>{item.label} <em>(필수)</em></span>
            </label>

            {item.articles && (
              <div className="agree-content" tabIndex={0}>
                {item.articles.map((article) => (
                  <div key={article.heading}>
                    <h2>{article.heading}</h2>
                    <p>{article.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {error && <p className="field-error">{error}</p>}

        <div className="actions">
          <a className="secondary" href="/">취소</a>
          <button className="primary" type="submit" disabled={!allChecked || submitting}>
            {submitting ? '처리 중…' : '동의하고 계속'}
          </button>
        </div>
      </form>
    </section>
  );
}
