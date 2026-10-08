import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import Pagination from '../../shared/Pagination.jsx';

const STATUS_FILTERS = [
  ['ALL', '전체'],
  ['CHECKING', '확인중'],
  ['PROCESSING', '처리중'],
  ['COMPLETED', '답변완료'],
];

/**
 * 관리자 대시보드.
 *
 * 필터와 페이지 번호를 useState가 아니라 URL 쿼리(useSearchParams)에 둔다.
 * 새로고침해도 상태가 유지되고, 특정 목록 화면을 링크로 공유할 수 있다.
 */
export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'ALL';
  const page = Number(params.get('page') || 0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    apiGet(`/api/admin/dashboard?status=${status}&page=${page}`)
      .then(setData)
      .catch((exception) => {
        if (exception.name !== 'AbortError') setError(exception.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [status, page]);

  const update = (next) => setParams(next, { replace: false });

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <h1>대시보드</h1>
        </div>
      </header>

      {error && <p className="message error">{error}</p>}

      <section className="stat-row">
        <StatCard label="전체 민원" value={data?.totalComplaints} />
        <StatCard label="확인중" value={data?.checkingCount} tone="checking" />
        <StatCard label="처리중" value={data?.processingCount} tone="processing" />
        <StatCard label="답변완료" value={data?.completedCount} tone="completed" />
        <StatCard label="활동 회원" value={data?.activeMemberCount} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>최근 민원</h2>
          <div className="filters">
            {STATUS_FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={status === value ? 'chip is-active' : 'chip'}
                onClick={() => update({ status: value, page: '0' })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="message">불러오는 중입니다.</p>}

        {!loading && data && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>번호</th><th>분류</th><th>제목</th>
                    <th>작성자</th><th>상태</th><th>등록일시</th>
                  </tr>
                </thead>
                <tbody>
                  {data.complaints.items.map((item) => (
                    <tr key={item.complaintNo}>
                      <td>{item.complaintNo}</td>
                      <td>{item.categoryLabel}</td>
                      <td className="title">{item.title}</td>
                      <td>{item.memberName}</td>
                      <td>
                        <span className={`badge ${item.statusCssClass}`}>{item.statusLabel}</span>
                      </td>
                      <td>{item.registeredDateTime}</td>
                    </tr>
                  ))}
                  {data.complaints.items.length === 0 && (
                    <tr><td colSpan="6" className="message">민원이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={{
              ...data.complaints,
              onChange: (next) => update({ status, page: String(next) }),
            }} />
          </>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={tone ? `stat-card ${tone}` : 'stat-card'}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}
