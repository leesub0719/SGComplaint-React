import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import SafeHtml from '../../shared/SafeHtml.jsx';

export default function NoticeDetail() {
  const { noticeNo } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiGet(`/api/notices/${noticeNo}`, { redirectOnExpire: false })
      .then(setItem)
      .catch((reason) => setError(reason.message));
  }, [noticeNo]);
  return (
    <main className="notice-page detail-page">
      {error && <p className="message error">{error}</p>}
      {item && (
        <article className="notice-detail">
          <div className="detail-labels">
            <span>{item.categoryLabel}</span>
            {item.pinned && <b>상단 고정</b>}
          </div>
          <h1>{item.title}</h1>
          <dl>
            <div>
              <dt>등록일</dt>
              <dd>{item.registeredDateTime}</dd>
            </div>
            <div>
              <dt>작성자</dt>
              <dd>{item.administratorName}</dd>
            </div>
            <div>
              <dt>조회수</dt>
              <dd>{item.viewCount}</dd>
            </div>
          </dl>
          <section>
            <h2 className="sr-only">공지사항 내용</h2>
            <SafeHtml
              className="notice-rich-content"
              html={item.content}
            />
          </section>
          <div className="detail-actions">
            <Link to="/notices">목록으로 돌아가기</Link>
          </div>
        </article>
      )}
    </main>
  );
}
