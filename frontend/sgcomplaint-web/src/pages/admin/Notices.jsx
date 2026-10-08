import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPatch, postFormData } from '../../shared/api.js';
import AdminPagination from './AdminPagination.jsx';
import NoticeEditor from './NoticeEditor.jsx';

const EMPTY = { category: 'GENERAL', title: '', content: '', pinned: false, popup: false };

function NoticeForm() {
  const { noticeNo } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editMode = Boolean(noticeNo);

  useEffect(() => {
    if (!editMode) return;
    apiGet(`/api/admin/notices/${noticeNo}`)
      .then(setForm)
      .catch((reason) => setError(reason.message));
  }, [editMode, noticeNo]);

  async function save(event) {
    event.preventDefault();
    const editor = editorRef.current?.submission();
    if (!editor) return;
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('category', form.category);
      body.append('title', form.title);
      body.append('content', editor.content);
      body.append('pinned', String(form.pinned));
      body.append('popup', String(form.popup));
      editor.files.forEach((file) => body.append('contentImages', file));
      const result = await postFormData(
        editMode ? `/api/admin/notices/${noticeNo}` : '/api/admin/notices',
        body,
      );
      navigate('/admin/notices', { replace: true, state: { message: result.message } });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && <div className="flash-message error">{error}</div>}
      <section className="admin-form-panel">
        <div className="panel-heading">
          <div>
            <h2>{editMode ? '공지사항 수정' : '공지사항 등록'}</h2>
          </div>
          <Link
            className="notice-list-link"
            to="/admin/notices"
          >
            ← 공지사항 목록
          </Link>
        </div>
        <form
          id="notice-form"
          className="notice-form"
          onSubmit={save}
        >
          <div className="form-row">
            <label>
              공지 분류
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              >
                <option value="">분류 선택</option>
                <option value="GENERAL">일반 안내</option>
                <option value="SYSTEM">시스템 점검</option>
                <option value="SERVICE">서비스 변경</option>
              </select>
            </label>
            <label>
              게시 설정
              <span className="notice-setting-options">
                <span className="notice-pin-control">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
                  />{' '}
                  고객 게시판 상단 고정
                </span>
                <span className="notice-pin-control">
                  <input
                    type="checkbox"
                    checked={form.popup}
                    onChange={(event) => setForm({ ...form, popup: event.target.checked })}
                  />{' '}
                  메인 접속 시 팝업 표시
                </span>
              </span>
            </label>
          </div>
          <label>
            제목
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength="100"
              placeholder="공지사항 제목을 입력해 주세요."
              required
            />
          </label>
          <NoticeEditor
            ref={editorRef}
            initialHtml={form.content || ''}
          />
          <div className="form-bottom">
            <span>
              {editMode
                ? '수정사항은 저장 즉시 고객 게시판에 반영됩니다.'
                : '등록 즉시 고객 공지사항 게시판에 노출되며, 팝업 설정 시 메인 화면에도 표시됩니다.'}
            </span>
            <button
              type="submit"
              disabled={saving}
            >
              {saving ? '저장 중...' : editMode ? '수정 저장' : '공지사항 등록'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function NoticeList() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const load = useCallback(
    () =>
      apiGet(`/api/admin/notices?page=${page}`)
        .then(setData)
        .catch((reason) => setError(reason.message)),
    [page],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function remove(no) {
    if (!window.confirm('이 공지사항을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) return;
    try {
      setMessage((await apiDelete(`/api/admin/notices/${no}`)).message);
      setError('');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function popup(item) {
    try {
      setMessage(
        (await apiPatch(`/api/admin/notices/${item.noticeNo}/popup`, { popup: !item.popup }))
          .message,
      );
      setError('');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <>
      {message && <div className="flash-message success">{message}</div>}
      {error && <div className="flash-message error">{error}</div>}
      <section className="admin-panel recent-panel notice-board-panel">
        <div className="panel-heading notice-list-heading">
          <div>
            <h2>최근 등록 공지사항</h2>
            <p>
              전체 <strong>{data?.totalElements || 0}</strong>건 · 한 페이지에 10건씩 표시됩니다.
            </p>
          </div>
          <Link
            className="admin-primary-button"
            to="/admin/notices/new"
          >
            ＋ 공지사항 등록
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table notice-management-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>분류</th>
                <th>제목</th>
                <th>게시 설정</th>
                <th>메인 팝업</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((notice) => (
                <tr key={notice.noticeNo}>
                  <td>{notice.noticeNo}</td>
                  <td>
                    <span className="notice-category-badge">{notice.categoryLabel}</span>
                  </td>
                  <td className="title-cell">
                    <a
                      href={`/app/notices/${notice.noticeNo}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {notice.title}
                    </a>
                  </td>
                  <td>
                    <span className={notice.pinned ? 'notice-setting-on' : 'notice-setting-off'}>
                      {notice.pinned ? '상단 고정' : '일반'}
                    </span>
                  </td>
                  <td>
                    <label className="notice-popup-toggle">
                      <input
                        type="checkbox"
                        checked={notice.popup}
                        onChange={() => popup(notice)}
                      />
                      <span>{notice.popup ? '사용' : '미사용'}</span>
                    </label>
                  </td>
                  <td>{notice.registeredDate}</td>
                  <td>
                    <div className="notice-row-actions">
                      <Link
                        className="notice-edit-button"
                        to={`/admin/notices/${notice.noticeNo}/edit`}
                      >
                        수정
                      </Link>
                      <button
                        className="notice-delete-button"
                        type="button"
                        onClick={() => remove(notice.noticeNo)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.items?.length && (
                <tr>
                  <td
                    className="table-empty"
                    colSpan="7"
                  >
                    등록된 공지사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={data}
          onChange={setPage}
        />
      </section>
    </>
  );
}

export default function AdminNotices() {
  const { noticeNo } = useParams();
  const { pathname } = useLocation();
  return noticeNo || pathname.endsWith('/new') ? <NoticeForm /> : <NoticeList />;
}
