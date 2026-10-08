import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { apiGet, logout } from './api.js';

const PAGE_META = {
  '/admin/dashboard': ['대시보드', '민원 처리 현황과 주요 업무를 확인합니다.'],
  '/admin/main-page': ['메인페이지 관리', '사용자 메인에 노출할 상단 배너 이미지를 관리합니다.'],
  '/admin/complaints': ['민원 관리', '접수 내용을 확인하고 답변과 처리상태를 관리합니다.'],
  '/admin/notices': ['공지사항', '등록된 공지사항을 확인하고 관리합니다.'],
  '/admin/routes': ['운행안내 추가', '마을버스와 똑버스 노선 정보를 등록하고 관리합니다.'],
  '/admin/members': ['회원 관리', '회원 검색과 상태·권한 관리 화면입니다.'],
  '/admin/partners': ['협력업체', '협력업체 명함 정보를 등록하고 관리합니다.'],
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [member, setMember] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const noticeFormMeta = pathname.endsWith('/new')
    ? ['공지사항 등록', '고객에게 안내할 공지사항을 작성합니다.']
    : pathname.endsWith('/edit')
      ? ['공지사항 수정', '등록된 공지사항의 내용과 게시 설정을 수정합니다.']
      : null;
  const [title, description] =
    noticeFormMeta || PAGE_META[pathname] || PAGE_META['/admin/dashboard'];
  useEffect(() => {
    apiGet('/api/layout/me').then(setMember);
  }, []);
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  const navClass = ({ isActive }) => (isActive ? 'active' : undefined);
  return (
    <div className="admin-shell">
      <aside className={sidebarOpen ? 'admin-sidebar open' : 'admin-sidebar'}>
        <Link
          className="admin-brand"
          to="/admin/dashboard"
        >
          <span
            className="brand-icon"
            aria-hidden="true"
          >
            013
          </span>
          <span>
            <strong>(주) 서경 마을버스</strong>
            <small>민원 관리 시스템</small>
          </span>
        </Link>
        <nav
          className="admin-nav"
          aria-label="관리자 메뉴"
        >
          <p>WORKSPACE</p>
          <NavLink
            className={navClass}
            to="/admin/dashboard"
          >
            <span>▦</span> 대시보드
          </NavLink>
          <NavLink
            className={navClass}
            to="/admin/main-page"
          >
            <span>▧</span> 메인페이지 관리
          </NavLink>
          <NavLink
            className={navClass}
            to="/admin/complaints"
          >
            <span>▤</span> 민원 관리
          </NavLink>
          <NavLink
            className={navClass}
            to="/admin/notices"
          >
            <span>◫</span> 공지사항
          </NavLink>
          <NavLink
            className={navClass}
            to="/admin/routes"
          >
            <span>↝</span> 운행안내 추가
          </NavLink>
          <NavLink
            className={navClass}
            to="/admin/members"
          >
            <span>♙</span> 회원 관리
          </NavLink>
          {member?.master && (
            <NavLink
              className={navClass}
              to="/admin/partners"
            >
              <span>♧</span> 협력업체
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">사용자 메인으로</Link>
          <button
            type="button"
            onClick={() => logout()}
          >
            로그아웃
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="sidebar-toggle"
            type="button"
            aria-label="관리자 메뉴 열기"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            ☰
          </button>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="admin-profile">
            <span className="profile-avatar">{member?.master ? 'M' : 'A'}</span>
            <span>
              <strong>{member?.memberName || '관리자'}</strong>
              <small>{member?.roleLabel || 'Administrator'}</small>
            </span>
          </div>
        </header>
        <main className="admin-content">
          <Outlet context={{ member }} />
        </main>
      </div>
      <button
        className="sidebar-overlay"
        type="button"
        aria-label="관리자 메뉴 닫기"
        hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}
