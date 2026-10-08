import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';

export default function Routes() {
  const { type } = useParams(); const code = type === 'ddokbus' ? 'DDOK' : 'VILLAGE'; const title = code === 'DDOK' ? '똑버스' : '마을버스';
  const [data, setData] = useState({ routes: [], guideImages: [] }); const [error, setError] = useState('');
  useEffect(() => { apiGet(`/api/routes?type=${code}`, { redirectOnExpire: false }).then(setData).catch((reason) => setError(reason.message)); }, [code]);
  const empty = code === 'VILLAGE' ? !data.routes.length : !data.guideImages.length;
  return <main className="route-page"><div className="route-page-inner"><nav className="route-type-tabs" aria-label="버스 유형 선택"><NavLink to="/route/village-bus" className={code === 'VILLAGE' ? 'active' : ''}>마을버스</NavLink><NavLink to="/route/ddokbus" className={code === 'DDOK' ? 'active' : ''}>똑버스</NavLink></nav>
    <header className="route-section-heading"><p>ROUTE INFORMATION</p><h2><span>{title}</span> 운행안내</h2><span>{code === 'DDOK' ? '등록된 똑버스 안내 이미지를 확인할 수 있습니다.' : '등록된 노선의 운행 정보와 상세 노선 링크를 확인할 수 있습니다.'}</span></header>
    {error && <p className="message error">{error}</p>}
    {code === 'VILLAGE' && <section className="route-card-grid" aria-label="마을버스 노선 목록">{data.routes.map((route) => <article className="route-card" key={route.routeNo}><h3>{route.busName}</h3><dl><div><dt>기점 - 종점</dt><dd>{route.terminalInfo}</dd></div><div><dt>배차 간격</dt><dd>{route.dispatchInterval}</dd></div><div><dt>문의 전화</dt><dd>{route.inquiryPhone}</dd></div></dl><a className="route-guide-button" href={route.routeUrl} target="_blank" rel="noreferrer"><span>➤</span> 노선안내</a></article>)}</section>}
    {code === 'DDOK' && Boolean(data.guideImages.length) && <section className="ddok-guide-gallery" aria-label="똑버스 안내 이미지">{data.guideImages.map((image) => <figure className="ddok-guide-image" key={image.imageNo}><img src={image.imageUrl} alt={`똑버스 안내 - ${image.originalName}`} /></figure>)}</section>}
    {empty && <div className="route-empty"><strong>{title} 운행정보를 준비 중입니다.</strong><p>관리자 페이지에서 노선을 등록하면 이곳에 표시됩니다.</p></div>}
  </div></main>;
}
