import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import SafeHtml from '../../shared/SafeHtml.jsx';

const QUICK_LINKS = [
  ['COMPLAINT', 'route-icon', '배차 노선 문제', <path key="route" d="M12 13c0-5 8-5 8 0 0 4-4 8-4 8s-4-4-4-8zm18 18c0-5 8-5 8 0 0 4-4 8-4 8s-4-4-4-8zM16 24v4c0 4 4 5 8 5h6M26 13h8v10" />],
  ['PRAISE', 'thumb-icon', '칭찬하고 싶어요', <path key="thumb" d="M18 39H9V21h9v18zm5 0h13c3 0 5-2 6-5l2-11c1-4-2-7-6-7h-7l2-7c1-4-5-6-7-2l-8 14v18h5z" />],
  ['COMPLAINT', 'face-icon', '개선해주세요', <g key="face"><circle cx="24" cy="24" r="17" /><path d="m15 18 6 3M33 18l-6 3M17 31c4-4 10-4 14 0" /></g>],
  ['LOST', 'route-icon', '분실물 문의', <g key="lost"><rect x="10" y="16" width="28" height="23" rx="3" /><path d="M18 16v-3c0-3 2-5 5-5h2c3 0 5 2 5 5v3M10 25h28M20 25v4M28 25v4" /></g>],
];

export default function Home() {
  const [data, setData] = useState({ banners: [], notices: [], popupNotices: [] });
  const [active, setActive] = useState(0);
  const [closedPopups, setClosedPopups] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { apiGet('/api/home', { redirectOnExpire: false }).then(setData).catch((reason) => setError(reason.message)); }, []);
  useEffect(() => {
    if (data.banners.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % data.banners.length), 5000);
    return () => window.clearInterval(timer);
  }, [data.banners.length]);
  const banners = data.banners.length ? data.banners : [{ bannerNo: 'default', imageUrl: '/app/images/bus-hero.png', originalName: '시내 도로를 운행하는 버스' }];
  const visiblePopups = data.popupNotices.filter((popup) => !closedPopups.includes(popup.noticeNo) && Number(localStorage.getItem(`sg-notice-popup-hidden-until-${popup.noticeNo}`) || 0) < Date.now());
  function closePopup(no, hideToday) { if (hideToday) localStorage.setItem(`sg-notice-popup-hidden-until-${no}`, String(Date.now() + 86400000)); setClosedPopups((old) => [...old, no]); }

  return <main id="main-content">
    <section className="hero" aria-label="메인 배너"><div className="hero-photo-wrap">{banners.map((banner, index) => <img key={banner.bannerNo} className={index === active ? 'hero-slide active' : 'hero-slide'} src={banner.imageUrl} alt={banner.originalName} aria-hidden={index !== active} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/app/images/bus-hero.png'; }} />)}</div>
      {banners.length > 1 && <button className="banner-next-button" type="button" onClick={() => setActive((active + 1) % banners.length)} aria-label="다음 메인 배너"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg></button>}
      <div className="slider-dots" aria-label="메인 배너 페이지">{banners.map((banner, index) => <button key={banner.bannerNo} className={index === active ? 'active' : ''} type="button" onClick={() => setActive(index)} aria-label={`${index + 1}번째 배너`} aria-current={index === active ? 'true' : undefined} />)}</div>
    </section>
    {error && <p className="message error">{error}</p>}
    <section className="quick-menu" aria-labelledby="quick-title"><div className="page-width"><h2 id="quick-title" className="sr-only">민원 유형 바로가기</h2><div className="quick-grid">{QUICK_LINKS.map(([category, iconClass, label, icon]) => <Link className="quick-card" to={`/complaints?category=${category}`} key={label}><span className={`round-icon ${iconClass}`}><svg viewBox="0 0 48 48">{icon}</svg></span><strong>{label}</strong><span className="arrow">›</span></Link>)}</div></div></section>
    <section className="bottom-section"><div className="page-width bottom-grid"><article className="panel process-panel"><h2>민원 처리 절차</h2><ol className="process-list"><li><span className="step-number">01</span><span className="process-icon">▤</span><div><strong>접수</strong><p>민원 내용을<br />작성하여 접수합니다.</p></div></li><li><span className="step-number">02</span><span className="process-icon">♙</span><div><strong>담당자 확인</strong><p>담당자가 민원 내용을<br />확인하고 처리합니다.</p></div></li><li><span className="step-number">03</span><span className="process-icon">✉</span><div><strong>답변 완료</strong><p>처리 결과를 확인하고<br />답변을 받을 수 있습니다.</p></div></li></ol></article>
      <article className="panel notice-panel"><div className="panel-header"><h2>공지사항</h2><Link to="/notices">더보기 ›</Link></div><ul className="notice-list">{data.notices.length ? data.notices.map((notice) => <li key={notice.noticeNo}><Link to={`/notices/${notice.noticeNo}`}><span>{notice.title}</span><time>{notice.registeredDate}</time></Link></li>) : <li><Link to="/notices"><span>등록된 공지사항이 없습니다.</span><time>-</time></Link></li>}</ul></article></div></section>
    {visiblePopups.map((popup, index) => <NoticePopup key={popup.noticeNo} popup={popup} index={index} total={visiblePopups.length} onClose={closePopup} />)}
  </main>;
}

function NoticePopup({ popup, index, total, onClose }) {
  const [hideToday, setHideToday] = useState(false);
  return <div className="notice-popup" style={{ '--notice-popup-offset': `${index * 24}px`, '--notice-popup-mobile-offset': `${index * 14}px`, '--notice-popup-layer': total - index }}><section className="notice-popup-dialog" role="dialog"><header className="notice-popup-header"><span>NOTICE <b>{total > 1 ? `${index + 1} / ${total}` : ''}</b></span><button type="button" onClick={() => onClose(popup.noticeNo, hideToday)}>×</button></header><h2>{popup.title}</h2><SafeHtml className="notice-popup-content" html={popup.content} /><Link className="notice-popup-detail" to={`/notices/${popup.noticeNo}`}>공지사항 자세히 보기 →</Link><footer className="notice-popup-footer"><label><input type="checkbox" checked={hideToday} onChange={(event) => setHideToday(event.target.checked)} /> 하루 동안 보지 않기</label><button type="button" onClick={() => onClose(popup.noticeNo, hideToday)}>닫기</button></footer></section></div>;
}
