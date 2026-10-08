import { useEffect, useRef, useState } from 'react';
import { postFormData } from '../../shared/api.js';

const MAX_FILES = 5;

/**
 * 민원 답변 등록 모달.
 *
 * 기존 admin.js는 모달을 열 때 hidden 속성을 토글하고, 포커스를 옮기고,
 * 닫을 때 이전 포커스를 되돌리는 처리를 직접 했다. 여기서는 모달이
 * 열려 있을 때만 컴포넌트가 존재하고, 정리 작업은 useEffect cleanup이 맡는다.
 */
export default function AnswerModal({ complaint, statuses, onClose, onSaved }) {
  const [status, setStatus] = useState(complaint.statusCode);
  const [answerContent, setAnswerContent] = useState(complaint.answerContent || '');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    dialogRef.current?.focus();
    document.body.classList.add('modal-open');

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    if (!answerContent.trim()) {
      setError('답변 내용을 입력해 주세요.');
      return;
    }
    if (files.length > MAX_FILES) {
      setError(`답변 첨부파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`);
      return;
    }

    const formData = new FormData();
    formData.append('status', status);
    formData.append('version', String(complaint.version));
    formData.append('answerContent', answerContent);
    files.forEach((file) => formData.append('answerAttachments', file));

    setSaving(true);
    setError('');
    try {
      const result = await postFormData(`/api/admin/complaints/${complaint.complaintNo}`, formData);
      onSaved(result.message);
    } catch (exception) {
      setError(
        exception.status === 409
          ? '다른 관리자가 먼저 수정했습니다. 창을 닫고 최신 목록을 다시 확인해 주세요.'
          : exception.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal">
      <div
        className="modal-backdrop"
        onClick={onClose}
      />
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="modal-header">
          <h2 id="answer-modal-title">민원 답변 · #{complaint.complaintNo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <dl className="complaint-meta">
            <div>
              <dt>분sdsd류</dt>
              <dd>{complaint.categoryLabel}</dd>
            </div>
            <div>
              <dt>작성자</dt>
              <dd>
                {complaint.memberName} ({complaint.memberId})
              </dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{complaint.memberPhone}</dd>
            </div>
            <div>
              <dt>등록일시</dt>
              <dd>{complaint.registeredDateTime}</dd>
            </div>
          </dl>

          <h3>{complaint.title}</h3>
          {/* 서버의 RichTextSanitizer를 거친 HTML이라 그대로 렌더링한다. */}
          <div
            className="complaint-content"
            dangerouslySetInnerHTML={{ __html: complaint.content }}
          />

          {complaint.complaintAttachments.length > 0 && (
            <div className="attachments">
              <h4>첨부파일</h4>
              {complaint.complaintAttachments.map((file) => (
                <a
                  key={file.attachmentNo}
                  href={file.downloadUrl}
                >
                  {file.originalName} <small>{file.formattedSize}</small>
                </a>
              ))}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="answer-status">처리상태</label>
              <select
                id="answer-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statuses.map((item) => (
                  <option
                    key={item.code}
                    value={item.code}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="answer-content">답변 내용</label>
              <textarea
                id="answer-content"
                rows={6}
                value={answerContent}
                onChange={(event) => setAnswerContent(event.target.value)}
                placeholder="민원인에게 전달할 답변을 입력해 주세요."
              />
            </div>

            <div className="field">
              <label htmlFor="answer-files">답변 첨부파일</label>
              <input
                id="answer-files"
                type="file"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files))}
              />
              {files.length > 0 && <p className="hint">{files.length}개 선택됨</p>}
            </div>

            {error && <p className="field-error">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="submit"
                className="primary"
                disabled={saving}
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
