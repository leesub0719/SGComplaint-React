import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';

export default function NoticeList() {
  const [params, setParams] = useSearchParams(); const keyword = params.get('keyword') || ''; const page = Number(params.get('page') || 0);
  const [input, setInput] = useState(keyword); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { setInput(keyword); apiGet(`/api/notices?keyword=${encodeURIComponent(keyword)}&page=${page}`, { redirectOnExpire: false }).then(setData).catch((reason) => setError(reason.message)); }, [keyword, page]);
  const start = Math.max(0, page - 4); const end = Math.min((data?.totalPages || 1) - 1, page + 4);
  return <main className="notice-page"><section className="notice-heading"><h1>공지사항</h1><span>(주) 서경 마을버스의 새로운 소식과 주요 안내를 확인하세요.</span></section><section className="notice-board">
    <div className="notice-toolbar"><div><h2>공지사항</h2><p>총 <strong>{data?.totalElements || 0}</strong>건</p></div><form onSubmit={(event) => { event.preventDefault(); setParams({ keyword: input.trim(), page: '0' }); }}><label className="sr-only" htmlFor="notice-keyword">공지사항 제목 검색</label><input id="notice-keyword" type="search" maxLength="100" value={input} onChange={(event) => setInput(event.target.value)} placeholder="제목 앞부분을 검색하세요" /><button type="submit" aria-label="검색"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg></button></form></div>
    {error && <p className="message error">{error}</p>}<div className="notice-table-wrap"><table><thead><tr><th>번호</th><th>분류</th><th>제목</th><th>등록일</th><th>조회</th></tr></thead><tbody>{data?.items?.map((notice) => <tr key={notice.noticeNo} className={notice.pinned ? 'pinned-row' : ''}><td>{notice.pinned ? <span className="pin-badge">공지</span> : notice.noticeNo}</td><td><span className="category-badge">{notice.categoryLabel}</span></td><td className="notice-title"><Link to={`/notices/${notice.noticeNo}`}>{notice.title}</Link></td><td>{notice.registeredDate}</td><td>{notice.viewCount}</td></tr>)}{data && !data.items.length && <tr><td className="empty-row" colSpan="5">등록된 공지사항이 없습니다.</td></tr>}</tbody></table></div>
    {data && data.totalPages > 0 && <nav className="pagination" aria-label="공지사항 페이지 이동"><button className={data.first ? 'disabled' : ''} disabled={data.first} onClick={() => setParams({ keyword, page: String(page - 1) })}>‹</button>{Array.from({ length: end - start + 1 }, (_, i) => start + i).map((number) => <button key={number} className={number === page ? 'active' : ''} onClick={() => setParams({ keyword, page: String(number) })}>{number + 1}</button>)}<button className={data.last ? 'disabled' : ''} disabled={data.last} onClick={() => setParams({ keyword, page: String(page + 1) })}>›</button></nav>}
  </section></main>;
}
