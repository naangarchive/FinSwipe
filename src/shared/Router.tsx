import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from '../pages/Home';
import { NewsDetail } from "../pages/NewsDetail.tsx";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 홈 */}
        <Route path="/" element={<Home />} />
        {/* 뉴스 상세 */}
        <Route path="/detail/:id" element={<NewsDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;