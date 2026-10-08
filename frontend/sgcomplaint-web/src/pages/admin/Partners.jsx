import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../../shared/api.js';
import AdminPagination from './AdminPagination.jsx';

const EMPTY = { name: '', phone: '', site: '', notes: '' };

function PartnerModal({ partner, onClose, onSaved }) {
  const editing = Boolean(partner?.partnerNo);
  const [form, setForm] = useState(
    partner
      ? {
          name: partner.name || '',
          phone: partner.phone || '',
          site: partner.site || '',
          notes: partner.notes || '',
        }
      : EMPTY,
  );
  const [error, setError] = useState('');
  async function save(event) {
    event.preventDefault();
    try {
      const result = editing
        ? await apiPut(`/api/admin/partners/${partner.partnerNo}`, form)
        : await apiPost('/api/admin/partners', form);
      onSaved(result.message);
    } catch (reason) {
      setError(reason.message);
    }
  }
  return (
    <div className="partner-modal">
      <button
        className="partner-modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label="창 닫기"
      />
      <section
        className="partner-modal-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header className="partner-modal-header">
          <div>
            <h2>{editing ? '협력업체 수정' : '협력업체 등록'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
          >
            ×
          </button>
        </header>
        <form
          className="partner-form"
          onSubmit={save}
        >
          {error && <div className="flash-message error">{error}</div>}
          <div className="partner-card-form">
            <div
              className="partner-card-mark"
              aria-hidden="true"
            >
              {form.name?.charAt(0) || 'SG'}
            </div>
            <div className="partner-card-fields">
              <label>
                이름 <b>*</b>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  maxLength="100"
                  required
                  placeholder="협력업체 이름"
                />
              </label>
              <label>
                전화번호 <b>*</b>
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  maxLength="30"
                  required
                  placeholder="032-000-0000"
                />
              </label>
              <label className="wide">
                사이트
                <input
                  value={form.site}
                  onChange={(event) => setForm({ ...form, site: event.target.value })}
                  maxLength="500"
                  placeholder="https://example.com"
                />
              </label>
              <label className="wide partner-notes-field">
                기타사항
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  maxLength="2000"
                  rows="7"
                  placeholder="담당 업무, 담당자, 참고사항 등을 입력해 주세요."
                />
              </label>
            </div>
          </div>
          <footer className="partner-form-actions">
            <button
              type="button"
              onClick={onClose}
            >
              취소
            </button>
            <button type="submit">{editing ? '수정 저장' : '등록하기'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Partners() {
  const [data, setData] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(undefined);
  const [popover, setPopover] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(
    () =>
      apiGet(`/api/admin/partners?keyword=${encodeURIComponent(search)}&page=${page}`)
        .then(setData)
        .catch((reason) => setError(reason.message)),
    [search, page],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function remove(item) {
    if (!window.confirm(`${item.name} 협력업체를 삭제하시겠습니까?`)) return;
    try {
      setMessage((await apiDelete(`/api/admin/partners/${item.partnerNo}`)).message);
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function saved(savedMessage) {
    setMessage(savedMessage);
    setModal(undefined);
    await load();
  }
  function submitSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch(keyword.trim());
  }

  return (
    <>
      {message && <div className="flash-message success">{message}</div>}
      {error && <div className="flash-message error">{error}</div>}
      <section
        className="partner-summary"
        aria-label="협력업체 현황"
      >
        <article>
          <span aria-hidden="true">♧</span>
          <div>
            <small>등록된 협력업체</small>
            <strong>{data?.totalCount || 0}</strong>
            <p>명함 형태로 관리 중인 업체</p>
          </div>
        </article>
        <button
          type="button"
          className="partner-create-button"
          onClick={() => setModal(null)}
        >
          <b aria-hidden="true">＋</b> 협력업체 등록
        </button>
      </section>
      <section className="admin-panel partner-panel">
        <div className="panel-heading partner-list-heading">
          <div>
            <h2>협력업체 목록</h2>
            <p>업체 이름을 클릭하면 등록된 명함 정보를 확인할 수 있습니다.</p>
          </div>
          <em>
            검색 결과 <b>{data?.page?.totalElements || 0}</b>개
          </em>
        </div>
        <form
          className="partner-search"
          onSubmit={submitSearch}
        >
          <label
            className="sr-only"
            htmlFor="partner-keyword"
          >
            협력업체 검색
          </label>
          <input
            id="partner-keyword"
            type="search"
            maxLength="100"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 전화번호, 사이트 앞부분 검색"
          />
          <button type="submit">검색</button>
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setSearch('');
              setPage(0);
            }}
          >
            초기화
          </button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table partner-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>사이트</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {data?.page?.items?.map((item) => (
                <tr key={item.partnerNo}>
                  <td>{item.partnerNo}</td>
                  <td>
                    <button
                      className="partner-name-button"
                      type="button"
                      onClick={() => setPopover(item)}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td>{item.phone}</td>
                  <td className="partner-site-cell">
                    {item.site ? (
                      <a
                        href={item.site}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.site}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>{item.createdDate}</td>
                  <td>
                    <div className="partner-row-actions">
                      <button
                        type="button"
                        className="partner-edit-button"
                        onClick={() => setModal(item)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.page?.items?.length && (
                <tr>
                  <td
                    className="table-empty"
                    colSpan="6"
                  >
                    검색 조건에 해당하는 협력업체가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={data?.page}
          onChange={setPage}
        />
      </section>
      {popover && (
        <aside className="partner-popover">
          <header>
            <div>
              <h3>{popover.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPopover(null)}
            >
              ×
            </button>
          </header>
          <dl>
            <div>
              <dt>전화번호</dt>
              <dd>{popover.phone}</dd>
            </div>
            <div>
              <dt>사이트</dt>
              <dd>
                {popover.site ? (
                  <a
                    href={popover.site}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {popover.site}
                  </a>
                ) : (
                  '등록되지 않음'
                )}
              </dd>
            </div>
            <div className="wide">
              <dt>기타사항</dt>
              <dd className="partner-popover-notes">
                {popover.notes || '등록된 기타사항이 없습니다.'}
              </dd>
            </div>
          </dl>
        </aside>
      )}
      {modal !== undefined && (
        <PartnerModal
          partner={modal}
          onClose={() => setModal(undefined)}
          onSaved={saved}
        />
      )}
    </>
  );
}
