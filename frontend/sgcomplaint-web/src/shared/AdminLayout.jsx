import { NavLink, Outlet } from 'react-router-dom';
import { logout } from './api.js';

/** 관리자 화면 레이아웃 (사이드바 + 본문). */
export default function AdminLayout() {
  const linkClass = ({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span>013</span>
          <div>
            <strong>서경 마을버스</strong>
            <small>관리자</small>
          </div>
        </div>

        <nav>
          <NavLink className={linkClass} to="/admin/dashboard">대시보드</NavLink>
          <NavLink className={linkClass} to="/admin/complaints">민원 처리</NavLink>
          <NavLink className={linkClass} to="/admin/members">회원 관리</NavLink>
          <NavLink className={linkClass} to="/admin/notices">공지 관리</NavLink>
          <NavLink className={linkClass} to="/admin/routes">노선 관리</NavLink>
          <NavLink className={linkClass} to="/admin/partners">협력업체</NavLink>
          <NavLink className={linkClass} to="/admin/main-page">메인 화면</NavLink>
        </nav>

        <div className="sidebar-footer">
          <a href="/app/">사이트로 이동</a>
          <button type="button" onClick={() => logout()}>로그아웃</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
