import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './shared/PublicLayout.jsx';
import AdminLayout from './shared/AdminLayout.jsx';
import ComplaintList from './pages/complaints/List.jsx';
import ComplaintNew from './pages/complaints/New.jsx';
import ComplaintDetail from './pages/complaints/Detail.jsx';
import MyPage from './pages/mypage/MyPage.jsx';
import MyInquiries from './pages/mypage/MyInquiries.jsx';
import Account from './pages/account/Account.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminComplaints from './pages/admin/Complaints.jsx';
import AdminMembers from './pages/admin/Members.jsx';
import Home from './pages/home/Home.jsx';
import Login from './pages/account/Login.jsx';
import NoticeList from './pages/notices/List.jsx';
import NoticeDetail from './pages/notices/Detail.jsx';
import Greeting from './pages/company/Greeting.jsx';
import RouteList from './pages/routes/Routes.jsx';
import ComingSoon from './pages/common/ComingSoon.jsx';
import AdminNotices from './pages/admin/Notices.jsx';
import AdminRoutes from './pages/admin/Routes.jsx';
import AdminPartners from './pages/admin/Partners.jsx';
import AdminMainPage from './pages/admin/MainPage.jsx';

/** 공개 화면과 관리자 화면을 하나의 React SPA로 구성한다. */
export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/complaints"
            element={<ComplaintList />}
          />
          <Route
            path="/complaints/new"
            element={<ComplaintNew />}
          />
          <Route
            path="/complaints/:complaintNo"
            element={<ComplaintDetail />}
          />
          <Route
            path="/notices"
            element={<NoticeList />}
          />
          <Route
            path="/notices/:noticeNo"
            element={<NoticeDetail />}
          />
          <Route
            path="/company/greeting"
            element={<Greeting />}
          />
          <Route
            path="/company/:section"
            element={<ComingSoon title="회사소개" />}
          />
          <Route
            path="/route/:type"
            element={<RouteList />}
          />
          <Route
            path="/recruit/notices"
            element={<ComingSoon title="채용공고" />}
          />
          <Route
            path="/mypage"
            element={<MyPage />}
          />
          <Route
            path="/mypage/inquiries"
            element={<MyInquiries />}
          />
          <Route
            path="/account/:tab"
            element={<Account />}
          />
          <Route
            path="/account"
            element={
              <Navigate
                to="/account/signup"
                replace
              />
            }
          />
        </Route>

        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />
          <Route
            path="complaints"
            element={<AdminComplaints />}
          />
          <Route
            path="members"
            element={<AdminMembers />}
          />
          <Route
            path="notices"
            element={<AdminNotices />}
          />
          <Route
            path="notices/new"
            element={<AdminNotices />}
          />
          <Route
            path="notices/:noticeNo/edit"
            element={<AdminNotices />}
          />
          <Route
            path="routes"
            element={<AdminRoutes />}
          />
          <Route
            path="partners"
            element={<AdminPartners />}
          />
          <Route
            path="main-page"
            element={<AdminMainPage />}
          />
        </Route>

        <Route
          path="*"
          element={<p className="message">존재하지 않는 페이지입니다.</p>}
        />
      </Routes>
    </BrowserRouter>
  );
}
