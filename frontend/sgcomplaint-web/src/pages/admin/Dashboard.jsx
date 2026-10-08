import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import AdminPagination from './AdminPagination.jsx';
import ComplaintDetailModal from './ComplaintDetailModal.jsx';

const STATUS = {
  ALL: { label: '전체', icon: '▤', tone: 'green', caption: '누적 접수' },
  CHECKING: { label: '확인중', icon: '◷', tone: 'yellow', caption: '확인 필요' },
  PROCESSING: { label: '처리중', icon: '↻', tone: 'blue', caption: '담당자 처리' },
  COMPLETED: { label: '답변완료', icon: '✓', tone: 'mint', caption: '처리 완료' },
};

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'ALL';
  const page = Number(params.get('page') || 0);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    apiGet(`/api/admin/dashboard?status=${status}&page=${page}`)
      .then(setData)
      .catch((exception) => setError(exception.message));
  }, [status, page]);

  const counts = {
    ALL: data?.totalComplaints,
    CHECKING: data?.checkingCount,
    PROCESSING: data?.processingCount,
    COMPLETED: data?.completedCount,
  };

  const changeStatus = (next) => setParams({ status: next, page: '0' });
  const complaints = data?.complaints?.items || [];

  return (
    <>
      {error && <div className="flash-message error">{error}</div>}

      <section
        className="stat-grid"
        aria-label="업무 현황"
      >
        {Object.entries(STATUS).map(([code, item]) => (
          <article
            key={code}
            className={status === code ? 'stat-card selected' : 'stat-card'}
          >
            <span className={`stat-icon ${item.tone}`}>{item.icon}</span>
            <div>
              <p>{code === 'ALL' ? '전체 민원' : item.label}</p>
              <a
                className="stat-number"
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  changeStatus(code);
                }}
              >
                {counts[code] ?? 0}
              </a>
              <small>{item.caption}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="admin-panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <b>{STATUS[status]?.label || '전체'}</b> 민원
              </h2>
            </div>
            <Link to={`/admin/complaints?status=${status}`}>전체보기 →</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>민원번호</th>
                  <th>신청인</th>
                  <th>제목</th>
                  <th>상태</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item.complaintNo}>
                    <td>{item.complaintNo}</td>
                    <td>{item.memberName}</td>
                    <td className="title-cell">
                      <button
                        className="complaint-title-button"
                        type="button"
                        onClick={() => setSelected(item)}
                      >
                        {item.title}
                      </button>
                    </td>
                    <td>
                      <span className={`admin-status ${item.statusCssClass}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td>{item.registeredDateTime}</td>
                  </tr>
                ))}
                {!complaints.length && (
                  <tr>
                    <td
                      className="table-empty"
                      colSpan="5"
                    >
                      접수된 민원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={data?.complaints}
            onChange={(next) => setParams({ status, page: String(next) })}
          />
        </article>

        <aside className="admin-panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>빠른 업무</h2>
            </div>
          </div>
          <Link to="/admin/complaints?status=CHECKING">
            <span>확인 대기 민원</span>
            <strong>{data?.checkingCount ?? 0}</strong>
          </Link>
          <Link to="/admin/notices/new">
            <span>공지사항 등록</span>
            <b>바로가기</b>
          </Link>
          <Link to="/admin/members">
            <span>이용 회원</span>
            <strong>{data?.activeMemberCount ?? 0}</strong>
          </Link>
        </aside>
      </section>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
