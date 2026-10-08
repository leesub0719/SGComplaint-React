import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
export default function NoticeList() {
  const [params, setParams] = useSearchParams(); const keyword = params.get('keyword') || ''; const page = Number(params.get('page') || 0);
  const [input, setInput] = useState(keyword); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { apiGet(`/api/notices?keyword=${encodeURIComponent(keyword)}&page=${page}`, { redirectOnExpire: false }).then(setData).catch((e) => setError(e.message)); }, [keyword, page]);
  return <main className="page"><section className="content-card"><div className="section-heading"><h1>공지사항</h1><span>총 {data?.totalElements ?? 0}건</span></div><form className="inline-form" onSubmit={(e) => { e.preventDefault(); setParams({ keyword: input, page: '0' }); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="제목 검색"/><button>검색</button></form>{error && <p className="message error">{error}</p>}<div className="simple-list">{data?.items.map((n) => <Link key={n.noticeNo} to={`/notices/${n.noticeNo}`}><strong>{n.pinned && '📌 '}{n.title}</strong><span>{n.registeredDate} · 조회 {n.viewCount}</span></Link>)}</div><div className="pager"><button disabled={data?.first} onClick={() => setParams({ keyword, page: String(page - 1) })}>이전</button><span>{page + 1} / {Math.max(1, data?.totalPages ?? 1)}</span><button disabled={data?.last} onClick={() => setParams({ keyword, page: String(page + 1) })}>다음</button></div></section></main>;
}
