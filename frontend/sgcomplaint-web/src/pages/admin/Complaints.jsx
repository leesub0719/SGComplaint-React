import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet } from '../../shared/api.js';
import AnswerModal from './AnswerModal.jsx';

const STATUS_FILTERS = [
  ['ALL', '전체'],
  ['CHECKING', '확인중'],
  ['PROCESSING', '처리중'],
  ['COMPLETED', '답변완료'],
];

/**
 * 민원 처리 화면.
 *
 * 기존에는 답변을 저장하면 리다이렉트되면서 화면 전체가 다시 그려졌다.
 * 여기서는 목록만 다시 불러오므로 필터와 스크롤 위치가 유지된다.
 */
export default function Complaints() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'ALL';

  const [complaints, setComplaints] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setComplaints(await apiGet(`/api/admin/complaints?status=${status}`));
    } catch (exception) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // 처리상태 목록은 한 번만 받아오면 된다.
  useEffect(() => {
    apiGet('/api/admin/complaint-statuses').then(setStatuses).catch(() => {});
  }, []);

  function handleSaved(message) {
    setSelected(null);
    setAlert({ type: 'success', message });
    load();
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">COMPLAINTS</span>
          <h1>민원 처리</h1>
        </div>
        <span className="count">총 {complaints.length}건</span>
      </header>

      {alert && <p className={`message ${alert.type}`}>{alert.message}</p>}
      {error && <p className="message error">{error}</p>}

      <section className="panel">
        <div className="panel-header">
          <div className="filters">
            {STATUS_FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={status === value ? 'chip is-active' : 'chip'}
                onClick={() => setParams({ status: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="message">불러오는 중입니다.</p>}

        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>번dddd호</th><th>분류</th><th>제목</th><th>작성자</th>
                  <th>상태</th><th>등록일시</th><th>답변</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item.complaintNo}>
                    <td>{item.complaintNo}</td>
                    <td>{item.categoryLabel}</td>
                    <td className="title">{item.title}</td>
                    <td>{item.memberName}</td>
                    <td>
                      <span className={`badge ${item.statusCssClass}`}>{item.statusLabel}</span>
                    </td>
                    <td>{item.registeredDateTime}</td>
                    <td>
                      <button type="button" className="link" onClick={() => setSelected(item)}>
                        {item.answerContent ? '답변 수정' : '답변 등록'}
                      </button>
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan="7" className="message">해당 상태의 민원이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <AnswerModal
          complaint={selected}
          statuses={statuses}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
