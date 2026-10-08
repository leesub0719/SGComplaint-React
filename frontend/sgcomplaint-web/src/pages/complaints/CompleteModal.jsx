import { useEffect, useRef } from 'react';

/**
 * 접수 완료 안내 모달.
 * 기존 create.html 하단의 #complaint-complete-modal 대체.
 */
export default function CompleteModal({ complaintNo, onConfirm }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div className="complete-modal">
      <div className="complete-modal-backdrop" />
      <section
        className="complete-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-title"
      >
        <div className="complete-icon" aria-hidden="true">✓</div>
        <h2 id="complete-title">민원 접수 완료</h2>
        <p>민원이 정상적으로 접수되었습니다.</p>
        <p className="receipt-number">접수번호 <strong>{complaintNo}</strong></p>
        <button
          ref={confirmRef}
          type="button"
          className="complete-confirm"
          onClick={onConfirm}
        >
          확인
        </button>
      </section>
    </div>
  );
}
