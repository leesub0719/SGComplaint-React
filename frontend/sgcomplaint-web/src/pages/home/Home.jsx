import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
export default function Home() {
  const [data, setData] = useState({ banners: [], notices: [] }); const [error, setError] = useState('');
  useEffect(() => { apiGet('/api/home', { redirectOnExpire: false }).then(setData).catch((e) => setError(e.message)); }, []);
  return <main className="page home-page"><section className="home-hero">{data.banners[0] ? <img src={data.banners[0].imageUrl} alt="메인 배너" /> : <div className="hero-fallback">서경 마을버스</div>}<div><p>시민의 일상과 함께 달립니다</p><h1>안전하고 편리한 마을버스</h1></div></section>{error && <p className="message error">{error}</p>}<section className="content-card"><div className="section-heading"><h2>최근 공지사항</h2><Link to="/notices">전체보기</Link></div><div className="simple-list">{data.notices.map((n) => <Link key={n.noticeNo} to={`/notices/${n.noticeNo}`}><strong>{n.title}</strong><span>{n.registeredDate}</span></Link>)}</div></section></main>;
}
