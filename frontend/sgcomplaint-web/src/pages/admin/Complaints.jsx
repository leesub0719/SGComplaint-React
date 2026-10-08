import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet, postFormData } from '../../shared/api.js';
import SafeHtml from '../../shared/SafeHtml.jsx';
import ComplaintDetailModal from './ComplaintDetailModal.jsx';

const STATUS_FILTERS = [
  ['ALL', '전체'],
  ['CHECKING', '확인중'],
  ['PROCESSING', '처리중'],
  ['COMPLETED', '답변완료'],
];
const DEFAULT_ANSWERS = {
  CHECKING: '민원을 확인중입니다.',
  PROCESSING: '민원을 처리중입니다.',
  COMPLETED: '등록해주신 민원에 대해 처리가 완료 되었습니다.',
};

export default function Complaints() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'ALL';
  const [complaints, setComplaints] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setComplaints(await apiGet(`/api/admin/complaints?status=${status}`));
    } catch (exception) {
      setAlert({ type: 'error', message: exception.message });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    apiGet('/api/admin/complaint-statuses').then(setStatuses);
  }, []);

  return (
    <>
      {alert && <div className={`flash-message ${alert.type}`}>{alert.message}</div>}

      <section className="management-toolbar">
        <nav
          className="filter-tabs"
          aria-label="민원 상태 필터"
        >
          {STATUS_FILTERS.map(([code, label]) => (
            <a
              key={code}
              className={status === code ? 'active' : ''}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setParams({ status: code });
                setExpanded(null);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <p>
          총 <strong>{complaints.length}</strong>건
        </p>
      </section>

      <section
        className="admin-complaint-list"
        aria-label="민원 목록"
      >
        {loading && <div className="admin-empty">불러오는 중입니다.</div>}
        {!loading &&
          complaints.map((item) => {
            const open = expanded === item.complaintNo;
            return (
              <article
                className="admin-complaint"
                key={item.complaintNo}
              >
                <button
                  className="admin-complaint-summary"
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : item.complaintNo)}
                >
                  <span className={`admin-status ${item.statusCssClass}`}>{item.statusLabel}</span>
                  <span className="admin-summary-main">
                    <small>{item.categoryLabel}</small>
                    <strong
                      className="complaint-title-link"
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelected(item);
                        }
                      }}
                    >
                      {item.title}
                    </strong>
                    <em>
                      <b>{item.memberName}</b> · <span>{item.memberId}</span>
                    </em>
                  </span>
                  <time>{item.registeredDateTime}</time>
                  <span className="admin-chevron">⌄</span>
                </button>

                {!open ? null : (
                  <div className="admin-complaint-detail">
                    <div className="complaint-information">
                      <dl>
                        <div>
                          <dt>민원번호</dt>
                          <dd>{item.complaintNo}</dd>
                        </div>
                        <div>
                          <dt>신청인</dt>
                          <dd>{item.memberName}</dd>
                        </div>
                        <div>
                          <dt>아이디</dt>
                          <dd>{item.memberId}</dd>
                        </div>
                        <div>
                          <dt>휴대전화</dt>
                          <dd>{item.memberPhone}</dd>
                        </div>
                      </dl>
                      <div className="admin-content-box">
                        <h3>민원 내용</h3>
                        <SafeHtml html={item.content} />
                      </div>
                      <div className="admin-content-box">
                        <h3>민원 첨부파일</h3>
                        {item.complaintAttachments?.length ? (
                          <AttachmentLinks files={item.complaintAttachments} />
                        ) : (
                          <p className="no-attachment">등록된 첨부파일이 없습니다.</p>
                        )}
                      </div>
                    </div>
                    <AnswerForm
                      complaint={item}
                      statuses={statuses}
                      onSaved={(message) => {
                        setAlert({ type: 'success', message });
                        load();
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        {!loading && !complaints.length && (
          <div className="admin-empty">해당 조건의 민원이 없습니다.</div>
        )}
      </section>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function AttachmentLinks({ files }) {
  return (
    <div className="attachment-links compact">
      {files.map((file) => (
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
  );
}

function AnswerForm({ complaint, statuses, onSaved }) {
  const [status, setStatus] = useState(complaint.statusCode);
  const [answer, setAnswer] = useState(
    complaint.answerContent || DEFAULT_ANSWERS[complaint.statusCode] || '',
  );
  const [files, setFiles] = useState([]);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!answer.trim()) return setError('답변 내용을 입력해 주세요.');
    const body = new FormData();
    body.append('status', status);
    body.append('version', String(complaint.version));
    body.append('answerContent', answer.trim());
    files.forEach((file) => body.append('answerAttachments', file));
    setSaving(true);
    setError('');
    try {
      const result = await postFormData(`/api/admin/complaints/${complaint.complaintNo}`, body);
      onSaved(result.message);
    } catch (exception) {
      setError(
        exception.status === 409
          ? '다른 관리자가 먼저 수정했습니다. 최신 목록을 다시 확인해 주세요.'
          : exception.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="answer-form"
      onSubmit={submit}
    >
      <div className="answer-heading">
        <div>
          <h3>관리자 답변</h3>
          {complaint.answerAdminName && (
            <p>
              <span>{complaint.answerAdminName}</span> · <span>{complaint.answeredDateTime}</span>
            </p>
          )}
        </div>
        <label>
          처리상태
          <select
            value={status}
            required
            onChange={(event) => {
              setStatus(event.target.value);
              setAnswer(DEFAULT_ANSWERS[event.target.value] || '');
            }}
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
        </label>
      </div>
      <textarea
        maxLength="3000"
        required
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="사용자에게 전달할 답변을 입력해 주세요."
      />
      {complaint.answerAttachments?.length ? (
        <div className="answer-existing-files">
          <h4>등록된 답변 첨부파일</h4>
          <AttachmentLinks files={complaint.answerAttachments} />
        </div>
      ) : null}
      <div className="answer-file-input">
        <label htmlFor={`answer-files-${complaint.complaintNo}`}>답변 파일첨부</label>
        <input
          key={fileKey}
          id={`answer-files-${complaint.complaintNo}`}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.hwp,.hwpx"
          onChange={(event) => setFiles(Array.from(event.target.files))}
        />
        <small>
          {files.length ? files.map((file) => file.name).join(', ') : '선택된 파일이 없습니다.'}
        </small>
        <button
          type="button"
          onClick={() => {
            setFiles([]);
            setFileKey((key) => key + 1);
          }}
        >
          선택 취소
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="answer-actions">
        <span>답변은 3,000자 이내로 입력해 주세요.</span>
        <button
          type="submit"
          disabled={saving}
        >
          {saving ? '저장 중…' : '답변 및 상태 저장'}
        </button>
      </div>
    </form>
  );
}
