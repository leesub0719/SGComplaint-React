import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import SafeHtml from '../../shared/SafeHtml.jsx';
export default function ComplaintDetail() {
  const { complaintNo } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState('');
  useEffect(() => { apiGet(`/complaints/view/${complaintNo}`, { redirectOnExpire: false }).then(setItem).catch((e) => setError(e.message)); }, [complaintNo]);
  return <main className="page"><article className="content-card detail-card">{error && <p className="message error">{error}</p>}{item && <><span className="badge">{item.statusLabel}</span><h1>{item.title}</h1><p className="meta">{item.maskedWriterName} · {item.registeredDateTime}</p><SafeHtml className="rich-content" html={item.content}/><h2>관리자 답변</h2><p>{item.answerContent || '답변을 준비하고 있습니다.'}</p><Link className="button-link" to="/complaints">목록</Link></>}</article></main>;
}
