import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePageView } from "../hooks/usePageView.ts";
//라우터
import { Home } from '../pages/Home.tsx';
import { NewsDetail } from "../pages/NewsDetail.tsx";
import { Login } from "../pages/Login.tsx";
import { Terms } from "../pages/Terms.tsx";
import { Privacy } from "../pages/Privacy.tsx";
import { NotFound } from "../pages/NotFound.tsx";

const PageViewTracker = () => {
  usePageView();
  return null;
};

const Router = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      setIsLoggedIn(!!token);
    };

    checkAuth();

    const handleLogout = () => setIsLoggedIn(false);
    const handleLogin = () => setIsLoggedIn(true);

    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, []);

  // 로딩 중
  if (isLoggedIn === null) return null;

  return (
    <BrowserRouter>
      <PageViewTracker />
      <Routes>
        {/* 로그인 */}
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" />} />
        {/* 메인 홈 */}
        <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
        {/* 뉴스 상세 */}
        <Route path="/detail/:id" element={isLoggedIn ? <NewsDetail /> : <Navigate to="/login" />} />
        {/* 이용약관 */}
        <Route path="/terms" element={isLoggedIn ? <Terms /> : <Navigate to="/login" />} />
        {/* 개인정보처리방침 */}
        <Route path="/privacy" element={isLoggedIn ? <Privacy /> : <Navigate to="/login" />} />
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;