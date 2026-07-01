import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
// 이미지
import logo from '../../assets/logo.svg';
import logoTxt from '../../assets/logo_tx_black.svg';
import share from '../../assets/ic_share.svg';
import back from '../../assets/ic_back.svg';

interface HeaderProps {
  type: 'main' | 'detail' | 'sub' | 'none';
  title?: string;
}

export const Header = ({ type, title }: HeaderProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleShare = async () => {
    const shareData = {
      title: title || 'FinSwipe',
      text: '핀스와이프에서 흥미로운 뉴스를 확인해보세요!',
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다!');
      } catch {
        alert('공유하기를 지원하지 않는 브라우저입니다.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('logout'));
    setMenuOpen(false);
    navigate('/login');
  };

  if (type === 'none') return null;

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between w-full h-15 px-4 bg-white">
        {/* 좌측 */}
        {type === 'main' && (
          <h1 className="flex items-center">
            <img src={logo} alt="로고" className="h-10" />
            <img src={logoTxt} alt="FinSwipe" className="h-6.5" />
          </h1>
        )}
        {(type === 'detail' || type === 'sub') && (
          <div className="flex items-center gap-4">
            <button onClick={() => {
              if (type === 'detail') {
                window.dispatchEvent(new Event('homeRefresh'));
                navigate('/');
              } else {
                navigate(-1);
              }
            }} className="w-10 h-10 cursor-pointer">
              <img src={back} alt="뒤로가기" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        )}

        {/* 우측 */}
        <div className="flex items-center gap-2">
          {/* 공유 버튼 (detail만) */}
          {type === 'detail' && (
            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center">
              <img src={share} alt="공유하기" />
            </button>
          )}

          {/* 햄버거 메뉴 */}
          {isLoggedIn && (
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            >
              <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
              <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
              <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
            </button>
          )}
        </div>
      </header>

      {/* 햄버거 메뉴 드로어 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* 스크림 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            {/* 드로어 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 bg-white z-50 flex flex-col shadow-xl"
            >
              {/* 드로어 헤더 */}
              <div className="flex items-center justify-between px-5 pt-14 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="" className="h-8" />
                  <img src={logoTxt} alt="FinSwipe" className="h-5" />
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* 메뉴 아이템 */}
              <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
                <Link
                  to="/like"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">❤️</span>
                  <span className="text-base font-medium">관심종목</span>
                </Link>
                <Link
                  to="/terms"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">📄</span>
                  <span className="text-base font-medium">이용약관</span>
                </Link>
                <Link
                  to="/privacy"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">🔒</span>
                  <span className="text-base font-medium">개인정보처리방침</span>
                </Link>
              </nav>

              {/* 로그아웃 */}
              <div className="px-4 pb-10 border-t border-gray-100 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  <span className="text-base font-medium">로그아웃</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};