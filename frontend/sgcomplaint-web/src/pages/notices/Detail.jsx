import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import SafeHtml from '../../shared/SafeHtml.jsx';
export default function NoticeDetail() {
  const { noticeNo } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState('');
  useEffect(() => { apiGet(`/api/notices/${noticeNo}`, { redirectOnExpire: false }).then(setItem).catch((e) => setError(e.message)); }, [noticeNo]);
  return <main className="page"><article className="content-card detail-card">{error && <p className="message error">{error}</p>}{item && <><span className="eyebrow">{item.categoryLabel}</span><h1>{item.title}</h1><p className="meta">{item.administratorName} · {item.registeredDateTime} · 조회 {item.viewCount}</p><SafeHtml className="rich-content" html={item.content}/><Link className="button-link" to="/notices">목록</Link></>}</article></main>;
}
