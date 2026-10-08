import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import ComplaintRow from './ComplaintRow.jsx';

const CATEGORIES = [
  ['ALL', '전체'],
  ['PRAISE', '칭찬합니다'],
  ['COMPLAINT', '불편합니다'],
  ['LOST', '분실물 문의'],
];

/**
 * 민원 목록.
 *
 * 통합 전 complaint-list-react의 App.jsx가 원본이다. 달라진 점은 두 가지다.
 *  - 헤더·히어로 마크업을 PublicLayout으로 뺐다.
 *  - 검색 조건과 페이지를 useState가 아니라 URL 쿼리에 둔다.
 *    새로고침·뒤로가기·링크 공유에서 목록 상태가 유지된다.
 */
export default function ComplaintList() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'ALL';
  const keyword = params.get('keyword') || '';
  const page = Number(params.get('page') || 0);

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [postPassword, setPostPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const hasSearchCondition  = category !== 'ALL' ||  keyword !== '' || page !== 0;
  
  function resetSearch() {
	setKeywordInput('');
	
	setParams({
		category: 'ALL',
		keyword: '',
		page: '0',
	});
	}

	
  useEffect(() => { setKeywordInput(keyword); }, [keyword]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const query = new URLSearchParams({ category, keyword, page: String(page) });
    fetch(`/api/public/complaints?${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('민원 목록을 불러오지 못했습니다.');
        return response.json();
      })
      .then(setData)
      .catch((exception) => {
        if (exception.name !== 'AbortError') setError(exception.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, keyword, page]);

  const update = (patch) => setParams({ category, keyword, page: '0', ...patch });

  function openComplaint(item) {
    setSelected(item);
    setPostPassword('');
    setVerifyError('');
  }

  async function verifyComplaint(event) {
    event.preventDefault();
    if (!selected || verifying) return;
    setVerifying(true);
    setVerifyError('');
    try {
      const csrf = await apiGet('/api/csrf', { redirectOnExpire: false });
      const response = await fetch(`/complaints/${selected.complaintNo}/verify`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          [csrf.headerName]: csrf.token,
        },
        body: new URLSearchParams({ password: postPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '비밀번호를 확인하지 못했습니다.');
      }
      window.location.assign(result.redirectUrl);
    } catch (exception) {
      setVerifyError(exception.message);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="page">
      <section className="board">
        <div className="toolbar">
          <nav aria-label="민원 분류">
            {CATEGORIES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={category === value ? 'chip is-active' : 'chip'}
                onClick={() => update({ category: value })}
              >
                {label}
              </button>
            ))}
          </nav>

          <form
            className="search"
            onSubmit={(event) => {
              event.preventDefault();
              update({ keyword: keywordInput.trim() });
            }}
          >
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="제목 또는 작성자 검색"
            />
            <button type="submit">검색</button>
          </form>		
		  {hasSearchCondition && (
			<button type="button" className="reset-button" onClick={resetSearch}>초기화
			</button>			
		  )}
		  

        </div>

        <p className="meta">총 <strong>{data?.totalElements ?? 0}</strong>건</p>

        {loading && <p className="message">목록을 불러오는 중입니다.</p>}
        {error && <p className="message error">{error}</p>}

        {!loading && !error && data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>번호</th><th>분류</th><th>진행상황</th>
                  <th>제목</th><th>작성자</th><th>등록일</th>
                </tr>
              </thead>
              <tbody>
			  	{data.items.map((item) => (
					<ComplaintRow key={item.complaintNo} item={item} onOpen={openComplaint} />
				))}

                {data.items.length === 0 && (
                  <tr><td colSpan="6" className="message">검색 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="board-footer">
          <div className="pagination">
            <button
              type="button"
              disabled={!data || data.first}
              onClick={() => setParams({ category, keyword, page: String(page - 1) })}
            >
              이전
            </button>
            <span>{data && data.totalPages > 0 ? `${data.page + 1} / ${data.totalPages}` : '0 / 0'}</span>
            <button
              type="button"
              disabled={!data || data.last}
              onClick={() => setParams({ category, keyword, page: String(page + 1) })}
            >
              다음
            </button>
          </div>
          <Link
            className="write"
            to={`/complaints/new?category=${category === 'ALL' ? 'COMPLAINT' : category}`}
          >
            글쓰기
          </Link>
        </div>
      </section>
      {selected && (
        <div className="complaint-password-modal" role="presentation">
          <button type="button" className="complaint-password-backdrop" aria-label="닫기" onClick={() => setSelected(null)} />
          <section className="complaint-password-dialog" role="dialog" aria-modal="true" aria-labelledby="complaint-password-title">
            <h2 id="complaint-password-title">게시글 비밀번호 확인</h2>
            <p>{selected.title}</p>
            <form onSubmit={verifyComplaint}>
              <label htmlFor="complaint-post-password">게시글 비밀번호</label>
              <input
                id="complaint-post-password"
                type="password"
                maxLength={20}
                autoFocus
                required
                value={postPassword}
                onChange={(event) => setPostPassword(event.target.value)}
              />
              {verifyError && <p className="complaint-password-error" role="alert">{verifyError}</p>}
              <div className="complaint-password-actions">
                <button type="button" onClick={() => setSelected(null)}>취소</button>
                <button type="submit" disabled={verifying}>{verifying ? '확인 중...' : '확인'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
