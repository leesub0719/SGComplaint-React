import { Link } from 'react-router-dom';

export default function ComingSoon({
  title = '페이지 준비 중',
  description = '요청하신 페이지는 다음 단계에서 기능을 연결할 예정입니다.',
}) {
  return (
    <main className="message-card">
      <div
        className="message-icon"
        aria-hidden="true"
      >
        🛠
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="message-actions">
        <Link
          className="button primary"
          to="/"
        >
          메인으로
        </Link>
      </div>
    </main>
  );
}
