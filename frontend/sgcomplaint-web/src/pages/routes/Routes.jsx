import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
export default function Routes() {
  const { type } = useParams(); const code = type === 'ddokbus' ? 'DDOK' : 'VILLAGE'; const [data, setData] = useState({ routes: [], guideImages: [] });
  useEffect(() => { apiGet(`/api/routes?type=${code}`, { redirectOnExpire: false }).then(setData); }, [code]);
  return <main className="page"><section className="content-card"><h1>{code === 'DDOK' ? '똑버스' : '마을버스'} 운행안내</h1><div className="card-grid">{data.routes.map((r) => <article key={r.routeNo} className="info-card"><h2>{r.busName}</h2><p>{r.terminalInfo}</p><dl><dt>배차간격</dt><dd>{r.dispatchInterval}</dd><dt>문의</dt><dd>{r.inquiryPhone}</dd></dl><a href={r.routeUrl} target="_blank" rel="noreferrer">노선 보기</a></article>)}</div><div className="image-grid">{data.guideImages.map((image) => <img key={image.imageNo} src={image.imageUrl} alt={image.originalName}/>)}</div></section></main>;
}
