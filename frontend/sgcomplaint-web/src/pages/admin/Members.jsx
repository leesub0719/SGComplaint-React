import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../shared/api.js';
import Pagination from '../../shared/Pagination.jsx';

const STATUS_OPTIONS = [['ALL', '전체'], ['Y', '활동'], ['N', '탈퇴']];
const ROLE_OPTIONS = [['ALL', '전체'], ['U', '일반회원'], ['A', '관리자'], ['M', '마스터']];
const ASSIGNABLE_ROLES = [['U', '일반회원'], ['A', '관리자'], ['M', '마스터']];

/**
 * 회원 관리 화면.
 *
 * 검색 조건과 페이지를 URL 쿼리로 유지한다. 기존 화면은 권한을 변경할 때마다
 * 검색 조건을 hidden 필드로 다시 실어 보내고 리다이렉트해야 했는데,
 * 여기서는 조건이 URL에 있으므로 목록만 다시 조회하면 된다.
 */
export default function Members() {
  const [params, setParams] = useSearchParams();
  const memberStatus = params.get('memberStatus') || 'ALL';
  const memberRole = params.get('memberRole') || 'ALL';
  const keyword = params.get('keyword') || '';
  const page = Number(params.get('page') || 0);

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [data, setData] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        memberStatus, memberRole, keyword, page: String(page),
      });
      setData(await apiGet(`/api/admin/members?${query}`));
    } catch (exception) {
      setAlert({ type: 'error', message: exception.message });
    } finally {
      setLoading(false);
    }
  }, [memberStatus, memberRole, keyword, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setKeywordInput(keyword); }, [keyword]);

  const applyFilter = (patch) => setParams({
    memberStatus, memberRole, keyword, page: '0', ...patch,
  });

  async function changeRole(member, role) {
    if (role === member.roleCode) return;
    if (!window.confirm(`${member.empName}(${member.empId})님의 권한을 변경하시겠습니까?`)) {
      return;
    }
    try {
      const result = await apiPost(`/api/admin/members/${member.empNo}/role`, { role });
      setAlert({ type: 'success', message: result.message });
      load();
    } catch (exception) {
      setAlert({ type: 'error', message: exception.message });
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">MEMBERS</span>
          <h1>회원 관리</h1>
        </div>
        {data && <span className="count">검색 {data.members.totalElements}명</span>}
      </header>

      {alert && <p className={`message ${alert.type}`}>{alert.message}</p>}

      <section className="stat-row">
        <StatCard label="전체" value={data?.totalMemberCount} />
        <StatCard label="활동" value={data?.activeMemberCount} />
        <StatCard label="탈퇴" value={data?.withdrawnMemberCount} />
        <StatCard label="관리자" value={data?.administratorCount} />
        <StatCard label="마스터" value={data?.masterCount} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="filters">
            <select value={memberStatus} onChange={(e) => applyFilter({ memberStatus: e.target.value })}>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>상태: {label}</option>
              ))}
            </select>
            <select value={memberRole} onChange={(e) => applyFilter({ memberRole: e.target.value })}>
              {ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>권한: {label}</option>
              ))}
            </select>
          </div>

          <form
            className="search"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilter({ keyword: keywordInput.trim() });
            }}
          >
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="아이디 · 이름 검색"
            />
            <button type="submit">검색</button>
          </form>
        </div>

        {loading && <p className="message">불러오는 중입니다.</p>}

        {!loading && data && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>아이디</th><th>이름</th><th>연락처</th>
                    <th>상태</th><th>가입일</th><th>권한</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.items.map((member) => (
                    <tr key={member.empNo}>
                      <td>
                        {member.empId}
                        {member.currentAdministrator && <span className="tag">나</span>}
                      </td>
                      <td>{member.empName}</td>
                      <td>{member.empPhone}</td>
                      <td>
                        <span className={member.statusCode === 'Y' ? 'badge active' : 'badge'}>
                          {member.statusLabel}
                        </span>
                      </td>
                      <td>{member.createdDate}</td>
                      <td>
                        <select
                          value={member.roleCode}
                          disabled={member.statusCode !== 'Y' || member.currentAdministrator}
                          onChange={(event) => changeRole(member, event.target.value)}
                        >
                          {ASSIGNABLE_ROLES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {data.members.items.length === 0 && (
                    <tr><td colSpan="6" className="message">검색 결과가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={{
              ...data.members,
              onChange: (next) => setParams({
                memberStatus, memberRole, keyword, page: String(next),
              }),
            }} />
          </>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}
