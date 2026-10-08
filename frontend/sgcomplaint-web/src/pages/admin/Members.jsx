import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../shared/api.js';
import AdminPagination from './AdminPagination.jsx';

const ROLE_OPTIONS = [
  ['ALL', '전체 권한'],
  ['U', '사용자'],
  ['A', '관리자'],
  ['M', '마스터'],
];

export default function Members() {
  const { member: administrator } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const memberStatus = params.get('memberStatus') || 'ALL';
  const memberRole = params.get('memberRole') || 'ALL';
  const keyword = params.get('keyword') || '';
  const page = Number(params.get('page') || 0);
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ memberStatus, memberRole, keyword, page: String(page) });
      setData(await apiGet(`/api/admin/members?${query}`));
    } catch (exception) {
      setAlert({ type: 'error', message: exception.message });
    }
  }, [memberStatus, memberRole, keyword, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const move = (patch) => setParams({ memberStatus, memberRole, keyword, page: '0', ...patch });
  const summaryFilter = (status, role) =>
    setParams({ memberStatus: status, memberRole: role, keyword: '', page: '0' });

  async function changeRole(target) {
    const role = roleDrafts[target.empNo] || target.roleCode;
    if (role === target.roleCode) return;
    const label = role === 'M' ? '마스터' : role === 'A' ? '관리자' : '사용자';
    if (!confirm(`${target.empName} 회원의 권한을 ${label}(으)로 변경하시겠습니까?`)) return;
    try {
      const result = await apiPost(`/api/admin/members/${target.empNo}/role`, { role });
      setAlert({ type: 'success', message: result.message });
      load();
    } catch (exception) {
      setAlert({ type: 'error', message: exception.message });
    }
  }

  const members = data?.members?.items || [];

  return (
    <>
      {alert && <div className={`flash-message ${alert.type}`}>{alert.message}</div>}

      <section
        className="member-summary-grid"
        aria-label="회원 현황"
      >
        <Summary
          label="전체 회원"
          value={data?.totalMemberCount}
          caption="등록된 전체 계정"
          onClick={() => summaryFilter('ALL', 'ALL')}
        />
        <Summary
          label="이용중"
          value={data?.activeMemberCount}
          caption="상태 Y"
          onClick={() => summaryFilter('Y', 'ALL')}
        />
        <Summary
          label="탈퇴 회원"
          value={data?.withdrawnMemberCount}
          caption="상태 N"
          onClick={() => summaryFilter('N', 'ALL')}
        />
        <Summary
          label="관리자"
          value={data?.administratorCount}
          caption="권한 A"
          onClick={() => summaryFilter('ALL', 'A')}
        />
        <Summary
          label="마스터"
          value={data?.masterCount}
          caption="권한 M"
          onClick={() => summaryFilter('ALL', 'M')}
        />
      </section>

      <section className="admin-panel member-panel">
        <div className="panel-heading">
          <div>
            <h2>회원 목록</h2>
          </div>
          <em>
            검색 결과 <b>{data?.members?.totalElements ?? 0}</b>명
          </em>
        </div>

        <form
          className="member-search"
          onSubmit={(event) => {
            event.preventDefault();
            move({ keyword: keywordInput.trim() });
          }}
        >
          <label
            className="sr-only"
            htmlFor="member-status"
          >
            회원 상태
          </label>
          <select
            id="member-status"
            value={memberStatus}
            onChange={(event) => move({ memberStatus: event.target.value })}
          >
            <option value="ALL">전체 상태</option>
            <option value="Y">이용중</option>
            <option value="N">탈퇴 회원</option>
          </select>
          <label
            className="sr-only"
            htmlFor="member-role"
          >
            회원 권한
          </label>
          <select
            id="member-role"
            value={memberRole}
            onChange={(event) => move({ memberRole: event.target.value })}
          >
            {ROLE_OPTIONS.map(([code, label]) => (
              <option
                key={code}
                value={code}
              >
                {label}
              </option>
            ))}
          </select>
          <label
            className="sr-only"
            htmlFor="member-keyword"
          >
            아이디 또는 이름
          </label>
          <input
            id="member-keyword"
            type="search"
            maxLength="50"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="아이디·이름·이메일·전화번호 앞부분 검색"
          />
          <button type="submit">검색</button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table member-table">
            <thead>
              <tr>
                <th>회원번호</th>
                <th>아이디</th>
                <th>이름</th>
                <th>휴대전화</th>
                <th>권한</th>
                <th>상태</th>
                <th>가입일</th>
                <th>권한 관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((item) => {
                const masterLocked = item.roleCode === 'M' && !administrator?.master;
                const disabled = item.currentAdministrator || masterLocked;
                return (
                  <tr key={item.empNo}>
                    <td>{item.empNo}</td>
                    <td>
                      <button
                        className="member-id-button"
                        type="button"
                        onClick={() => setSelected(item)}
                      >
                        {item.empId}
                      </button>
                      {item.currentAdministrator && (
                        <small className="current-account-label">현재 계정</small>
                      )}
                      {item.withdrawalOriginalId && (
                        <small>탈퇴 전: {item.withdrawalOriginalId}</small>
                      )}
                    </td>
                    <td>{item.empName}</td>
                    <td>{item.empPhone}</td>
                    <td>
                      <RoleBadge member={item} />
                    </td>
                    <td>
                      <StatusBadge member={item} />
                    </td>
                    <td>{item.createdDate}</td>
                    <td>
                      {item.currentAdministrator && (
                        <span className="self-role-lock">변경 불가</span>
                      )}
                      {masterLocked && <span className="self-role-lock">마스터 전용</span>}
                      {!disabled && (
                        <div className="member-role-form">
                          <select
                            aria-label={`${item.empName} 회원 권한`}
                            value={roleDrafts[item.empNo] || item.roleCode}
                            onChange={(event) =>
                              setRoleDrafts({ ...roleDrafts, [item.empNo]: event.target.value })
                            }
                          >
                            <option value="U">사용자</option>
                            <option value="A">관리자</option>
                            {administrator?.master && <option value="M">마스터</option>}
                          </select>
                          <button
                            type="button"
                            onClick={() => changeRole(item)}
                          >
                            변경
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!members.length && (
                <tr>
                  <td
                    className="table-empty"
                    colSpan="8"
                  >
                    검색 조건에 해당하는 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data?.members}
          radius={2}
          onChange={(next) => setParams({ memberStatus, memberRole, keyword, page: String(next) })}
        />
        <p className="member-role-notice">
          권한을 변경한 회원은 로그아웃 후 다시 로그인해야 새 권한이 적용됩니다.
        </p>
      </section>

      {selected && (
        <MemberModal
          member={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function Summary({ label, value, caption, onClick }) {
  return (
    <article>
      <span>{label}</span>
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onClick();
        }}
      >
        {value ?? 0}
      </a>
      <small>{caption}</small>
    </article>
  );
}

function RoleBadge({ member }) {
  const type = member.roleCode === 'M' ? 'master' : member.roleCode === 'A' ? 'admin' : 'user';
  return <span className={`member-role-badge ${type}`}>{member.roleLabel}</span>;
}

function StatusBadge({ member }) {
  return (
    <span className={`member-status-badge ${member.statusCode === 'Y' ? 'active' : 'withdrawn'}`}>
      {member.statusLabel}
    </span>
  );
}

function MemberModal({ member, onClose }) {
  return (
    <div className="member-modal">
      <div
        className="member-modal-backdrop"
        onClick={onClose}
      />
      <section
        className="member-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
      >
        <header className="member-modal-header">
          <div>
            <h2 id="member-modal-title">회원 상세정보</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="member-modal-body">
          <div className="member-profile-summary">
            <span>{member.empName?.slice(0, 1)}</span>
            <div>
              <strong>{member.empName}</strong>
              <p>
                <b>{member.empId}</b> · 회원번호 <em>{member.empNo}</em>
              </p>
            </div>
            <StatusBadge member={member} />
          </div>
          <dl className="member-detail-grid">
            <div>
              <dt>회원번호</dt>
              <dd>{member.empNo}</dd>
            </div>
            <div>
              <dt>아이디</dt>
              <dd>{member.empId}</dd>
            </div>
            {member.withdrawalOriginalId && (
              <div>
                <dt>탈퇴 전 아이디</dt>
                <dd>{member.withdrawalOriginalId}</dd>
              </div>
            )}
            <div>
              <dt>이름</dt>
              <dd>{member.empName}</dd>
            </div>
            <div>
              <dt>휴대전화</dt>
              <dd>{member.empPhone}</dd>
            </div>
            <div className="wide">
              <dt>이메일</dt>
              <dd>{member.empEmail || '-'}</dd>
            </div>
            <div className="wide">
              <dt>주소</dt>
              <dd>{member.empAddress || '-'}</dd>
            </div>
            <div>
              <dt>권한</dt>
              <dd>
                <RoleBadge member={member} />
              </dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>
                <StatusBadge member={member} />
              </dd>
            </div>
            <div>
              <dt>가입일시</dt>
              <dd>{member.createdDateTime}</dd>
            </div>
            <div>
              <dt>수정일시</dt>
              <dd>{member.updatedDateTime}</dd>
            </div>
          </dl>
          <p className="password-security-notice">
            비밀번호는 BCrypt로 암호화되어 저장되며 관리자 화면에도 표시하지 않습니다.
          </p>
        </div>
        <footer className="member-modal-footer">
          <button
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
