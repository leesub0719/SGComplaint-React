import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet, apiPut, ApiError } from '../../shared/api.js';
import RichTextEditor from '../complaints/RichTextEditor.jsx';

const CATEGORY_OPTIONS = [
  ['PRAISE', '칭찬합니다'],
  ['COMPLAINT', '불편합니다'],
  ['LOST', '분실물 문의'],
];

function dateText(date) {
  return date.toISOString().slice(0, 10);
}

function oneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return dateText(date);
}

export default function MyInquiries() {
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(() => dateText(new Date()));
  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState(null);
  const [openNo, setOpenNo] = useState(null);
  const [editingNo, setEditingNo] = useState(null);
  const [form, setForm] = useState({ category: '', title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
        page: String(pageNumber),
      });
      setPage(await apiGet(`/api/mypage/inquiries?${query}`));
    } catch (exception) {
      setMessage({ type: 'error', text: exception.message });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, pageNumber]);

  useEffect(() => { load(); }, [load]);

  function search(event) {
    event.preventDefault();
    if (pageNumber === 0) {
      load();
    } else {
      setPageNumber(0);
    }
  }

  function beginEdit(item) {
    setOpenNo(item.complaintNo);
    setEditingNo(item.complaintNo);
    setForm({
      category: item.categoryCode,
      title: item.title,
      content: item.content,
    });
    setMessage(null);
  }

  async function save(item) {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: '제목을 입력해 주세요.' });
      return;
    }
    if (!form.content.replace(/<[^>]*>/g, '').trim()) {
      setMessage({ type: 'error', text: '내용을 입력해 주세요.' });
      return;
    }

    setSaving(true);
    try {
      const result = await apiPut(
        `/api/mypage/inquiries/${item.complaintNo}`,
        form,
      );
      setMessage({ type: 'success', text: result.message });
      setEditingNo(null);
      await load();
    } catch (exception) {
      const fieldMessage = exception instanceof ApiError
        ? Object.values(exception.fieldErrors)[0]
        : null;
      setMessage({ type: 'error', text: fieldMessage || exception.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`'${item.title}' 문의를 삭제하시겠습니까?`)) return;
    try {
      const result = await apiDelete(`/api/mypage/inquiries/${item.complaintNo}`);
      setMessage({ type: 'success', text: result.message });
      setOpenNo(null);
      setEditingNo(null);
      await load();
    } catch (exception) {
      setMessage({ type: 'error', text: exception.message });
    }
  }

  const items = page?.content ?? [];

  return (
    <main className="page mypage-shell">
      <aside className="side-menu">
        <strong>마이페이지</strong>
        <Link to="/mypage">정보수정</Link>
        <Link className="active" to="/mypage/inquiries">나의 문의내역</Link>
      </aside>

      <section className="mypage-content panel inquiry-panel">
        <div className="panel-heading">
          <span>MY INQUIRIES</span>
          <h1>문의내역</h1>
          <p>내가 등록한 문의를 확인하고, 처리 전 문의는 수정하거나 삭제할 수 있습니다.</p>
        </div>

        {message && <p className={`alert ${message.type}`}>{message.text}</p>}

        <form className="inquiry-search-form" onSubmit={search}>
          <label htmlFor="my-inquiry-start">조회기간</label>
          <input
            id="my-inquiry-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <span>~</span>
          <input
            type="date"
            value={endDate}
            aria-label="조회 종료일"
            onChange={(event) => setEndDate(event.target.value)}
          />
          <button type="submit">조회</button>
        </form>

        <div className="inquiry-summary-row">
          <span>총 <strong>{page?.totalElements ?? 0}</strong>건</span>
          <Link className="inquiry-new-link" to="/complaints/new">새 문의 작성</Link>
        </div>

        {loading && <p className="message">문의내역을 불러오는 중입니다.</p>}

        {!loading && items.length === 0 && (
          <p className="message">조회된 문의내역이 없습니다.</p>
        )}

        {!loading && items.map((item) => {
          const opened = openNo === item.complaintNo;
          const editing = editingNo === item.complaintNo;
          return (
            <article className="my-inquiry-item" key={item.complaintNo}>
              <button
                className="my-inquiry-summary"
                type="button"
                aria-expanded={opened}
                onClick={() => {
                  if (editing) return;
                  setOpenNo(opened ? null : item.complaintNo);
                }}
              >
                <span>#{item.complaintNo}</span>
                <strong>{item.title}</strong>
                <em className={`badge ${item.statusCssClass}`}>{item.statusLabel}</em>
                <time>{item.registeredDate}</time>
              </button>

              {opened && (
                <div className="my-inquiry-detail">
                  {editing ? (
                    <div className="inquiry-edit-form">
                      <label>
                        분류
                        <select
                          value={form.category}
                          onChange={(event) => setForm({ ...form, category: event.target.value })}
                        >
                          {CATEGORY_OPTIONS.map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        제목
                        <input
                          maxLength="100"
                          value={form.title}
                          onChange={(event) => setForm({ ...form, title: event.target.value })}
                        />
                      </label>
                      <div className="inquiry-edit-field">
                        <strong>내용</strong>
                        <RichTextEditor
                          key={item.complaintNo}
                          initialContent={form.content}
                          onChange={(html) => setForm((previous) => ({ ...previous, content: html }))}
                        />
                      </div>
                      <div className="inquiry-actions">
                        <button type="button" className="secondary" onClick={() => setEditingNo(null)}>
                          취소
                        </button>
                        <button type="button" className="primary" disabled={saving} onClick={() => save(item)}>
                          {saving ? '저장 중...' : '수정 완료'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <section>
                        <h2>문의 내용</h2>
                        <div dangerouslySetInnerHTML={{ __html: item.content }} />
                      </section>
                      <section className="inquiry-answer-box">
                        <h2>답변</h2>
                        <p>{item.answerContent || '담당자가 문의 내용을 확인하고 있습니다.'}</p>
                        {(item.answerAttachments ?? []).map((file) => (
                          <a key={file.downloadUrl} href={file.downloadUrl}>
                            {file.originalName} ({file.formattedSize})
                          </a>
                        ))}
                      </section>
                      {item.editable && (
                        <div className="inquiry-actions">
                          <button type="button" className="secondary" onClick={() => beginEdit(item)}>
                            수정
                          </button>
                          <button type="button" className="danger" onClick={() => remove(item)}>
                            삭제
                          </button>
                        </div>
                      )}
                      {!item.editable && (
                        <p className="inquiry-locked-message">
                          관리자가 확인한 문의는 수정하거나 삭제할 수 없습니다.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {page && page.totalPages > 1 && (
          <nav className="pagination" aria-label="문의내역 페이지">
            <button
              type="button"
              disabled={page.first}
              onClick={() => setPageNumber((number) => Math.max(0, number - 1))}
            >
              이전
            </button>
            <span>{page.number + 1} / {page.totalPages}</span>
            <button
              type="button"
              disabled={page.last}
              onClick={() => setPageNumber((number) => number + 1)}
            >
              다음
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
