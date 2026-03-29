import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from '../pages/Home';
import { NewsDetail } from "../pages/NewsDetail.tsx";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detail/:id" element={<NewsDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;