import { useEffect, useRef } from 'react';
import SafeHtml from '../../shared/SafeHtml.jsx';

export default function ComplaintDetailModal({ complaint, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    document.body.classList.add('modal-open');
    closeRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="complaint-modal">
      <div
        className="complaint-modal-backdrop"
        onClick={onClose}
      />
      <section
        className="complaint-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
      >
        <header className="complaint-modal-header">
          <div>
            <h2 id="complaint-modal-title">민원 상세내용</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="팝업 닫기"
          >
            ×
          </button>
        </header>
        <div className="complaint-modal-body">
          <dl className="modal-information">
            <div>
              <dt>민원 번호</dt>
              <dd>{complaint.complaintNo}</dd>
            </div>
            <div>
              <dt>신청인</dt>
              <dd>{complaint.memberName}</dd>
            </div>
            <div className="wide">
              <dt>제목</dt>
              <dd>{complaint.title}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>
                <span className={`admin-status ${complaint.statusCssClass}`}>
                  {complaint.statusLabel}
                </span>
              </dd>
            </div>
            <div>
              <dt>등록일</dt>
              <dd>{complaint.registeredDateTime}</dd>
            </div>
          </dl>
          <div className="modal-content-section">
            <h3>내용</h3>
            <SafeHtml html={complaint.content} />
          </div>
          <div className="modal-content-section">
            <h3>첨부파일</h3>
            {complaint.complaintAttachments?.length ? (
              <div className="attachment-links">
                {complaint.complaintAttachments.map((file) => (
                  <a
                    key={file.attachmentNo}
                    href={file.downloadUrl}
                  >
                    <span>↓</span>
                    <strong>{file.originalName}</strong>
                    <small>{file.formattedSize}</small>
                  </a>
                ))}
              </div>
            ) : (
              <p className="no-attachment">등록된 첨부파일이 없습니다.</p>
            )}
          </div>
        </div>
        <footer className="complaint-modal-footer">
          <button
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
